import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as mongooseSlugPlugin from 'mongoose-slug-generator';
import { Job, JobSchema } from './schemas/job.schema';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { ServiceModule } from 'src/service/service.module';
import { JobsSeeder } from './jobs.seeder';
import { BusinessModule } from 'src/business/business.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Job.name,
        useFactory: () => {
          const schema = JobSchema;
          schema.plugin(mongooseSlugPlugin);
          return schema;
        },
      },
    ]),
    ServiceModule,
    BusinessModule,
  ],
  controllers: [JobController],
  providers: [JobService, JobsSeeder],
  exports: [JobService],
})
export class JobModule {}
