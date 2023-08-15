import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import mongoose from 'mongoose';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { RoleGuard } from 'src/role/guards/role.guard';
import { Role } from 'src/user/enums/roles.enum';
import { User } from 'src/user/schemas/auth.schema';
import { CreateSeekerPlaceDto } from './dto/create-seeker-place.dto';
import { ListSeekerPlaceFilterDto } from './dto/list-seeker-place-filter.dto';
import { UpdateSeekerPlaceDto } from './dto/update-seeker-place.dto';
import { SeekerPlace } from './schema/seeker-place.schema';
import { SeekerPlaceService } from './seeker-place.service';

@ApiTags('seeker')
@Controller('api/seeker-place')
@UseGuards(JwtAccessTokenGuard, RoleGuard)
export class SeekerPlaceController {
  constructor(private readonly seekerPlaceService: SeekerPlaceService) {}
  @Post()
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  createSeekerPlace(
    @GetUser() user: User,
    @Body() createSeekerPlaceDto: CreateSeekerPlaceDto,
  ): Promise<SeekerPlace> {
    return this.seekerPlaceService.createSeekerPlace(
      user._id,
      createSeekerPlaceDto,
    );
  }

  @Get()
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  listSeekerPlace(
    @GetUser() user: User,
    @Query() listSeekerPlaceFilterDto: ListSeekerPlaceFilterDto,
  ): Promise<Array<SeekerPlace>> {
    return this.seekerPlaceService.listSeekerPlace(
      user._id,
      listSeekerPlaceFilterDto,
    );
  }

  @Put(':seekerPlaceId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  updateSeekerPlace(
    @GetUser() user: User,
    @Param('seekerPlaceId') seekerPlaceId: string,
    @Body() updateSeekerPlaceDto: UpdateSeekerPlaceDto,
  ) {
    return this.seekerPlaceService.updateSeekerPlace(
      user._id,
      seekerPlaceId,
      updateSeekerPlaceDto,
    );
  }

  @Get(':seekerPlaceId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  getSeekerPlace(
    @GetUser() user: User,
    @Param('seekerPlaceId') seekerPlaceId: string,
  ) {
    return this.seekerPlaceService.findSeekerByParams({
      userId: user._id,
      _id: new mongoose.mongo.ObjectId(seekerPlaceId),
    });
  }

  @Delete(':seekerPlaceId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  deleteSeekerPlace(
    @GetUser() user: User,
    @Param('seekerPlaceId') seekerPlaceId: string,
  ) {
    return this.seekerPlaceService.deleteSeeker(user._id, seekerPlaceId);
  }
}
