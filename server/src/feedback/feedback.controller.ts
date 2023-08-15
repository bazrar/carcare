import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';

import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { RoleGuard } from 'src/role/guards/role.guard';

import { FeedbackService } from './feedback.service';

import { LimitDto } from './dto/feedback.dto';

@ApiTags('Feedback')
@ApiBearerAuth('access-token')
@Controller('api/feedback')
@UseGuards(JwtAccessTokenGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @ApiBearerAuth('access-token')
  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Get(':providerServiceId')
  async getFeedbacks(
    @Query() limitDto: LimitDto,
    @Param('providerServiceId') providerServiceId: string,
  ) {
    return await this.feedbackService.getFeedbacks(providerServiceId, limitDto);
  }
}
