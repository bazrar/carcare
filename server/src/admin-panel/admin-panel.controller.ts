import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AdminPanelService } from './admin-panel.service';

import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';

import { WebLoginDto } from './dto/web-login.dto';
import { FilterDto } from './dto/ filter.dto';
import { SearchDto } from './dto/search.dto';

@ApiTags('Admin-panel')
@Controller('api/admin')
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}
  @Post('/webLogin')
  async webLogin(@Body() webLoginDto: WebLoginDto) {
    const { email, password } = webLoginDto;
    return await this.adminPanelService.webLogin(email, password);
  }

  @Get('/dashboard')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async getDashBoardData() {
    return await this.adminPanelService.getDashBoardData();
  }

  @Get('/graph')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async getGraphData() {
    return await this.adminPanelService.getGraphData();
  }

  @Get('/washRequests')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async getWashRequests(@Query() filterDto: FilterDto) {
    const { page, limit, sortKey, sortType } = filterDto;
    return await this.adminPanelService.getWashRequests(
      page,
      limit,
      sortKey,
      sortType,
    );
  }

  @Get('/seekers')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async getSeekers(@Query() filterDto: FilterDto) {
    const { page, limit, sortKey, sortType } = filterDto;
    return await this.adminPanelService.getSeekers(
      page,
      limit,
      sortKey,
      sortType,
    );
  }

  @Get('/seekers/:seekerId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async getSeekerDetail(@Param('seekerId') seekerId: string) {
    return await this.adminPanelService.getSeekerDetail(seekerId);
  }

  @Get('/providers')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async getProviders(@Query() filterDto: FilterDto) {
    const { page, limit, sortKey, sortType } = filterDto;
    return await this.adminPanelService.getProviders(
      page,
      limit,
      sortKey,
      sortType,
    );
  }

  @Get('/providers/:providerId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async getProviderDetail(@Param('providerId') providerId: string) {
    return await this.adminPanelService.getProviderDetail(providerId);
  }

  @Post('/providers/:providerId/verify')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async verifyProvider(
    @Param('providerId') providerId: string,
    @Query('verified') verified: boolean,
  ) {
    const isVerified = verified.toString();
    return await this.adminPanelService.verifyProvider(providerId, isVerified);
  }

  @Get('/serviceStations')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async getServiceStations(@Query('businessId') businessId: string) {
    return await this.adminPanelService.getServiceStations(businessId);
  }

  @Get('/totalEarnings')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async getTotalEarnings(@Query('businessId') businessId: string) {
    return await this.adminPanelService.getTotalEarnings(businessId);
  }

  @Get('/search')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard)
  async handleSearch(@Query() searchDto: SearchDto) {
    const { queryString, queryType } = searchDto;
    return await this.adminPanelService.handleSearch(queryString, queryType);
  }
}
