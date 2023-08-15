import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessModule } from 'src/business/business.module';
import { Business } from 'src/business/schemas/business.schema';
import { BusinessDocumentController } from './business-document.controller';
import { BusinessDocumentService } from './business-document.service';

@Module({
  imports: [BusinessModule],
  controllers: [BusinessDocumentController],
  providers: [BusinessDocumentService],
})
export class BusinessDocumentModule {}
