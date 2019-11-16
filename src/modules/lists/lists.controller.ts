import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Param,
  Req,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Role, User } from '../common/interfaces/user.interface';
import { List } from './interfaces/list.interface';
import { UsersService } from '../common/users.service';
import { ListsService } from './lists.service';
import { ListDto } from './dto/list.dto';

@ApiUseTags('/users/:userid/lists')
@ApiBearerAuth()
@Controller('users/:userid/lists')
export class ListsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly listsService: ListsService,
  ) {}

  @ApiOperation({ title: `Creates a new mentor's list for the given user` })
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async store(
    @Req() request: Request,
    @Param('userid') userId: string,
    @Body() data: ListDto,
  ) {
    const current: User = await this.usersService.findByAuth0Id(
      request.user.auth0Id,
    );
    const user: User = await this.usersService.findById(userId);

    // Make sure user exist
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only admins can create lists for other users
    if (!current._id.equals(user._id) && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException(
        'Not authorized to perform this operation',
      );
    }

    const list: List = await this.listsService.createList({
      ...data,
      user: { _id: user._id } as User,
    });

    return {
      success: true,
      list: { _id: list._id },
    };
  }

  @ApiOperation({ title: `Gets mentor's list for the given user` })
  @Get()
  async myList(@Req() request, @Param('userid') userId: string) {
    const current: User = await this.usersService.findByAuth0Id(
      request.user.auth0Id,
    );
    const user: User = await this.usersService.findById(userId);

    // check if user exists
    if (!user) {
      throw new BadRequestException('User not found');
    }
    let lists: List[];

    // Only current user and admins can view both private and public lists for a user
    if (current._id.equals(user._id) || current.roles.includes(Role.ADMIN)) {
      lists = await this.listsService.findByUserId({ userId });
    } else {
      lists = await this.listsService.findByUserId({ userId, public: true });
    }

    return {
      success: true,
      lists,
    };
  }

  @ApiOperation({ title: `Delete the given mentor's list for the given user` })
  @Delete(':listId')
  async deleteList(
    @Req() request: Request,
    @Param('userid') userId: string,
    @Param('listId') listId: string,
  ) {
    const current: User = await this.usersService.findByAuth0Id(
      request.user.auth0Id,
    );
    const user: User = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!current._id.equals(user._id) && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException(
        'Not authorized to perform this operation',
      );
    }

    try {
      const res: any = await this.listsService.delete(listId);
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
}
