import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { Role } from 'src/user/enums/roles.enum';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Category')
@UseGuards(JwtAccessTokenGuard)
@Controller('api/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get(':categorySlug')
  @ApiBearerAuth('access-token')
  getCategoryBySlug(@Param('categorySlug') categorySlug) {
    return this.categoryService.getCategoryBySlug(categorySlug);
  }

  @Get()
  @ApiBearerAuth('access-token')
  listCategories() {
    return this.categoryService.listCategories();
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Put()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  updateCategoryById(
    @Param('categorySlug') categorySlug: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategoryById(
      categorySlug,
      updateCategoryDto,
    );
  }

  @Delete()
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN)
  deleteCategoryById(@Param('categorySlug') categorySlug) {
    return this.categoryService.deleteCategoryById(categorySlug);
  }
}
