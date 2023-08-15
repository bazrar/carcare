import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './schemas/category.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}
  async getCategory(categorySlug: string): Promise<Category> {
    return this.categoryModel.findOne({ slug: categorySlug });
  }
  async getCategoryByName(categoryName: string) {
    return this.categoryModel.findOne({ name: categoryName });
  }

  async getCategoryBySlug(categorySlug: string) {
    const category = this.getCategory(categorySlug);
    if (!category) {
      throw new NotFoundException(`Category not found`);
    }
    return category;
  }

  async listCategories() {
    return this.categoryModel.find();
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    return this.categoryModel.create(createCategoryDto);
  }

  async updateCategoryById(
    categorySlug: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.getCategoryBySlug(categorySlug);
    category.name = updateCategoryDto.name;
    category.description = updateCategoryDto.description;
    await category.save();
    return category;
  }

  async deleteCategoryById(categorySlug: string) {
    const category = await this.getCategoryBySlug(categorySlug);
    await category.delete();
  }
}
