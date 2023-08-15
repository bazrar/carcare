import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { Role } from 'src/user/enums/roles.enum';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobService } from './job.service';
import { RoleGuard } from 'src/role/guards/role.guard';
import { GetUser } from 'src/auth/get-user.decorator';

@ApiTags('Job')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessTokenGuard)
@Controller('api/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get(':id')
  @ApiBearerAuth('access-token')
  getSeriveById(@Param('id') jobId: string) {
    return this.jobService.getJobById(jobId);
  }

  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Get()
  @ApiBearerAuth('access-token')
  listJobs() {
    return this.jobService.listJobs();
  }

  @Get('business/:businessId')
  @ApiBearerAuth('access-token')
  async listBusinessJobs(@Param('businessId') businessId: string) {
    return await this.jobService.listBusinessJobs(businessId);
  }

  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.PROVIDER)
  @Post()
  @ApiBearerAuth('access-token')
  createJob(@GetUser() user, @Body() createJobDto: CreateJobDto) {
    return this.jobService.createJob(createJobDto, user);
  }

  @Roles(Role.ADMIN, Role.PROVIDER)
  @Put()
  @ApiBearerAuth('access-token')
  updateJobById(
    @GetUser() user,
    @Param('id') serviceId: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobService.updateSubcategoryById(serviceId, updateJobDto, user);
  }

  @Roles(Role.ADMIN, Role.PROVIDER)
  @Delete()
  @ApiBearerAuth('access-token')
  deleteJobById(@GetUser() user, @Param('id') subcategoryId) {
    return this.jobService.deleteJobById(subcategoryId, user);
  }
}
