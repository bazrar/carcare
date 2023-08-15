import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';

export class UpdateVehicleDto extends PickType(CreateVehicleDto, [
  'make',
  'model',
  'year',
  'bodyStyles',
  'color',
] as const) {
  @ApiProperty({
    description: 'image of seeker vehicle',
    type: 'string',
    format: 'binary',
  })
  vehicleImage?: Express.Multer.File;
}
