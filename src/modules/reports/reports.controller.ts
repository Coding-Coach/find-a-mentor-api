import { Controller, Get, Delete, Put, Body, Param, Req, UnauthorizedException, BadRequestException, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiBearerAuth, ApiImplicitParam, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { User, Role } from '../common/interfaces/user.interface';
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
  async users(@Req() request: Request) {
    const current: User = await this.usersService.findByAuth0Id(request.user.auth0Id);

    if (!current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException('Access denied');
    }

    const data = await this.usersService.totalsByRole();

    return {
      success: true,
      data,
    };
  }
}
