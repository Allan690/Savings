import { ApiProperty } from '@nestjs/swagger';
import { Trim } from 'class-sanitizer';
import { IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @ApiProperty()
  public readonly username?: string;

  @IsString()
  @MinLength(8)
  @ApiProperty()
  public readonly password: string;
}

export class LoginDto {
  @Trim()
  @IsString()
  @ApiProperty()
  public readonly username: string;

  @IsString()
  @ApiProperty()
  public readonly password: string;
}
