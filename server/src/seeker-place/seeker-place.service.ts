import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { CreateSeekerPlaceDto } from './dto/create-seeker-place.dto';
import { UpdateSeekerPlaceDto } from './dto/update-seeker-place.dto';
import { SeekerPlace } from './schema/seeker-place.schema';
import * as NodeGeocoder from 'node-geocoder';
import { ListSeekerPlaceFilterDto } from './dto/list-seeker-place-filter.dto';
const options = {
  provider: 'google',

  // Optional depending on the providers
  // fetch: customFetchImplementation,
  // todo: move this to environment variable
  apiKey: 'AIzaSyBz-Y0ERlkgBcq8YFUimZA3O9CW90YsRGU', // for Mapquest, OpenCage, Google Premier
  formatter: null, // 'gpx', 'string', ...
};
@Injectable()
export class SeekerPlaceService {
  constructor(
    @InjectModel(SeekerPlace.name)
    private readonly seekerPlaceModel: mongoose.Model<SeekerPlace>,
  ) {}
  async updatePlaceTimestamp(
    userId: mongoose.ObjectId,
    latitude: number,
    longitude: number,
  ) {
    const seekerPlace = await this.findSeekerByParams({
      userId,
      latitude,
      longitude,
    });
    if (seekerPlace) {
      seekerPlace.changedAt = new Date();
      await seekerPlace.save();
    }
  }

  async findSeekerPlaceById(userId: mongoose.ObjectId, placeId: string) {
    const seekerPlace = await this.findSeekerByParams({
      userId,
      _id: new mongoose.mongo.ObjectId(placeId),
      deleted: { $exists: false },
    });
    if (!seekerPlace) {
      throw new NotFoundException('Seeker place not found');
    }
    seekerPlace.changedAt = new Date();
    await seekerPlace.save();
    return seekerPlace;
  }

  async deleteSeeker(userId: mongoose.ObjectId, seekerPlaceId: string) {
    console.log(
      '🚀 ~ file: seeker-place.service.ts ~ line 37 ~ SeekerPlaceService ~ deleteSeeker ~ seekerPlaceId',
      seekerPlaceId,
    );
    const seekerPlace = await this.findSeekerByParams({
      userId,
      _id: new mongoose.mongo.ObjectId(seekerPlaceId),
      deleted: { $exists: false },
    });
    if (!seekerPlace) {
      throw new NotFoundException('Seeker place not found');
    }
    seekerPlace.deleted = true;
    await seekerPlace.save();
  }

  async updateSeekerPlace(
    userId: mongoose.ObjectId,
    seekerPlaceId: string,
    updateSeekerPlaceDto: UpdateSeekerPlaceDto,
  ) {
    const seekerPlace = await this.findSeekerByParams({
      userId,
      _id: new mongoose.mongo.ObjectId(seekerPlaceId),
      deleted: { $exists: false },
    });
    if (!seekerPlace) {
      throw new NotFoundException('Seeker place not found');
    }
    const { name, address, longitude, latitude } = updateSeekerPlaceDto;
    let seekerPlaceName = name;
    let seekerAddress = address;
    if (!name) {
      const placeAddress = await this.getPlaceNameFromLatLong(
        latitude,
        longitude,
      );
      const placeAddressToken = placeAddress.split(',');
      seekerPlaceName = placeAddressToken[0];
      seekerAddress =
        placeAddressToken.length > 2
          ? [placeAddressToken[1], placeAddressToken[2]].join(',')
          : placeAddressToken[1];
    }
    seekerPlace.name = seekerPlaceName;
    seekerPlace.address = seekerAddress;
    seekerPlace.longitude = longitude;
    seekerPlace.latitude = latitude;
    await seekerPlace.save();
    return seekerPlace;
  }

  async listSeekerPlace(
    userId: string,
    listSeekerPlaceFilterDto: ListSeekerPlaceFilterDto,
  ): Promise<SeekerPlace[]> {
    const { limit } = listSeekerPlaceFilterDto;
    const dataLimit = limit || '3';
    console.log({ dataLimit });
    return this.seekerPlaceModel
      .find({
        deleted: { $exists: false },
        userId,
      })
      .sort({ changedAt: -1 })
      .limit(parseInt(dataLimit));
  }

  async createSeekerPlace(
    userId: mongoose.ObjectId,
    createSeekerPlaceDto: CreateSeekerPlaceDto,
  ): Promise<SeekerPlace> {
    console.log(
      '🚀 ~ file: seeker-place.service.ts ~ line 72 ~ SeekerPlaceService ~ CreateSeekerPlaceDto',
      CreateSeekerPlaceDto,
    );
    const { name, address, type, latitude, longitude } = createSeekerPlaceDto;
    let seekerPlaceName = name;
    let seekerAddress = address;
    console.log(
      '🚀 ~ file: seeker-place.service.ts ~ line 77 ~ SeekerPlaceService ~ ame, type, latitude, longitude',
      name,
      type,
      latitude,
      longitude,
    );
    if (!name) {
      // Reverse geocoding
      // google place api
      const placeAddress = await this.getPlaceNameFromLatLong(
        latitude,
        longitude,
      );
      const placeAddressToken = placeAddress.split(',');
      seekerPlaceName = placeAddressToken[0];
      seekerAddress =
        placeAddressToken.length > 2
          ? [placeAddressToken[1], placeAddressToken[2]].join(',')
          : placeAddressToken[1];
    }
    const existingSeekerPlace = await this.seekerPlaceModel.findOne({
      userId,
      longitude,
      latitude,
    });
    if (existingSeekerPlace) {
      existingSeekerPlace.changedAt = new Date();
      await existingSeekerPlace.save();
      throw new BadRequestException('This location has been already added');
    }

    const seekerPlace = await this.seekerPlaceModel.create({
      name: seekerPlaceName,
      address: seekerAddress,
      type,
      userId,
      longitude,
      latitude,
    });
    return seekerPlace;
  }

  async findSeekerByParams(args = {}) {
    const seekerPlace = await this.seekerPlaceModel.findOne(args);
    return seekerPlace;
  }

  async getPlaceNameFromLatLong(lat, lon) {
    const geocoder = NodeGeocoder(options);
    const res = await geocoder.reverse({ lat, lon });
    if (Array.isArray(res) && res.length) {
      const firstPlace = res[0];
      return firstPlace.formattedAddress;
    }
    return '';
  }

  async hasPlaces(userId: mongoose.ObjectId) {
    const seekerPlace = await this.seekerPlaceModel.find({
      userId: userId,
      deleted: { $exists: false },
    });
    return seekerPlace.length > 0;
  }
}
