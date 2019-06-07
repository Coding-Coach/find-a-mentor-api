import { Controller, Get, Delete, Put, Body, Param, Req, UnauthorizedException, BadRequestException, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiImplicitParam, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import fetch from 'node-fetch';
import Config from '../../config';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';
import { Role, User } from './interfaces/user.interface';

@ApiUseTags('/users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) { }

  @ApiOperation({ title: 'Return all registered users' })
  @Get()
  async index() {
    const data: Array<User> = await this.usersService.findAll();

    return {
      success: true,
      data,
    };
  }

  @ApiOperation({ title: 'Returns the current user' })
  @Get('current')
  async currentUser(@Req() request: Request) {
    const userId: string = request.user.id;
    const currentUser: User = await this.usersService.find(userId);

    if (!currentUser) {
      // If the user doesn't exist in the database we need
      // to add it because this is a new user. The initial
      // information is coming from auth0
      try {
        const data: any = await this.getAdminAccessToken();
        const user: any = await this.getUserProfile(data.access_token, userId);
        const userDto: UserDto = new UserDto({
          id: userId,
          email: user.email,
          name: user.nickname,
          avatar: user.picture,
          roles: [Role.MEMBER],
        });

        this.usersService.create(userDto);

        return {
          success: true,
          data: userDto,
        };
      } catch (error) {
        return {
          success: false,
          error,
        };
      }
    }

    return {
      success: true,
      data: currentUser,
    };
  }

  @ApiOperation({ title: 'Returns a single user by ID' })
  @ApiImplicitParam({ name: 'id', description: 'The auth0 `sub` value (eg: `auth0|abc12345`)' })
  @Get(':id')
  async show(@Param() params) {
    const user: User = await this.usersService.find(params.id);

    if (user === undefined) {
      throw new BadRequestException('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  @ApiOperation({ title: 'Updates an existing user' })
  @ApiImplicitParam({ name: 'id', description: 'The auth0 `sub` value (eg: `auth0|abc12345`)' })
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, skipMissingProperties: true }))
  async update(@Req() request: Request, @Param() params, @Body() data: UserDto) {
    const current: User = await this.usersService.find(request.user.id);
    const user: User = await this.usersService.find(params.id);

    // Users should only update their own data
    if (user === undefined) {
      throw new BadRequestException('User not found');
    }

    // Only admins can update other users
    if (user.id !== current.id && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException('Not authorized to perform this operation');
    }

    // Only an admin can update the roles
    let roles: Array<Role> = user.roles;
    if (data.roles && current.roles.includes(Role.ADMIN)) {
      roles = data.roles;
    }

    const userDto: UserDto = new UserDto({
      ...data,
      roles,
      id: user.id,
    });
    const res: any = await this.usersService.update(userDto);

    return {
      success: res.ok === 1,
    };
  }

  @ApiOperation({ title: 'Deletes the given user' })
  @ApiImplicitParam({ name: 'id', description: 'The auth0 `sub` value (eg: `auth0|abc12345`)' })
  @Delete(':id')
  async remove(@Req() request: Request, @Param() params) {
    const current: User = await this.usersService.find(request.user.id);
    const user: User = await this.usersService.find(params.id);

    if (user === undefined) {
      throw new BadRequestException('User not found');
    }

    // Only own user or admins can remove the given user
    if (user.id !== current.id && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException('Not authorized to perform this operation');
    }

    const res: any = await this.usersService.remove(params.id);

    return {
      success: res.ok === 1,
    };
  }

  // Get an access token for the Auth0 Admin API
  async getAdminAccessToken() {
    const options = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: Config.auth0.backend.CLIENT_ID,
        client_secret: Config.auth0.backend.CLIENT_SECRET,
        audience: `https://${Config.auth0.backend.DOMAIN}/api/v2/`,
        grant_type: 'client_credentials',
      }),
    };

    const response = await fetch(`https://${Config.auth0.backend.DOMAIN}/oauth/token`, options);
    const json = await response.json();

    return json;
  }

  // Get the user's profile from auth0
  async getUserProfile(accessToken, userID) {
    const options = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const response = await fetch(`https://${Config.auth0.backend.DOMAIN}/api/v2/users/${userID}`, options);
    const json = await response.json();

    return json;
  }

}
