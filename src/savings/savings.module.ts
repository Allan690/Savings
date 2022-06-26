import { CacheModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { SavingsService } from './savings.service';
import { SavingsController } from './savings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Savings } from './savings.entity';
import { AuthModule } from '@/auth/auth.module';
import { User } from '@/users/users.entity';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
      ttl: 60 * 60,
      max: 100,
    }),
    TypeOrmModule.forFeature([Savings, User]),
    AuthModule,
  ],
  providers: [SavingsService],
  controllers: [SavingsController],
  exports: [SavingsService],
})
export class SavingsModule {}
