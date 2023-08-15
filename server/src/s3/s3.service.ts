import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  constructor(private readonly configService: ConfigService) {
    const configuration = this.getAwsS3Configuration();
    this.s3Client = new S3Client(configuration);
  }
  async uploadFile(
    file: any,
    fileName: string,
    bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME'),
  ) {
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: file,
    };
    await this.s3Client.send(new PutObjectCommand(uploadParams));
  }

  async getSignedUrl(
    fileName: string,
    bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME'),
  ) {
    const s3Configuration = this.getAwsS3Configuration();
    const s3 = new S3Client(s3Configuration);
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 15 * 60 });
    return url;
  }

  getAwsS3Configuration() {
    const accessKeyId = this.configService.get('AWS_S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_S3_ACCESS_SECRET_KEY',
    );
    const region = this.configService.get<string>('AWS_S3_REGION');

    return {
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    };
  }
}
