import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class ListSeekerPlaceFilterDto {
  @ApiPropertyOptional({
    description: 'limit',
  })
  @IsOptional()
  limit: string;
}
