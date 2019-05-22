import { Controller, Get, Put, Body, Param, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import fetch from 'node-fetch';
import Config from '../../config';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) { }

  @Get()
  async index() {
    const users = await this.usersService.findAll();

    return {
      success: true,
      users,
    };
  }

  @Get('current')
  async currentUser(@Req() request: Request) {
    const userId = request.user.sub;
    const currentUser = await this.usersService.find(userId);

    if (!currentUser) {
      // If the user doesn't exist in the database we need
      // to add it because this is a new user. The initial
      // information is coming from auth0
      try {
        const data = await this.getAdminAccessToken();
        const user = await this.getUserProfile(data.access_token, userId);
        const userDto = new UserDto({
          id: userId,
          email: user.email,
          name: user.nickname,
          avatar: user.picture,
        });

        this.usersService.create(userDto);

        return {
          success: true,
          user: userDto,
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
      user: currentUser,
    };
  }

  @Get(':id')
  async show(@Param() params) {
    const user = await this.usersService.find(params.id);

    if (user === undefined) {
      throw new BadRequestException('User not found');
    }

    return {
      success: true,
      user,
    };
  }

  @Put(':id')
  async update(@Req() request: Request, @Param() params, @Body() data: UserDto) {
    const user = await this.usersService.find(params.id);

    // Users should only update their own data
    if (user === undefined || user.id !== request.user.id) {
      throw new BadRequestException('User not found');
    }

    const userDto = new UserDto({
      id: user.id,
      ...data,
    });
    const res = await this.usersService.update(userDto);

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
