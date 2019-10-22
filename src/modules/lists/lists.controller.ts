import { Controller, Get, Post, Param, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
// import { Request } from 'express';

@ApiUseTags('/users/:userid/lists')
@ApiBearerAuth()
@Controller('users/:userid/lists')
export class ListsController {

  @ApiOperation({ title: 'Creates a new mentor\'s list for the given user' })
  @Post()
  async store(@Param('userid') userId: string) {
    console.log(userId);
    return {
      success: true,
      lists: [],
    };
  }

}
