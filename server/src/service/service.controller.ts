import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { CategoryService } from 'src/category/category.service';
import { Roles } from 'src/role/decorators/role.decorator';
import { Role } from 'src/user/enums/roles.enum';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceService } from './service.service';

@ApiTags('Service')
@ApiBearerAuth('access-token')
@Controller('api/service')
@UseGuards(JwtAccessTokenGuard)
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly categoryService: CategoryService,
  ) {}

  @Get(':serviceSlug')
  @ApiBearerAuth('access-token')
  getServiceById(@Param('serviceSlug') serviceSlug) {
    return this.serviceService.getServiceById(serviceSlug);
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Get()
  @ApiBearerAuth('access-token')
  listServices() {
    return this.serviceService.listServices();
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiBearerAuth('access-token')
  async createService(@Body() createServiceDto: CreateServiceDto) {
    const { categorySlug } = createServiceDto;
    const category = await this.categoryService.getCategoryBySlug(
      createServiceDto.categorySlug,
    );
    if (!category) {
      throw new BadRequestException(`Category with slug doesnot exist`);
    }
    return this.serviceService.createService({
      ...createServiceDto,
      categoryId: category._id,
    });
  }

  @Roles(Role.ADMIN)
  @Put()
  @ApiBearerAuth('access-token')
  updateServiceBySlug(
    @Param('serviceSlug') serviceSlug: string,
    @Body() updateSubcategoryDto: UpdateServiceDto,
  ) {
    return this.serviceService.updateServiceById(
      serviceSlug,
      updateSubcategoryDto,
    );
  }

  @Roles(Role.ADMIN)
  @Delete()
  @ApiBearerAuth('access-token')
  deleteServiceBySlug(@Param('serviceSlug') serviceSlug) {
    return this.serviceService.deleteServiceById(serviceSlug);
  }
}
