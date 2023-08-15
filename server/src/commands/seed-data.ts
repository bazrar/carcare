import fs from 'fs';
import { Command, CommandRunner } from 'nest-commander';
import { AuthService } from 'src/auth/auth.service';
import { BusinessService } from 'src/business/business.service';
import { Business } from 'src/business/schemas/business.schema';
import { JobService } from 'src/job/job.service';
import { Job } from 'src/job/schemas/job.schema';
import { ProfileService } from 'src/profile/profile.service';
import { ProviderServicesService } from 'src/provider-services/provider-services.service';
import {
  ServiceStationManagerType,
  ServiceStationRoleType,
  ServiceStationTypeEnum,
} from 'src/service-station/schemas/service-station.schema';
import { ServiceStationService } from 'src/service-station/service-station.service';
import { ServiceService } from 'src/service/service.service';
import { Role } from 'src/user/enums/roles.enum';
import { UserService } from 'src/user/user.service';

@Command({ name: 'providerdata' })
export class ProviderDataCommandRunner implements CommandRunner {
  constructor(
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly businessService: BusinessService,
    private readonly serviceStationService: ServiceStationService,
    private readonly serviceService: ServiceService,
    private readonly providerServicesService: ProviderServicesService,
    private readonly jobService: JobService,
  ) {}
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const provider = await this.authService.createUser(
      '17864206154',
      Role.PROVIDER,
    );
    const profile = await this.profileService.createProfile(provider._id, {
      firstName: 'seed data',
      middleName: 'seed data',
      lastName: 'seed',
      email: 'a@a.com',
    });
    const serviceStation =
      await this.serviceStationService.createServiceStation({
        user: provider,
        name: 'Service station name',
        serviceStationManagerType: ServiceStationManagerType.SELF,
        bookingCapacity: 10,
        serviceStationType: ServiceStationTypeEnum.MOBILE,
        availableWithin: 10,
        location: {
          latitude: 10,
          longitude: 20,
        },
        pickAndDrop: true,
        team: [
          {
            role: ServiceStationRoleType.TEAM_MEMBER,
            mobileNumber: '17864206154',
            name: 'firstname lastname',
            enableLocationTracking: true,
          },
        ],
        // locationTrackingMemberId: ServiceStationRoleType.TEAM_MEMBER,
        isLocationTrackingEnabled: true,
        serviceHours: { openingTime: '10:00', closingTime: '20:00' },
      });
    const services = await this.serviceService.listServices();

    for (const service of services) {
      const jobs: Job[] = await this.jobService.getJobsForService(
        service._id.toString(),
      );

      await this.providerServicesService.createOrUpdateProviderSerivces(
        provider,
        service._id.toString(),
        // @ts-expect-error:next-line
        serviceStation._id.toString(),
        {
          minPrice: 0,
          maxPrice: 0,
          expectedTimeToComplete: 0,
          // @ts-expect-error:next-line
          jobs: jobs.map((job) => ({
            jobId: job._id.toString(),
            description: `description ${job._id.toString()}`,
          })),
        },
      );
    }
  }
}
