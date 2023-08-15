import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { RoleGuard } from 'src/role/guards/role.guard';
import { Role } from 'src/user/enums/roles.enum';
import { CarMetadataService } from './car-metadata.service';
import { BodyStylesFilterDto } from './dto/body-styles-filter.dto';
import { BrandFilterDto } from './dto/brand-filter.dto';
import { ModelFilterDto } from './dto/model-filter.dto';
import { YearFilterDto } from './dto/year-filter.dto';

@ApiTags('Car metadata')
@ApiBearerAuth('access-token')
@Controller('api/car-metadata')
export class CarMetadataController {
  constructor(private readonly carMetadataService: CarMetadataService) {}
  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  getCars() {
    return this.carMetadataService.getCars();
  }

  @Get('brand')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  getBrands(@Query() brandFilterDto: BrandFilterDto) {
    return this.carMetadataService.getBrands(brandFilterDto);
  }

  @Get('model')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  getModels(@Query() modelFilterDto: ModelFilterDto) {
    return this.carMetadataService.getModels(modelFilterDto);
  }

  @Get('bodyStyles')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  getBodyStyles(@Query() bodyStylesFilerDto: BodyStylesFilterDto) {
    return this.carMetadataService.getBodyStyles(bodyStylesFilerDto);
  }

  @Get('year')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  getManufacturedYears(@Query() yearFilterDto: YearFilterDto) {
    return this.carMetadataService.getManufacturedYears(yearFilterDto);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  createCarMetadata() {
    return this.carMetadataService.createCar({});
  }

  @Put()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  updateCarMetadata(carMetadataId: string, updateCarDto: any) {
    return this.carMetadataService.updateCar(carMetadataId, updateCarDto);
  }
}
