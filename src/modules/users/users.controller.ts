import * as Sentry from '@sentry/node';

import {
  Controller,
  Get,
  Delete,
  Post,
  Put,
  Body,
  Param,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiImplicitParam,
  ApiOperation,
  ApiUseTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import Config from '../../config';
import { UserDto } from '../common/dto/user.dto';
import { UsersService } from '../common/users.service';
import { Auth0Service } from '../common/auth0.service';
import { FileService } from '../common/file.service';
import { MentorsService } from '../common/mentors.service';
import { Role, User } from '../common/interfaces/user.interface';
import { EmailService } from '../email/email.service';
import { Template } from '../email/interfaces/email.interface';
import { ListDto } from '../lists/dto/list.dto';
import { ListsService } from '../lists/lists.service';
import { filterImages } from '../../utils/mimes';

@ApiUseTags('/users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly mentorService: MentorsService,
    private readonly auth0Service: Auth0Service,
    private readonly listsService: ListsService,
    private readonly fileService: FileService,
  ) {}

  @ApiOperation({ title: 'Return all registered users' })
  @Get()
  async index() {
    const data: User[] = await this.usersService.findAll();

    return {
      success: true,
      data,
    };
  }

  @ApiOperation({ title: 'Returns the current user' })
  @Get('current')
  async currentUser(@Req() request) {
    const userId: string = request.user.auth0Id;
    const currentUser: User = await this.usersService.findByAuth0Id(userId);
    const response = {
      success: true,
      data: currentUser,
    };

    if (!currentUser) {
      try {
        const data: any = await this.auth0Service.getAdminAccessToken();
        const user: any = await this.auth0Service.getUserProfile(
          data.access_token,
          userId,
        );

        // If the user couldn't be found by the auth0Id, try to see whether we
        // can find one by the email. If so, we have a mentor that was imported
        // for which we just need to add the auth0Id
        const existingMentor = await this.usersService.findByEmail(user.email);
        if (existingMentor) {
          const userDto: UserDto = new UserDto({
            _id: existingMentor._id,
            auth0Id: userId,
          });

          await this.usersService.update(userDto);
          response.data = existingMentor;
        } else {
          // If the user doesn't exist in the database we need
          // to add it because this is a new user. The initial
          // information is coming from auth0
          const userDto: UserDto = new UserDto({
            auth0Id: userId,
            email: user.email,
            name: user.nickname,
            avatar: user.picture,
            roles: [Role.MEMBER],
          });

          const newUser: User = await this.usersService.create(userDto);

          // We need to create an emty favorite list
          const favorites: ListDto = new ListDto({
            name: 'Favorites',
            isFavorite: true,
            user: newUser,
            mentors: [],
          });

          await this.listsService.createList(favorites);

          const emailData = {
            to: userDto.email,
            templateId: Template.WELCOME_MESSAGE,
          };

          this.emailService.send(emailData);

          response.data = newUser;
        }
      } catch (error) {
        return {
          success: false,
          error,
        };
      }
    }

    Sentry.configureScope(scope => {
      scope.setUser({
        id: response.data._id,
        email: response.data.email,
        username: response.data.name,
      });
    });

    return response;
  }

  @ApiOperation({ title: 'Returns a single user by ID' })
  @ApiImplicitParam({ name: 'id', description: 'The user _id' })
  @Get(':id')
  async show(@Param() params) {
    const data: User = await this.usersService.findById(params.id);

    if (!data) {
      throw new BadRequestException('User not found');
    }

    return {
      success: true,
      data,
    };
  }

  @ApiOperation({ title: 'Updates an existing user' })
  @ApiImplicitParam({ name: 'id', description: 'The user _id' })
  @Put(':id')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      skipMissingProperties: true,
      whitelist: true,
    }),
  )
  async update(@Req() request, @Param() params, @Body() data: UserDto) {
    const current: User = await this.usersService.findByAuth0Id(
      request.user.auth0Id,
    );
    const user: User = await this.usersService.findById(params.id);

    // Users should only update their own data
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only admins can update other users
    if (!user._id.equals(current._id) && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException(
        'Not authorized to perform this operation',
      );
    }

    // Only an admin can update the roles
    let roles: Role[] = user.roles;
    if (data.roles && current.roles.includes(Role.ADMIN)) {
      roles = data.roles;
    }

    const userDto: UserDto = new UserDto({
      ...data,
      roles,
      email: user.email,
      _id: user._id,
    });
    const res: any = await this.usersService.update(userDto);

    return {
      success: res.ok === 1,
    };
  }

  @ApiOperation({ title: 'Deletes the given user' })
  @ApiImplicitParam({ name: 'id', description: 'The user _id' })
  @Delete(':id')
  async remove(@Req() request, @Param() params) {
    const current: User = await this.usersService.findByAuth0Id(
      request.user.auth0Id,
    );
    const user: User = await this.usersService.findById(params.id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only own user or admins can remove the given user
    if (!user._id.equals(current._id) && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException(
        'Not authorized to perform this operation',
      );
    }

    try {
      // Remove all records from our database
      await this.mentorService.removeAllApplicationsByUserId(params.id);
      const res: any = await this.usersService.remove(params.id);

      // Remove the user from auth0
      const auth0: any = await this.auth0Service.getAdminAccessToken();
      await this.auth0Service.deleteUser(auth0.access_token, user.auth0Id);

      // Send email to the deleted user
      if (res.ok && current.roles.includes(Role.ADMIN)) {
        const emailData = {
          to: user.email,
          templateId: Template.USER_DELETED,
          dynamic_template_data: {
            reason: params.reason,
          },
        };
        this.emailService.send(emailData);
      }

      return {
        success: res.ok === 1,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @ApiOperation({ title: 'Upload an avatar for the given user' })
  @ApiImplicitParam({ name: 'id', description: 'The user _id' })
  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('image', {
      dest: `${Config.files.public}/${Config.files.avatars}`,
      fileFilter: filterImages,
    }),
  )
  async uploadAvatar(@Req() request, @Param() params, @UploadedFile() image) {
    const imagePath = `${Config.files.public}/${Config.files.avatars}/${image &&
      image.filename}`;
    const current: User = await this.usersService.findByAuth0Id(
      request.user.auth0Id,
    );
    const user: User = await this.usersService.findById(params.id);

    if (!image) {
      throw new BadRequestException('We only support JPEG, PNG and SVG files');
    }

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only own user or admins can remove the given user
    if (!user._id.equals(current._id) && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException(
        'Not authorized to perform this operation',
      );
    }

    // Check if there's a previous avatar in disk, if so we need to remove it
    if (user.image) {
      await this.fileService.removeFile(
        `${Config.files.public}/${Config.files.avatars}/${user.image.filename}`,
      );
      await this.fileService.removeFile(
        `${Config.files.public}/${Config.files.avatars}/tns/${
          user.image.filename
        }`,
      );
    }

    let avatar = `/${Config.files.avatars}/tns/${image.filename}`;
    try {
      // Resize image to make sure we have avatars with the same size
      await this.fileService.createThumbnail(
        imagePath,
        `${Config.files.public}${avatar}`,
        {
          width: 200,
          height: 200,
        },
      );
    } catch (error) {
      console.log(error);
      avatar = `/${Config.files.avatars}/${image.filename}`;
    }

    const userDto: UserDto = new UserDto({
      _id: user._id,
      avatar,
      image,
    });
    const res: any = await this.usersService.update(userDto);

    return {
      success: res.ok === 1,
    };
  }
}
