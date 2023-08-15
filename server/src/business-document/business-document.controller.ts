import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { BusinessService } from 'src/business/business.service';
import { Roles } from 'src/role/decorators/role.decorator';
import { RoleGuard } from 'src/role/guards/role.guard';
import { Role } from 'src/user/enums/roles.enum';

@ApiTags('Business documents')
@Controller('api/business-document')
export class BusinessDocumentController {
  constructor(private readonly businessService: BusinessService) {}
  @Post('upload-registration-document')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        registrationDocument: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  @UseInterceptors(FileInterceptor('registrationDocument'))
  async uploadRegistrationDocument(
    @GetUser() user,
    @UploadedFile() registrationDocument: Express.Multer.File,
  ) {
    return this.businessService.uploadRegistrationDocument(
      user,
      registrationDocument,
    );
  }

  @Post('upload-insurance-document')
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        insuranceDocument: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @Roles(Role.PROVIDER, Role.MANAGER)
  @UseInterceptors(FileInterceptor('insuranceDocument'))
  async uploadInsuranceDocument(
    @GetUser() user,
    @UploadedFile() insuranceDocument: Express.Multer.File,
  ) {
    return this.businessService.uploadInsuranceDocument(
      user,
      insuranceDocument,
    );
  }
}
