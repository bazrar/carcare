import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { RoleGuard } from 'src/role/guards/role.guard';
import { Role } from 'src/user/enums/roles.enum';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@ApiTags('Business')
@Controller('api/business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}
  @Post('/')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ]),
  )
  createBusiness(
    @GetUser() user,
    @Body() createBusinessDto: CreateBusinessDto,
    @UploadedFiles()
    files: { logo?: Express.Multer.File[]; coverImage?: Express.Multer.File[] },
  ) {
    const zipCode = createBusinessDto.zipCode;
    const isValidZip = /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zipCode);
    if (!isValidZip) {
      return 'Invalid zip code';
    }
    return this.businessService.createBusiness({
      ...createBusinessDto,
      userId: user._id,
      logo: files?.logo?.[0],
      coverImage: files?.coverImage?.[0],
    });
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER)
  getBusiness(@GetUser() user) {
    return this.businessService.getBusiness(user);
  }

  @Put()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ]),
  )
  updateBusiness(
    @GetUser() user,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @UploadedFiles()
    files: { logo?: Express.Multer.File[]; coverImage?: Express.Multer.File[] },
  ) {
    return this.businessService.updateBusiness(user, {
      ...updateBusinessDto,
      logo: files?.logo?.[0],
      coverImage: files?.coverImage?.[0],
    });
  }

  @Delete()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER)
  deleteBusiness(@GetUser() user) {
    return this.businessService.deleteBusiness(user);
  }
}
