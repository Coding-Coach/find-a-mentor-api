import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { User, Role } from '../common/interfaces/user.interface';
import { UsersService } from '../common/users.service';
import { ReportsService } from './reports.service';
import { Totals } from './interfaces/totals.interface';

@ApiUseTags('/reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly reportsService: ReportsService,
  ) {}

  @ApiOperation({
    title: 'Return total number of users by role for the given date range',
  })
  @Get('users')
  async users(
    @Req() request: Request,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const current: User = await this.usersService.findByAuth0Id(
      request.user.auth0Id,
    );

    if (!current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException('Access denied');
    }

    const data: Totals = await this.reportsService.totalsByRole(start, end);

    return {
      success: true,
      data,
    };
  }
}
