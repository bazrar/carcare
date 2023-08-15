import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { model, Model } from 'mongoose';
import { BodyStylesFilterDto } from './dto/body-styles-filter.dto';
import { BrandFilterDto } from './dto/brand-filter.dto';
import { ModelFilterDto } from './dto/model-filter.dto';
import { YearFilterDto } from './dto/year-filter.dto';
import { CarMetadata } from './schemas/car-metadata.schema';

@Injectable()
export class CarMetadataService {
  constructor(
    @InjectModel(CarMetadata.name) private carMetadataModel: Model<CarMetadata>,
  ) {}

  async getBrands(brandFilterDto: BrandFilterDto) {
    const { q } = brandFilterDto;
    const params: { make?: any } = {};
    if (q) {
      params.make = { $regex: q, $options: 'i' };
    }
    return this.carMetadataModel.find(params, { make: 1 }).distinct('make');
  }

  async getModels(modelFilterDto: ModelFilterDto) {
    const { q, make } = modelFilterDto;
    const params: { make?: any; model?: any } = {};
    params.make = make;
    if (q) {
      params.model = { $regex: q, $options: 'i' };
    }
    return this.carMetadataModel
      .find(params, { model: 1, brand: 1 })
      .distinct('model');
  }

  async getCars() {
    return this.carMetadataModel.find();
  }

  async getBodyStyles(bodyStylesFilterDto: BodyStylesFilterDto) {
    const { q, make, model } = bodyStylesFilterDto;
    const params: { make?: any; model?: any; bodyStyles?: any } = {};
    params.make = make;
    params.model = model;
    if (q) {
      params.bodyStyles = { $regex: q.toString(), $options: 'i' };
    }

    const bodyStyles = await this.carMetadataModel
      .find(params, {
        model: 1,
        brand: 1,
        bodyStyles: 1,
      })
      .distinct('bodyStyles');
    console.log(
      '🚀 ~ file: car-metadata.service.ts ~ line 43 ~ CarMetadataService ~ getBodyStyles ~ bodyStyles',
      bodyStyles,
    );
    return bodyStyles;
  }

  async getManufacturedYears(yearFilterDto: YearFilterDto) {
    const { q, make, model, bodyStyles } = yearFilterDto;
    const params: { make?: any; model?: any; bodyStyles?: any; year?: any } =
      {};
    params.make = make;
    params.model = model;
    params.bodyStyles = bodyStyles;
    if (q) {
      params.year = { $regex: q.toString(), $options: 'i' };
    }
    return this.carMetadataModel
      .find(params, { model: 1, brand: 1, year: 1 })
      .distinct('year');
  }

  async createCar(createCarMetadata: any) {
    console.log(
      '🚀 ~ file: car-metadata.service.ts ~ line 17 ~ CarMetadataService ~ createCar ~ createCarMetadata',
      createCarMetadata,
    );
    return this.carMetadataModel.create(createCarMetadata);
  }
  async insertManyCarMetadata(carMetadatas) {
    return this.carMetadataModel.insertMany(carMetadatas);
  }

  async updateCar(carMetadataId, updateCarDto) {
    return {};
  }

  async findCarMetadataByAttribues(params = {}) {
    const carMetadata = await this.carMetadataModel.findOne(params);
    if (!carMetadata) {
      throw new NotFoundException('Car metadata not found');
    }
    return carMetadata;
  }
}
