import { BadRequestException, Controller, Get, Post, Param, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Role, User } from '../common/interfaces/user.interface';
import { List } from './interfaces/list.interface';
import { UsersService } from '../common/users.service';
import { ListsService } from './lists.service';

@ApiUseTags('/users/:userid/lists')
@ApiBearerAuth()
@Controller('users/:userid/lists')
export class ListsController {

  constructor(
    private readonly usersService: UsersService,
    private readonly listsService: ListsService,
  ) { }

  @ApiOperation({ title: 'Creates a new mentor\'s list for the given user' })
  @Post()
  async store(@Req() request: Request, @Param('userid') userId: string) {
    const current: User = await this.usersService.findByAuth0Id(request.user.auth0Id);
    const user: User = await this.usersService.findById(userId);

    // Make sure user exist
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only admins can create lists for other users
    if (!current._id.equals(user._id) && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException('Not authorized to perform this operation');
    }

    const list: List = await this.listsService.createList();

    return {
      success: true,
      list,
    };
  }

}
