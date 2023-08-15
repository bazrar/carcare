import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { RoleGuard } from 'src/role/guards/role.guard';
import { Role } from 'src/user/enums/roles.enum';
import { User } from 'src/user/schemas/auth.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UserVehicleService } from './user-vehicle.service';
@ApiTags('user cars')
@ApiBearerAuth('access-token')
@Controller('api/user-vehicle')
export class UserVehicleController {
  constructor(private readonly userVehicleService: UserVehicleService) {}

  @Get(':vechicleId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  async getUserVehicle(
    @Param('vechicleId') userVehicleId: string,
    @GetUser() user,
  ) {
    return this.userVehicleService.getUserVehicleById(user._id, userVehicleId);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  async getAllUserVehicles(@GetUser() user: User, userVehicleFilterDto: any) {
    return this.userVehicleService.getAllUserVehicles(
      user._id,
      userVehicleFilterDto,
    );
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('vehicleImage', {
      fileFilter: (req: any, file: any, cb: any) => {
        cb(null, true);
      },
    }),
  )
  async createVehicle(
    @GetUser() user: User,
    @Body() createVechicleDto: CreateVehicleDto,
    @UploadedFile() vehicleImage?: Express.Multer.File,
  ) {
    console.log(vehicleImage);
    return this.userVehicleService.createVehicle(
      user._id,
      createVechicleDto,
      vehicleImage,
    );
  }

  @Put(':vehicleId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('vehicleImage', {
      fileFilter: (req: any, file: any, cb: any) => {
        cb(null, true);
      },
    }),
  )
  async updateVechile(
    @GetUser() user: User,
    @Param('vehicleId') vehicleId: string,
    @Body() updateUserVehicleDto: UpdateVehicleDto,
    @UploadedFile() vehicleImage: Express.Multer.File,
  ) {
    return this.userVehicleService.updateVechile(
      user._id,
      vehicleId,
      updateUserVehicleDto,
      vehicleImage,
    );
  }

  @Delete(':vehicleId')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.SEEKER)
  async deleteVechicleById(
    @GetUser() user: User,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.userVehicleService.deleteVehicleById(user._id, vehicleId);
  }
}
