import { Controller, Get, Query, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { RoleGuard } from 'src/role/guards/role.guard';
import { User } from 'src/user/schemas/auth.schema';
import { NotificationService } from './notification.service';
import { LimitDto } from 'src/feedback/dto/feedback.dto';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('api/notification')
@UseGuards(JwtAccessTokenGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Get()
  async getNotifications(@Query() limitDto: LimitDto, @GetUser() user: User) {
    return await this.notificationService.getNotifications(user._id, limitDto);
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Get('unreadNotificationsCount')
  @ApiBearerAuth('access-token')
  async getUnReadNotificationsCount(@GetUser() user: User) {
    const response = await this.notificationService.getUnReadNotificationsCount(
      user._id,
    );
    return response;
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Post(':notificationId/markNotificationAsSeen')
  @ApiBearerAuth('access-token')
  async markNotificationAsSeen(
    @Param('notificationId') notificationId: string,
  ) {
    const response = await this.notificationService.markNotificationAsSeen(
      notificationId,
    );
    return response;
  }
}
