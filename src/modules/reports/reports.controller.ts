import { Controller, Get, Delete, Put, Body, Param, Req, UnauthorizedException, BadRequestException, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiImplicitParam, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { UsersService } from '../common/users.service';

@ApiUseTags('/reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly usersService: UsersService
  ) { }

  @ApiOperation({ title: 'Return total number of users by role for the given date range' })
  @Get('users')
  async users() {
    const data = await this.usersService.totalsByRole();

    return {
      success: true,
      data,
    };
  }
}
