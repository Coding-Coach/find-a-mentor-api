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
import { UserRecordDto } from '../common/dto/user-record.dto';
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
import { MentorshipsService } from '../mentorships/mentorships.service';

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
    private readonly mentorshipsService: MentorshipsService,
  ) {}

  @ApiOperation({ title: 'Return all registered users' })
  @Get()
  async index(@Req() request) {
    const userId: string = request.user.auth0Id;
    const current: User = await this.usersService.findByAuth0Id(userId);

    // Only admins can get the lists of all users
    if (!current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException(
        'Not authorized to perform this operation',
      );
    }

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

          this.emailService.sendLocalTemplate({
            to: userDto.email,
            name: 'welcome',
            subject: 'Welcome to Coding Coach! 🥳',
            data: {
              name: userDto.name,
            },
          });

          response.data = newUser;
        }
      } catch (error) {
        return {
          success: false,
          error,
        };
      }
    }

    Sentry.configureScope((scope) => {
      scope.setUser({
        id: response.data._id,
        email: response.data.email,
        username: response.data.name,
      });
    });

    return response;
  }

  private async shouldIncludeChannels(user?: User) {
    if (!user) {
      return false;
    }
    if (user.roles.includes(Role.ADMIN)) {
      return true;
    }
    const mentorships = await this.mentorshipsService.findMentorshipsByUser(
      user._id,
    );
    return mentorships.some(
      ({ mentee, mentor }) =>
        mentor?._id.equals(user._id) || mentee?._id.equals(user._id),
    );
  }

  @ApiOperation({ title: 'Returns a single user by ID' })
  @ApiImplicitParam({ name: 'id', description: 'The user _id' })
  @Get(':id')
  async show(@Req() request, @Param() params) {
    const [current, requestedUser]: [User, User] = await Promise.all([
      request.user
        ? this.usersService.findByAuth0Id(request.user.auth0Id)
        : Promise.resolve(null),
      this.usersService.findById(params.id),
    ]);

    if (!requestedUser) {
      throw new BadRequestException('User not found');
    }
    const { channels, email, ...user } = requestedUser;
    const showChannels = await this.shouldIncludeChannels(current);
    const data = {
      ...user,
      email: current?.roles?.includes(Role.ADMIN) ? email : undefined,
      channels: showChannels ? channels : [],
    };

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
    const [current, user]: [User, User] = await Promise.all([
      this.usersService.findByAuth0Id(request.user.auth0Id),
      await this.usersService.findById(params.id),
    ]);

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
    const [current, user]: [User, User] = await Promise.all([
      this.usersService.findByAuth0Id(request.user.auth0Id),
      this.usersService.findById(params.id),
    ]);

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
    const imagePath = `${Config.files.public}/${Config.files.avatars}/${
      image && image.filename
    }`;
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
        `${Config.files.public}/${Config.files.avatars}/tns/${user.image.filename}`,
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
      console.log(error); // tslint:disable-line no-console
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

  //#region admin
  @ApiOperation({ title: 'Add a record to user' })
  @ApiImplicitParam({ name: 'id', description: 'The user _id' })
  @Post(':id/records')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      skipMissingProperties: true,
      whitelist: true,
    }),
  )
  async addRecord(
    @Req() request,
    @Param() _params,
    @Body() data: UserRecordDto,
  ) {
    const [current, user]: [User, User] = await Promise.all([
      this.usersService.findByAuth0Id(request.user.auth0Id),
      await this.usersService.findById(data.user),
    ]);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException(
        'Not authorized to perform this operation',
      );
    }

    const res = await this.usersService.addRecord(data);

    return {
      success: true,
      data: res,
    };
  }

  @ApiOperation({ title: 'Get user records' })
  @ApiImplicitParam({ name: 'id', description: 'The user _id' })
  @Get(':id/records')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      skipMissingProperties: true,
      whitelist: true,
    }),
  )
  async getRecords(@Req() request, @Param() params) {
    const [current, user]: [User, User] = await Promise.all([
      this.usersService.findByAuth0Id(request.user.auth0Id),
      await this.usersService.findById(params.id),
    ]);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException(
        'Not authorized to perform this operation',
      );
    }

    const res = await this.usersService.getRecords(params.id);

    return {
      success: true,
      data: res,
    };
  }
  //#endregion
}
