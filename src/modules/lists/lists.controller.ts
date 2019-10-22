import { BadRequestException, Controller, Get, Post, Param, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { User } from '../common/interfaces/user.interface';
import { UsersService } from '../common/users.service';

@ApiUseTags('/users/:userid/lists')
@ApiBearerAuth()
@Controller('users/:userid/lists')
export class ListsController {

  constructor(
    private readonly usersService: UsersService,
  ) { }

  @ApiOperation({ title: 'Creates a new mentor\'s list for the given user' })
  @Post()
  async store(@Req() request: Request, @Param('userid') userId: string) {
    const current: User = await this.usersService.findByAuth0Id(request.user.auth0Id);
    const user: User = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!current._id.equals(user._id)) {
      throw new UnauthorizedException('Not authorized to perform this operation');
    }

    return {
      success: true,
      lists: [],
    };
  }

}
