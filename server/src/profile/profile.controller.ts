import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  Put,
  UseInterceptors,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from 'src/auth/auth.service';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { Role } from 'src/user/enums/roles.enum';
import { User } from 'src/user/schemas/auth.schema';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { Profile } from './schemas/profile.schema';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleGuard } from 'src/role/guards/role.guard';
import { S3Service } from 'src/s3/s3.service';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@Controller('api/profile')
@UseGuards(JwtAccessTokenGuard, RoleGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly authService: AuthService,
    private readonly s3Service: S3Service,
  ) {}

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Get()
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.SEEKER, Role.MANAGER, Role.TEAM_MEMBER)
  async getProfile(@GetUser() user: User) {
    return await this.profileService.getUserProfile(user);
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Post()
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.SEEKER, Role.MANAGER, Role.TEAM_MEMBER)
  async createProfile(
    @Body() createProfileDto: CreateProfileDto,
    @GetUser() user: User,
  ): Promise<Profile> {
    return await this.profileService.createProfile(user._id, createProfileDto);
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Put()
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.SEEKER, Role.MANAGER, Role.TEAM_MEMBER)
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @GetUser() user: User,
  ) {
    return await this.profileService.updateProfile(user._id, updateProfileDto);
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Post('avatar')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Roles(Role.PROVIDER, Role.SEEKER, Role.MANAGER, Role.TEAM_MEMBER)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadProfileAvatar(
    @UploadedFile() avatar: Express.Multer.File,
    @GetUser() user: User,
  ) {
    return this.profileService.updateProfileAvatar(user._id, avatar);
    // todo: validation required
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Patch('/privacy-policy')
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER, Role.SEEKER, Role.MANAGER, Role.TEAM_MEMBER)
  async acceptPrivacyPolicy(@GetUser() user: User): Promise<Profile> {
    return await this.profileService.acceptPrivacyPolicy(user._id);
  }
}
