import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Command } from 'nestjs-command';
import { Job } from './schemas/job.schema';

@Injectable()
export class JobsSeeder {
  constructor(
    @InjectModel(Job.name)
    private readonly jobModel: mongoose.Model<Job>,
  ) {}

  @Command({
    command: 'seed:jobs',
    describe: 'seed jobs',
  })
  async seed(): Promise<void> {
    const jobs = [
      {
        name: 'Bad Odor Removal',
        description: 'Effective odor removal for a fresh-smelling interior.',
        slug: 'bad-odor-removal',
      },
      {
        name: 'Clean Air Vents',
        description: 'Thorough cleaning of air vents to improve air quality.',
        slug: 'clean-air-vents',
      },
      {
        name: 'Clean Headliner',
        description:
          'Gentle cleaning of the car headliner for a pristine look.',
        slug: 'clean-headliner',
      },
      {
        name: 'Clean Interior Windows',
        description: 'Crystal clear windows for improved visibility.',
        slug: 'clean-interior-windows',
      },
      {
        name: 'Cup Holders',
        description: 'Thorough cleaning and disinfection of cup holders.',
        slug: 'cup-holders',
      },
      {
        name: 'Deep Shampoo Carpets',
        description: 'Intensive carpet cleaning to remove dirt and stains.',
        slug: 'deep-shampoo-carpets',
      },
      {
        name: 'Door Jambs',
        description:
          'Cleaning and degreasing of door jambs for a polished look.',
        slug: 'door-jambs',
      },
      {
        name: 'Full Interior Wipe Down',
        description: 'Comprehensive wiping down of all interior surfaces.',
        slug: 'full-interior-wipe-down',
      },
      {
        name: 'Leather Cleaning',
        description: 'Specialized cleaning to rejuvenate leather surfaces.',
        slug: 'leather-cleaning',
      },
      {
        name: 'Leather Conditioning',
        description:
          'Conditioning treatment to restore moisture and suppleness to leather.',
        slug: 'leather-conditioning',
      },
      {
        name: 'Sanitize',
        description: 'Thorough sanitization of the car interior.',
        slug: 'sanitize',
      },
      {
        name: 'Shampoo Floor Mats',
        description: 'Deep cleaning of floor mats to remove dirt and stains.',
        slug: 'shampoo-floor-mats',
      },
      {
        name: 'Trunk Cleaning',
        description: 'Cleaning and organizing of the trunk space.',
        slug: 'trunk-cleaning',
      },
      {
        name: 'UV Protection',
        description: 'Application of UV protection for interior surfaces.',
        slug: 'uv-protection',
      },
      {
        name: 'Vacuum',
        description: 'Thorough vacuuming to remove dirt and debris.',
        slug: 'vacuum',
      },
    ];
    try {
      for (const job of jobs) {
        await this.jobModel.updateOne(
          { name: job.name }, // Search condition
          { $set: { ...job, isDefault: true, businessId: null } }, // Data to update/insert
          { upsert: true }, // Enable upsert to update or insert if not found
        );
      }
    } catch (error) {
      console.log('ERROR SEEDING JOBS', { error });
    }
  }
}
