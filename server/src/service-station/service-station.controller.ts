import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { RoleGuard } from 'src/role/guards/role.guard';
import { Role } from 'src/user/enums/roles.enum';
import { ServiceStationService } from './service-station.service';
import { CreateServiceStationDto } from './dto/create-service-station.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { FilterServiceStationListDto } from './dto/list-service-station-filter.dto';
import { UpdateServiceStationDto } from './dto/update-service-station.dto';
import { ServiceStationManagerType } from './schemas/service-station.schema';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SearchServiceStationDto } from './dto/search-service-station.dto';
import { UpdateServiceStationLocationDto } from './dto/update-service-station-location.dto';
import { User } from 'src/user/schemas/auth.schema';

@ApiTags('Service station')
@Controller('api/service-station')
@UseGuards(JwtAccessTokenGuard)
export class ServiceStationController {
  constructor(private readonly serviceStationService: ServiceStationService) {}

  @Get('/search/:serviceId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.SEEKER, Role.MANAGER)
  searchServiceStations(
    @Query() serviceStationSearchDto: SearchServiceStationDto,
    @GetUser() user,
    @Param('serviceId') serviceId: string,
  ) {
    return this.serviceStationService.searchServiceStations(
      user._id,
      serviceId,
      serviceStationSearchDto,
    );
  }

  @Get('/search/provider-service/:providerServiceId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.SEEKER, Role.MANAGER, Role.ADMIN)
  searchServiceStationDetail(
    @GetUser() user,
    @Param('providerServiceId') providerServiceId: string,
  ) {
    return this.serviceStationService.searchServiceStationDetail(
      user._id,
      providerServiceId,
    );
  }

  @Get(':serviceStationId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER)
  async getServiceStationById(
    @Param('serviceStationId') serviceStationId: string,
  ) {
    const serviceStation =
      await this.serviceStationService.getServiceStationById(serviceStationId);
    if (!serviceStation) {
      throw new NotFoundException('Service station not found');
    }
    if (
      serviceStation.serviceStationManagerType ===
      ServiceStationManagerType.OTHER
    ) {
      return {
        ...serviceStation.toJSON,
        email: serviceStation.managerDetails.mobileNumber,
      };
    }

    return serviceStation;
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  createServiceStation(
    @GetUser() user,
    @Body() createServiceStationDto: CreateServiceStationDto,
  ) {
    const serviceStation = this.serviceStationService.createServiceStation({
      ...createServiceStationDto,
      user,
    });

    return serviceStation;
  }

  @Put(':serviceStationId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  updateServiceStation(
    @GetUser() user,
    @Param('serviceStationId') serviceStationId: string,
    @Body() updateServiceStationDto: UpdateServiceStationDto,
  ) {
    return this.serviceStationService.updateServiceStationById(
      user._id,
      serviceStationId,
      updateServiceStationDto,
    );
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER)
  listServiceStation(
    @GetUser() user,
    @Query() listServiceStationFilterDto: FilterServiceStationListDto,
  ) {
    return this.serviceStationService.listServiceStation(
      user,
      listServiceStationFilterDto,
    );
  }

  @Delete(':serviceStationId/remove-manager')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  removeServiceStationManager(
    @Param('serviceStationId') serviceStationId,
    @GetUser() user,
  ) {
    return this.serviceStationService.removeServiceStationManager(
      user,
      serviceStationId,
    );
  }

  @Delete(':serviceStationId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  deleteServiceStationById(
    @Param('serviceStationId') serviceStationId,
    @GetUser() user,
  ) {
    return this.serviceStationService.deleteServiceStationById(
      user._id,
      serviceStationId,
    );
  }

  @Post(':serviceStationId/publish')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  publishServiceStation(
    @Param('serviceStationId') serviceStationId: string,
    @GetUser() user,
  ) {
    return this.serviceStationService.publishServiceStation(
      user,
      serviceStationId,
    );
  }

  @Post(':serviceStationId/unpublish')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  unpublishServiceStation(
    @Param('serviceStationId') serviceStationId: string,
    @GetUser() user,
  ) {
    return this.serviceStationService.unpublishServiceStation(
      user,
      serviceStationId,
    );
  }

  @Get(':serviceStationId/get-active-members')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  getActiveMembers(@Param('serviceStationId') serviceStationId: string) {
    return this.serviceStationService.getActiveMembers(serviceStationId);
  }

  @Patch(':serviceStationId/toggle-location-tracking')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER)
  toggleLocationTracking(
    @GetUser() user: User,
    @Param('serviceStationId') serviceStationId: string,
  ) {
    return this.serviceStationService.toggleLocationTracking(
      serviceStationId,
      user,
    );
  }

  @Patch(':serviceStationId/update-location')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER)
  updateLocation(
    @GetUser() user: User,
    @Param('serviceStationId') serviceStationId: string,
    @Body() updateServiceStationLocationDto: UpdateServiceStationLocationDto,
  ) {
    return this.serviceStationService.updateLocation(
      user,
      serviceStationId,
      updateServiceStationLocationDto,
    );
  }

  @Patch(':serviceStationId/service/:serviceId/toggle-active-status')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  toggleProviderServiceActiveStatus(
    @Param('serviceStationId') serviceStationId: string,
    @Param('serviceId') serviceId: string,
    @GetUser() user: User,
  ) {
    return this.serviceStationService.toggleProviderServiceActiveStatus(
      serviceStationId,
      serviceId,
      user,
    );
  }
}
