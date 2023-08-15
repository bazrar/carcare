import { Get, UseGuards } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { RoleGuard } from 'src/role/guards/role.guard';
import { Role } from 'src/user/enums/roles.enum';
import { ReviewReasonsService } from './review-reasons.service';

@ApiTags('Review Reasons')
@ApiBearerAuth('access-token')
@Controller('api/review-reasons')
@UseGuards(JwtAccessTokenGuard, RoleGuard)
export class ReviewReasonsController {
  constructor(private readonly reviewReasonsService: ReviewReasonsService) {}
  @Get()
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.SEEKER, Role.MANAGER, Role.TEAM_MEMBER)
  async listReviewReasons(@GetUser() user) {
    return this.reviewReasonsService.listReviewReasons(user._id);
  }
}
