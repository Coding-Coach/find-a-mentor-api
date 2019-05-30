import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiUseTags } from '@nestjs/swagger';

@ApiUseTags('/mentors')
@ApiBearerAuth()
@Controller('mentors')
export class MentorsController {

  @Get()
  async index() {
    return {
      success: true,
      mentors: [],
    };
  }

  @Get('requests')
  async requests() {
    return {
      success: true,
      requests: [],
    };
  }

  @Post('requests')
  async request() {
    return {
      success: true,
    }
  }
}
