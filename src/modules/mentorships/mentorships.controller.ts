import { Controller, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiUseTags('/mentorships')
@Controller('mentorships')
export class MentorshipController {
  @Post(':mentorId/apply')
  @ApiOperation({
    title: 'Creates a new mentorhip request for the given mentor',
  })
  @ApiBearerAuth()
  async apply(@Req() request: Request, @Param('mentorId') mentorId: string) {
    return {
      success: true,
    };
  }
}
