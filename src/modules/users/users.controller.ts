import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) { }
  
  @Post()
  async create(@Body() userDto: UserDto) {
    this.usersService.create(userDto);
  }

  @Get()
  index() {
    return this.usersService.findAll();
  }
}
