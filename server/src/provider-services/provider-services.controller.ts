import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { RoleGuard } from 'src/role/guards/role.guard';
import { Role } from 'src/user/enums/roles.enum';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { ProviderServicesService } from './provider-services.service';

@ApiTags('Provider Jobs')
@Controller('api/provider-jobs')
export class ProviderServicesController {
  constructor(
    private readonly providerServiceService: ProviderServicesService,
  ) {}

  @Get(':serviceid')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  getProviderServiceById(
    @GetUser() user,
    @Param('serviceId') serviceId: string,
    @Param('serviceStationId') serviceStationId: string,
  ) {
    return this.providerServiceService.getProviderServiceById(
      serviceId,
      serviceStationId,
    );
  }

  @Get('service/:serviceId/serviceStation/:serviceStationId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER, Role.ADMIN)
  getProviderServices(
    @GetUser() user,
    @Param('serviceId') serviceId: string,
    @Param('serviceStationId') serviceStationId: string,
  ) {
    return this.providerServiceService.getProviderServices(
      user._id,
      serviceId,
      serviceStationId,
    );
  }

  @Post('service/:serviceId/serviceStation/:serviceStationId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  createOrUpdateProviderSerivces(
    @GetUser() user,
    @Body() createOrUpdateProviderServiceDto: CreateProviderServiceDto,
    @Param('serviceId') serviceId: string,
    @Param('serviceStationId') serviceStationId: string,
  ) {
    return this.providerServiceService.createOrUpdateProviderSerivces(
      user,
      serviceId,
      serviceStationId,
      createOrUpdateProviderServiceDto,
    );
  }
}
