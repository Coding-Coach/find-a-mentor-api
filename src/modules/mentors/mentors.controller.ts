import { Controller, Get, Put, Post, Query, Req, Body, Param, UsePipes, ValidationPipe, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MentorsService } from './mentors.service';
import { UsersService } from '../users/users.service';
import { MentorFiltersDto } from './dto/mentorfilters.dto';
import { ApplicationDto } from './dto/application.dto';
import { User, Role } from '../users/interfaces/user.interface';
import { Application, Status } from './interfaces/application.interface';
import { UserDto } from '../users/dto/user.dto';

@ApiUseTags('/mentors')
@Controller('mentors')
export class MentorsController {

  constructor(
    private readonly mentorsService: MentorsService,
    private readonly usersService: UsersService,
  ) { }

  @ApiOperation({ title: 'Return all mentors in the platform by the given filters' })
  @Get()
  async index(@Req() request: Request, @Query() filters: MentorFiltersDto) {
    const data: User[] = await this.mentorsService.findAll(filters);

    if (!request.user) {
      // @TODO: Once channels is implemented, we need to remove them
      // here for non-authenticated users, along with any other private data
    }

    return {
      success: true,
      data,
    };
  }

  @Get('applications')
  @ApiOperation({ title: 'Retrieve applications filter by the given status' })
  @ApiBearerAuth()
  async applications(@Req() request: Request, @Query('status') status: string) {
    const current: User = await this.usersService.findByAuth0Id(request.user.auth0Id);

    if (!current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException('Access denied');
    }

    const filters: any = {};

    if (status) {
      const key: string = Status[status.toUpperCase()];
      if (key) {
        filters.status = key;
      }
    }

    const data: Application[] = await this.mentorsService.findApplications(filters);

    return {
      success: true,
      data,
    };
  }

  @ApiOperation({ title: 'Creates a new request to become a mentor, pending for Admin to approve' })
  @ApiBearerAuth()
  @Post('applications')
  @UsePipes(new ValidationPipe({ transform: true, skipMissingProperties: true }))
  async applyToBecomeMentor(@Req() request: Request, @Body() data: ApplicationDto) {
    const user: User = await this.usersService.findByAuth0Id(request.user.auth0Id);
    const application: Application = await this.mentorsService.findApplicationByUser(user);
    const applicationDto = new ApplicationDto({
      ...data,
      status: Status.PENDING,
      user,
    });

    // Users can only apply once
    if (application) {
      throw new BadRequestException('You already applied, your application is in review.');
    }

    await this.mentorsService.createApplication(applicationDto);

    return {
      success: true,
    };
  }

  @ApiOperation({ title: 'Approves an application after review' })
  @ApiBearerAuth()
  @Put('applications/:id')
  async approveApplication(@Req() request: Request, @Param('id') applicationId: string) {
    const current: User = await this.usersService.findByAuth0Id(request.user.auth0Id);

    if (!current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException('Access denied');
    }

    const application: Application = await this.mentorsService.findApplicationById(applicationId);

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    if (application.status === Status.APPROVED) {
      throw new BadRequestException('This Application is already approved');
    }

    const user: User = await this.usersService.findById(application.user);
    const applicationDto: ApplicationDto = new ApplicationDto({
      _id: application._id,
      status: Status.APPROVED,
    });
    const userDto: UserDto = new UserDto({
      _id: application.user,
      roles: [...user.roles, Role.MENTOR],
    });
    
    this.usersService.update(userDto);
    const res: any = await this.mentorsService.updateApplication(applicationDto);

    return {
      success: res.ok === 1,
    };
  }
}
