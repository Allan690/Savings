import { Savings } from '@/savings/savings.entity';
import { Exclude } from 'class-transformer';
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Exclude()
  @Column({ type: 'varchar' })
  public password!: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  public username: string | null;

  @OneToMany(() => Savings, (saving) => saving.user)
  public savings: Savings[];
}
