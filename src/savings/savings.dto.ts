import { Trim } from 'class-sanitizer';
import { ApiProperty } from '@nestjs/swagger';

import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterSavingDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @ApiProperty()
  public readonly description: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  public readonly amount: number;
}

export class GetReportDto {
  @IsDateString()
  @IsNotEmpty()
  @Trim()
  @ApiProperty()
  public readonly startDate: string;

  @IsDateString()
  @IsNotEmpty()
  @Trim()
  @ApiProperty()
  public readonly endDate: string;
}
