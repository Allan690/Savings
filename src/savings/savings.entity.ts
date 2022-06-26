import { User } from '@/users/users.entity';
import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Savings extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar', nullable: false, default: '' })
  @ApiProperty()
  public description!: string | null;

  @Column({ type: 'int', nullable: false, default: 0 })
  @ApiProperty()
  public amount!: number;

  @Index('saving_userId_index')
  @ManyToOne(() => User, (user) => user.savings)
  public user: User;

  @Column({ type: 'timestamp', nullable: false })
  @ApiProperty()
  public date: Date;
}
