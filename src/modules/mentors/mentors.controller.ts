import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MentorsService } from '../common/mentors.service';
import { UsersService } from '../common/users.service';
import { MentorFiltersDto } from '../common/dto/mentorfilters.dto';
import { ApplicationDto } from '../common/dto/application.dto';
import { User, Role } from '../common/interfaces/user.interface';
import { Application, Status } from '../common/interfaces/application.interface';
import { UserDto } from '../common/dto/user.dto';
import { EmailService } from '../email/email.service';
import { Template } from '../email/interfaces/email.interface';
import { PaginationPipe } from '../common/pipes/pagination.pipe';

@ApiUseTags('/mentors')
@Controller('mentors')
export class MentorsController {

  constructor(
    private readonly mentorsService: MentorsService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) { }

  @ApiOperation({ title: 'Return all mentors in the platform by the given filters' })
  @Get()
  @UsePipes(new PaginationPipe())
  async index(@Req() request: Request, @Query() filters: MentorFiltersDto) {
    const data: User[] = await this.mentorsService.findAll(filters, !!request.user);

    return {
      success: true,
      data,
    };
  }

  @Get('featured')
  @ApiOperation({ title: 'Retrieves a random mentor to be featured in the blog (or anywhere else)' })
  async featured(@Req() request: Request) {
    const data: User = await this.mentorsService.findRandomMentor(!!request.user);

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

  @Get(':userId/applications')
  @ApiOperation({ title: 'Retrieve applications for the given user' })
  @ApiBearerAuth()
  async myApplications(@Req() request: Request, @Param('userId') userId: string, @Query('status') status: string) {
    const current: User = await this.usersService.findByAuth0Id(request.user.auth0Id);
    const user: User = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only current user or admin can get applications
    if (!current._id.equals(user._id) && !current.roles.includes(Role.ADMIN)) {
      throw new UnauthorizedException('Not authorized to perform this operation');
    }

    const filters: any = {
      user: user._id,
    };

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
  @UsePipes(new ValidationPipe({ transform: true, skipMissingProperties: true, whitelist: true }))
  async applyToBecomeMentor(@Req() request: Request, @Body() data: ApplicationDto) {
    const user: User = await this.usersService.findByAuth0Id(request.user.auth0Id);
    const application: Application = await this.mentorsService.findActiveApplicationByUser(user);
    const applicationDto = new ApplicationDto({
      description: data.description,
      status: Status.PENDING,
      user,
    });

    // Users can only apply once
    if (application) {
      if (application.status === Status.PENDING) {
        throw new BadRequestException('You already applied, your application is in review.');
      } else if (application.status === Status.APPROVED) {
        throw new BadRequestException('You already applied, your application has been approved');
      }
    }

    await this.mentorsService.createApplication(applicationDto);

    const emailData = {
      to: user.email,
      templateId: Template.MENTOR_APPLICATION_RECEIVED,
    };

    this.emailService.send(emailData);

    return {
      success: true,
    };
  }

  @ApiOperation({ title: 'Approves or rejects an application after review' })
  @ApiBearerAuth()
  @Put('applications/:id')
  @UsePipes(new ValidationPipe({ transform: true, skipMissingProperties: true, whitelist: true }))
  async reviewApplication(@Req() request: Request, @Param('id') applicationId: string, @Body() data: ApplicationDto) {
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

    let templateId = null;
    const user: User = await this.usersService.findById(application.user);
    const applicationDto: ApplicationDto = new ApplicationDto({
      _id: application._id,
      reason: data.reason,
      status: data.status,
    });
    const userDto: UserDto = new UserDto({
      _id: application.user,
      roles: [...user.roles, Role.MENTOR],
    });

    if (applicationDto.status === Status.REJECTED) {
      templateId = Template.MENTOR_APPLICATION_REJECTED;
    } else {
      await this.usersService.update(userDto);
      templateId = Template.MENTOR_APPLICATION_APPROVED;
    }

    const emailData = {
      to: user.email,
      templateId,
    };

    const res: any = await this.mentorsService.updateApplication(applicationDto);
    await this.emailService.send(emailData);

    return {
      success: res.ok === 1,
    };
  }
}
