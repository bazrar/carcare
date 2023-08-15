import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, AuthSchema } from './schemas/auth.schema';
import { UserService } from './user.service';

@Module({
  exports: [UserService],
  providers: [UserService],
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: AuthSchema,
      },
    ]),
  ],
})
export class UserModule {}
