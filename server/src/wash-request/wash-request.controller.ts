import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { RoleGuard } from 'src/role/guards/role.guard';
import { Role } from 'src/user/enums/roles.enum';
import { User } from 'src/user/schemas/auth.schema';
import {
  AcceptWashRequestDto,
  AddFeedbackDto,
  MemberDto,
  UpdateProviderStatusDto,
  VerifyTokenDto,
  WashRequestDto,
} from './dto/booking.dto';
import { WashRequestService } from './wash-request.service';

@ApiTags('Wash request')
@ApiBearerAuth('access-token')
@Controller('api/wash-request')
@UseGuards(JwtAccessTokenGuard, RoleGuard)
export class WashRequestController {
  constructor(private readonly washRequestService: WashRequestService) {}
  @Get()
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.SEEKER, Role.MANAGER, Role.TEAM_MEMBER)
  async listAllSeekerRequest(@GetUser() user) {
    return this.washRequestService.listAllWashRequest(user);
  }

  @Get(':washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.SEEKER, Role.MANAGER, Role.TEAM_MEMBER)
  async listSeekerRequest(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
  ) {
    return this.washRequestService.listWashRequest(washRequestId, user);
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Post('book-provider-service/:providerServiceId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  async bookServiceStation(
    @Body() washRequestDto: WashRequestDto,
    @GetUser() user: User,
    @Param('providerServiceId') providerServiceId: string,
  ) {
    return this.washRequestService.bookProviderService(
      user._id,
      providerServiceId,
      washRequestDto,
    );
  }

  @Post('accept/:washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.MANAGER, Role.SEEKER)
  async acceptRequest(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
    @Body() acceptWashRequestDto: AcceptWashRequestDto,
  ) {
    return this.washRequestService.acceptServiceRequest(
      user._id,
      washRequestId,
      acceptWashRequestDto,
    );
  }

  @Post('reject/:washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER, Role.PROVIDER, Role.MANAGER)
  async rejectRequest(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
    @Query('type') type: string,
  ) {
    return this.washRequestService.rejectServiceRequest(
      user,
      washRequestId,
      type,
    );
  }

  @Post('confirm/:washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  async confirmRequest(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
  ) {
    return this.washRequestService.confirmServiceRequest(
      user._id,
      washRequestId,
    );
  }

  @Post('assign/:washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.MANAGER)
  async assignRequest(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
    @Body() memberDto: MemberDto,
  ) {
    const { member } = memberDto;
    return this.washRequestService.assignServiceRequest(
      user._id,
      washRequestId,
      member,
    );
  }

  @Post('updateStatus/:washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER)
  async updateStatusRequest(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
    @Body() updateProviderStatusDto: UpdateProviderStatusDto,
  ) {
    return this.washRequestService.updateStatusRequest(
      user,
      washRequestId,
      updateProviderStatusDto,
    );
  }

  @Get('getVerificationToken/:washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER)
  async getVerificationTokenRequest(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
  ) {
    return this.washRequestService.getVerificationTokenRequest(washRequestId);
  }

  @Post('verifyToken/:washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  async verifyTokenRequest(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
    @Body() verifyTokenDto: VerifyTokenDto,
  ) {
    return this.washRequestService.verifyTokenRequest(
      washRequestId,
      verifyTokenDto,
    );
  }

  @Post('complete/:washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  async completeRequest(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
  ) {
    return this.washRequestService.completeServiceRequest(
      user._id,
      washRequestId,
    );
  }

  @Post('addFeedback/:washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER, Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER)
  async addFeedback(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
    @Body() addFeedbackDto: AddFeedbackDto,
  ) {
    return this.washRequestService.addFeedback(
      user,
      washRequestId,
      addFeedbackDto,
    );
  }

  @Get('hasFeedback/:washRequestId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER, Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER)
  async hasFeedback(
    @GetUser() user: User,
    @Param('washRequestId') washRequestId: string,
  ) {
    return this.washRequestService.hasFeedback(user, washRequestId);
  }
}
