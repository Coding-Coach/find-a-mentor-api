import { Controller, Get, Post, Query, Req, Body, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MentorsService } from './mentors.service';
import { UsersService } from '../users/users.service';
import { MentorFiltersDto } from './dto/mentorfilters.dto';
import { ApplicationDto } from './dto/application.dto';
import { User } from '../users/interfaces/user.interface';
import { Status } from './interfaces/application.interface';

@ApiUseTags('/mentors')
@ApiBearerAuth()
@Controller('mentors')
export class MentorsController {

  constructor(
    private readonly mentorsService: MentorsService,
    private readonly usersService: UsersService,
  ) { }

  @ApiOperation({ title: 'Return all mentors in the platform by the given filters' })
  @Get()
  async index(@Query() filters: MentorFiltersDto) {
    const mentors: User[] = await this.mentorsService.findAll(filters);

    return {
      success: true,
      data: mentors,
    };
  }

  @Get('applications')
  async requests() {
    return {
      success: true,
      requests: [],
    };
  }

  @ApiOperation({ title: 'Creates a new request to become a mentor, pending for Admin to approve' })
  @Post('applications')
  @UsePipes(new ValidationPipe({ transform: true, skipMissingProperties: true }))
  async request(@Req() request: Request, @Body() data: ApplicationDto) {
    const user = await this.usersService.find(request.user.id);
    let application = await this.mentorsService.findApplicationByUser(user);
    const applicationDto = new ApplicationDto({
      ...data,
      status: Status.PENDING,
      user,
    });
    
    
    // Users can only apply once
    if (application) {
      throw new BadRequestException('You already applied, your application is in review.');
    }

    application = await this.mentorsService.createApplication(applicationDto);

    return {
      success: true,
    };
  }
}
