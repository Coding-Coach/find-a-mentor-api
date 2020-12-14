import {
  Body,
  BadRequestException,
  Controller,
  Param,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MentorsService } from '../common/mentors.service';
import { UsersService } from '../common/users.service';
import { User } from '../common/interfaces/user.interface';
import { MentorshipsService } from './mentorships.service';
import { MentorshipDto } from './dto/mentorship.dto';

@ApiUseTags('/mentorships')
@Controller('mentorships')
export class MentorshipsController {
  constructor(
    private readonly mentorsService: MentorsService,
    private readonly usersService: UsersService,
    private readonly mentorshipsService: MentorshipsService,
  ) {}

  @Post(':mentorId/apply')
  @ApiOperation({
    title: 'Creates a new mentorhip request for the given mentor',
  })
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async apply(
    @Req() request: Request,
    @Param('mentorId') mentorId: string,
    @Body() data: MentorshipDto,
  ) {
    const current: User = await this.usersService.findByAuth0Id(
      request.user.auth0Id,
    );
    const mentor: User = await this.mentorsService.findById(mentorId);

    if (!mentor) {
      throw new BadRequestException('Mentor not found');
    }

    if (!mentor.available) {
      throw new BadRequestException('Mentor is not available');
    }

    await this.mentorshipsService.createMentorship({
      mentor: mentor._id,
      mentee: current._id,
      ...data,
    });

    return {
      success: true,
    };
  }
}
