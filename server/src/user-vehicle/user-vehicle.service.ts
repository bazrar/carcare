import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { basename, extname } from 'path';
import { CarMetadataService } from 'src/car-metadata/car-metadata.service';
import { CarMetadata } from 'src/car-metadata/schemas/car-metadata.schema';
import { S3Service } from 'src/s3/s3.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UserVehicle, UserVehicleSchema } from './schemas/user-vehicle.schema';
import { UserVehicleController } from './user-vehicle.controller';

@Injectable()
export class UserVehicleService {
  constructor(
    @InjectModel(UserVehicle.name)
    private readonly userVehicleModel: mongoose.Model<UserVehicle>,
    private readonly s3Service: S3Service,
    private readonly carMetadataService: CarMetadataService,
  ) {}
  async getUserVehicleMetadata(vehicleMetadataId) {
    return this.carMetadataService.findCarMetadataByAttribues({
      _id: vehicleMetadataId,
    });
  }
  async getUserVehicleById(userId: mongoose.ObjectId, userVehicleId: string) {
    console.log(
      '🚀 ~ file: user-vehicle.service.ts ~ line 27 ~ UserVehicleService ~ getUserVehicleById ~ userVehicleId',
      userVehicleId,
    );
    const seekerVechicle = await this.userVehicleModel
      .findById({
        _id: new mongoose.mongo.ObjectId(userVehicleId),
        userId,
      })
      .populate({
        path: 'carMetadataId',
        select: '_id make model year bodyStyles',
      });
    if (!seekerVechicle) {
      throw new NotFoundException(`Vehicle with given id not found`);
    }
    let vehicleImage: string = null;

    if (seekerVechicle.vehicleImage) {
      vehicleImage = await this.s3Service.getSignedUrl(
        seekerVechicle.vehicleImage,
      );
    }

    return { ...seekerVechicle.toJSON(), vehicleImage };
  }

  async getAllUserVehicles(
    userId: mongoose.ObjectId,
    userVehicleFilterDto: UpdateVehicleDto,
  ) {
    const seekerVehicles = await this.userVehicleModel
      .find({ userId, deleted: { $exists: false } })
      .populate({
        path: 'carMetadataId',
        select: '_id make model year bodyStyles',
      })
      .sort({ createdAt: -1 });
    const seekerVehiclesWithSignedUrls = await Promise.all(
      seekerVehicles.map(async (seekerVehicle) => {
        if (seekerVehicle && seekerVehicle.vehicleImage) {
          const vehicleImage = await this.s3Service.getSignedUrl(
            seekerVehicle.vehicleImage,
          );
          return { ...seekerVehicle.toJSON(), vehicleImage };
        }
        return { ...seekerVehicle.toJSON(), vehicleImage: null };
      }),
    );
    return seekerVehiclesWithSignedUrls;
  }

  async createVehicle(
    userId: mongoose.ObjectId,
    createUserVehicleDto: CreateVehicleDto,
    vehicleImage?: Express.Multer.File,
  ) {
    const { make, model, year, bodyStyles, color } = createUserVehicleDto;
    let carMetadata: CarMetadata;
    try {
      carMetadata = await this.carMetadataService.findCarMetadataByAttribues({
        make,
        model,
        year,
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        carMetadata = await this.carMetadataService.createCar({
          make,
          model,
          year,
          bodyStyles,
        });
      } else {
        throw err;
      }
    }
    let fileName = null;
    if (vehicleImage) {
      const baseName = basename(vehicleImage.originalname);
      const extName = extname(vehicleImage.originalname);
      fileName = `vehicle/${baseName.replace(
        extName,
        '',
      )}_${Date.now()}${extname(vehicleImage.originalname)}`;
      await this.s3Service.uploadFile(vehicleImage.buffer, fileName);
    }
    const userVehicle = await this.userVehicleModel.create({
      carMetadataId: carMetadata._id,
      color,
      vehicleImage: fileName,
      userId,
    });
    let url = null;
    if (fileName) {
      url = await this.s3Service.getSignedUrl(fileName);
    }
    return {
      ...userVehicle.toJSON(),
      vehicleImageUrl: url,
    };
  }

  async updateVechile(
    userId: mongoose.ObjectId,
    vehicleId: string,
    updateUserVehicleDto: UpdateVehicleDto,
    vehicleImage: Express.Multer.File,
  ) {
    const { make, model, year, bodyStyles, color } = updateUserVehicleDto;
    console.log(
      '🚀 ~ file: user-vehicle.service.ts ~ line 122 ~ UserVehicleService ~ vehicleImage',
      vehicleImage,
    );
    let carMetadata: CarMetadata;
    try {
      carMetadata = await this.carMetadataService.findCarMetadataByAttribues({
        make,
        model,
        year,
        bodyStyles,
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        carMetadata = await this.carMetadataService.createCar({
          make,
          model,
          year,
          bodyStyles,
        });
      } else {
        throw err;
      }
    }

    const userVehicle = await this.findUserVehicleByParams({
      userId,
      _id: new mongoose.mongo.ObjectId(vehicleId),
    });
    console.log(
      '🚀 ~ file: user-vehicle.service.ts ~ line 148 ~ UserVehicleService ~ userVehicle',
      userVehicle,
    );
    userVehicle.carMetadataId = carMetadata._id;
    userVehicle.color = color;
    let fileName = userVehicle.vehicleImage,
      url = null;
    if (vehicleImage) {
      const baseName = basename(vehicleImage.originalname);
      const extName = extname(vehicleImage.originalname);
      fileName = `vehicle/${baseName.replace(
        extName,
        '',
      )}_${Date.now()}${extname(vehicleImage.originalname)}`;
      await this.s3Service.uploadFile(vehicleImage.buffer, fileName);
      userVehicle.vehicleImage = fileName;
    }
    await userVehicle.save();
    if (fileName) {
      url = await this.s3Service.getSignedUrl(fileName);
    }
    return {
      ...userVehicle.toJSON(),
      vechicleImageUrl: url,
    };
  }

  async deleteVehicleById(userId: mongoose.ObjectId, vehicleId: string) {
    const userVehicle = await this.findUserVehicleByParams({
      userId,
      _id: new mongoose.mongo.ObjectId(vehicleId),
    });

    userVehicle.deleted = true;

    await userVehicle.save();

    return { message: 'Success' };
  }

  async findUserVehicleByParams(params = {}) {
    const userVehicle = await this.userVehicleModel.findOne(params);
    if (!userVehicle) {
      throw new NotFoundException('User vechicle not found');
    }
    return userVehicle;
  }

  async hasVehicles(userId: mongoose.ObjectId) {
    const seekerVehicles = await this.userVehicleModel.find({ userId });
    return seekerVehicles.length > 0;
  }
}
