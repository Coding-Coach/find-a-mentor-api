import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import fetch from 'node-fetch';
import Config from '../../config';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) { }

  @Get()
  index(@Req() request: Request) {
    return this.usersService.findAll();
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

    const response = await fetch(`https://${Config.auth0.backend.DOMAIN}/oauth/token`, options)
    const json = await response.json();

    return json;
  }

  // Get the user's profile from auth0
  async getUserProfile(accessToken, userID) {
    const options = {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
    
    const response = await fetch(`https://${Config.auth0.backend.DOMAIN}/api/v2/users/${userID}`, options)
    const json = await response.json();

    return json;
  }

}
