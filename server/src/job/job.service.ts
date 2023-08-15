import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ServiceService } from 'src/service/service.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Job } from './schemas/job.schema';
import { BusinessService } from 'src/business/business.service';
import { User } from 'src/user/schemas/auth.schema';
import { Role } from 'src/user/enums/roles.enum';

@Injectable()
export class JobService {
  constructor(
    @InjectModel(Job.name)
    private readonly jobModel: mongoose.Model<Job>,
    private readonly serviceService: ServiceService,
    private readonly businessService: BusinessService,
  ) {}
  async getJobById(jobId: string) {
    const job = this.jobModel.findOne({ _id: jobId });
    if (!job) {
      throw new NotFoundException(`Job not found`);
    }
    return job;
  }

  async listJobs() {
    return this.jobModel.find();
  }

  async listBusinessJobs(businessId: string) {
    console.log('🚀 ~ REACHED');
    const business = await this.businessService.findBusinessByParams({
      _id: businessId,
    });
    if (!business)
      throw new NotFoundException(
        'Unable reolve business, please make sure business exists',
      );

    return this.jobModel.find({ $or: [{ isDefault: true }, { businessId }] });
  }

  async getJobsForService(serviceId: string) {
    return this.jobModel.find({
      serviceId: new mongoose.mongo.ObjectId(serviceId),
    });
  }

  async createJob(createJobDto: CreateJobDto, user?: User) {
    const jobConfig = createJobDto;
    if (user) {
      if (user.role === Role.ADMIN) {
        jobConfig.isDefault = true;
        jobConfig.businessId = null;
      } else if (user.role === Role.PROVIDER) {
        jobConfig.isDefault = false;
        const business = await this.businessService.findBusinessByParams({
          _id: jobConfig.businessId,
        });
        if (!business) {
          throw new NotFoundException(
            'Unable to Create Job for business, please make sure business exists',
          );
        }
      }
    }

    return await this.jobModel.create(jobConfig);
  }

  async getJobByName(name: string) {
    return this.jobModel.findOne({ name });
  }

  async updateSubcategoryById(
    jobId: string,
    updateJobDto: UpdateJobDto,
    user: User,
  ) {
    const job = await this.getJobById(jobId);

    if (!job) {
      throw new NotFoundException(`Job not found`);
    }

    if (user.role === Role.PROVIDER && job.isDefault) {
      throw new ForbiddenException(`You can't update default job`);
    } else if (
      user.role === Role.PROVIDER &&
      !job.isDefault &&
      job.businessId
    ) {
      const business = await this.businessService.findBusinessByParams({
        _id: job.businessId._id,
        isDefault: false,
        userId: user._id,
      });

      if (!business) {
        throw new NotFoundException(
          'Unable to Update Job, please make sure job exists',
        );
      }

      job.name = updateJobDto.name;
      job.description = updateJobDto.description;
    } else if (user.role === Role.ADMIN) {
      job.name = updateJobDto.name;
      job.description = updateJobDto.description;
    }

    await job.save();
    return job;
  }

  async deleteJobById(jobId: string, user: User) {
    const job = await this.getJobById(jobId);

    if (!job) {
      throw new NotFoundException(`Job not found`);
    }

    if (user.role === Role.PROVIDER && job.isDefault) {
      throw new ForbiddenException(`You can't delete default job`);
    } else if (
      user.role === Role.PROVIDER &&
      !job.isDefault &&
      job.businessId
    ) {
      const business = await this.businessService.findBusinessByParams({
        _id: job.businessId._id,
        isDefault: false,
        userId: user._id,
      });

      if (!business) {
        throw new NotFoundException(
          'Unable to delete Job, please make sure job exists',
        );
      }
      await job.delete();
    } else if (user.role === Role.ADMIN) {
      await job.delete();
    }
  }
}
