import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  public id: number;

  @ApiProperty()
  public username: string;
}
