import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/user/enums/roles.enum';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
