import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { MentorsService } from './mentors.service';
import { MentorFiltersDto } from './dto/mentorfilters.dto';
import { User } from '../users/interfaces/user.interface';

@ApiUseTags('/mentors')
@ApiBearerAuth()
@Controller('mentors')
export class MentorsController {

  constructor(private readonly mentorsService: MentorsService) { }

  @ApiOperation({ title: 'Return all mentors in the platform by the given filters' })
  @Get()
  async index(@Query() filters: MentorFiltersDto) {
    const mentors: User[] = await this.mentorsService.findAll(filters);

    return {
      success: true,
      data: mentors,
    };
  }

  @Get('requests')
  async requests() {
    return {
      success: true,
      requests: [],
    };
  }

  @ApiOperation({ title: 'Creates a new request to become a mentor, pending for Admin to approve' })
  @Post('requests')
  async request() {
    
    return {
      success: true,
    }
  }
}
