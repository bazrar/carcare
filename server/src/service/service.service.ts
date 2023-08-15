import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoryService } from 'src/category/category.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './schemas/service.schema';

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<Service>,
    private readonly categoryService: CategoryService,
  ) {}
  async getServiceByName(serviceName: string) {
    return this.serviceModel.findOne({ name: serviceName });
  }
  async getServiceById(serviceId: string) {
    const service = this.serviceModel.findOne({ _id: serviceId });
    if (!service) {
      throw new NotFoundException(`Service not found`);
    }
    return service;
  }

  async listServices() {
    return this.serviceModel.find();
  }

  async createService(
    createServiceDto: Omit<
      CreateServiceDto & { categoryId: string },
      'categorySlug'
    >,
  ) {
    return this.serviceModel.create(createServiceDto);
  }

  async updateServiceById(
    serviceId: string,
    updateServiceDto: UpdateServiceDto,
  ) {
    const service = await this.getServiceById(serviceId);
    if (!service) {
      throw new BadRequestException(`Service doesnt exitst`);
    }
    const categorySlug = updateServiceDto.categorySlug;
    const category = await this.categoryService.getCategoryBySlug(categorySlug);
    if (!category) {
      throw new BadRequestException(
        `Category with slug ${categorySlug} doesnt exit`,
      );
    }
    service.name = updateServiceDto.name;
    service.description = updateServiceDto.description;
    await service.save();
    return service;
  }

  async deleteServiceById(serviceId: string) {
    const service = await this.getServiceById(serviceId);
    await service.delete();
  }
}
