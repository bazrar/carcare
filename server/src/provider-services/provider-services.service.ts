import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { BusinessService } from 'src/business/business.service';
import { Business } from 'src/business/schemas/business.schema';
import { JobService } from 'src/job/job.service';
import { ServiceStationService } from 'src/service-station/service-station.service';
import { ServiceService } from 'src/service/service.service';
import { User } from 'src/user/schemas/auth.schema';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import {
  IProviderServiceDescription,
  ProviderService,
} from './schemas/provider-service.schema';

@Injectable()
export class ProviderServicesService {
  constructor(
    @InjectModel(ProviderService.name)
    private readonly providerServiceModel: mongoose.Model<ProviderService>,
    private readonly serviceService: ServiceService,
    private readonly jobService: JobService,
    private readonly businessService: BusinessService,
    @Inject(forwardRef(() => ServiceStationService))
    private readonly serviceStationService: ServiceStationService, // private readonly serviceStationService: ServiceStationService,
  ) {}
  async createOrUpdateProviderSerivces(
    user: User,
    serviceId: string,
    serviceStationId: string,
    createOrUpdateProviderServiceDto: CreateProviderServiceDto,
  ) {
    const service = await this.serviceService.getServiceById(serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const serviceStation =
      await this.serviceStationService.findServiceStationByParams({
        _id: new mongoose.mongo.ObjectId(serviceStationId),
      });

    const business: Business = await this.businessService.findBusinessByParams({
      userId: serviceStation.userId,
    });
    if (!business) {
      throw new NotFoundException('Please update business first');
    }

    let providerService: ProviderService =
      await this.findProviderServiceByParams({
        serviceStationId: serviceStation._id,
        serviceId: service._id,
      });

    if (!providerService) {
      providerService = new this.providerServiceModel();
    }
    const { minPrice, maxPrice, jobs, expectedTimeToComplete, isActive } =
      createOrUpdateProviderServiceDto;

    providerService.minPrice = minPrice;
    providerService.maxPrice = maxPrice;

    if (minPrice > maxPrice) {
      throw new BadRequestException('Invalid min/max price value');
    }

    providerService.serviceId = service._id;
    providerService.serviceStationId = serviceStation._id;
    providerService.userId = business.userId;
    providerService.isActive =
      typeof isActive === 'undefined' ? true : isActive;
    console.log(
      '🚀 ~ file: provider-services.service.ts ~ line 72 ~ ProviderServicesService ~ providerService',
      providerService,
    );

    const businessId = serviceStation.businessId._id;

    const jobPromises = await jobs.reduce(
      async (previousPromise, { jobId, description, name }) => {
        const acc = await previousPromise;
        const job = await this.jobService.getJobById(jobId);

        if (job) {
          const jobDescription =
            description?.trim()?.length > 0 ? description : job.description;
          const jobName = name?.trim()?.length > 0 ? name : job.name;

          acc.push({
            jobId: jobId,
            description: jobDescription,
            name: jobName,
          });
        } else {
          try {
            const customJob = await this.jobService.createJob(
              {
                name,
                description,
                businessId,
              },
              user,
            );
            acc.push({
              jobId: customJob._id,
              description: customJob.description,
              name: customJob.name,
            });
          } catch (error) {
            console.log(
              '🚀 ~ file: provider-services.service.ts:124 ~ ProviderServicesService ~ error:',
              error,
            );

            throw new BadRequestException(
              error.message + ' Error creating custom job',
            );
          }
        }

        return acc;
      },
      Promise.resolve([] as IProviderServiceDescription[]),
    );

    providerService.jobs = jobPromises;
    providerService.expectedTimeToComplete = expectedTimeToComplete;
    const isInArray = serviceStation.services.some((serviceId) => {
      return serviceId.toString() === service._id.toString();
    });

    if (!isInArray && providerService.isActive) {
      serviceStation.services = [...serviceStation.services, service._id];
      await serviceStation.save();
    } else if (isInArray && !providerService.isActive) {
      serviceStation.services = serviceStation.services.filter(
        (serviceId) => serviceId.toString() !== service._id.toString(),
      );

      if (!serviceStation.services.length) {
        serviceStation.published = false;
      }

      await serviceStation.save();
    }
    await providerService.save();
    return;
  }

  async getProviderServices(
    userId: mongoose.ObjectId,
    serviceId: string,
    serviceStationId: string,
  ) {
    // find the provider services with id = userId
    const service = await this.serviceService.getServiceById(serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    const providerService = await this.getProviderServiceById(
      serviceId,
      serviceStationId,
    );

    if (!providerService) {
      return {
        serviceId: service._id,
        serviceName: service.name,
        minPrice: null,
        maxPrice: null,
        expectedTimeToComplete: null,
        jobs: [],
        isActive: false,
        description: service.description,
      };
    } else {
      return {
        service: service._id,
        serviceName: service.name,
        minPrice: providerService?.minPrice,
        maxPrice: providerService?.maxPrice,
        expectedTimeToComplete: providerService?.expectedTimeToComplete,
        jobs: providerService.jobs,
        isActive: providerService.isActive || false,
        description: service.description,
      };
    }
    // if count === 0, then return from Job
    // else return all his
  }
  async getProviderServiceById(serviceId: string, serviceStationId: string) {
    return await this.findProviderServiceByParams({
      serviceId: new mongoose.mongo.ObjectId(serviceId),
      serviceStationId: new mongoose.mongo.ObjectId(serviceStationId),
    });
  }

  async getProviderServiceForSeeker(
    serviceId: string,
    serviceStationId: string,
  ) {
    // todo: need to refactor this and above to same without userId.
    // for now, create new
    return await this.findProviderServiceByParams({
      serviceId: new mongoose.mongo.ObjectId(serviceId),
      serviceStationId: new mongoose.mongo.ObjectId(serviceStationId),
    });
  }

  async findProviderServiceByParams(params = {}) {
    return this.providerServiceModel.findOne(params);
    //.populate({
    //path: 'jobs.jobId',
    //}).then((providerService) => {
    //return {
    //...providerService,
    //jobs: providerService.jobs?.map((job) => {
    //const _job = (job?.jobId as any)?.toJSON();

    //return {
    //...(job as any)?.toJSON(),
    //jobId: _job?._id ?? null,
    //isDefault: _job?.isDefault,
    //}
    //})
    //} as any;
    //})
  }
}
