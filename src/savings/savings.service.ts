import { generateReport } from '@/common/excel/excel.report';
import { PageDto, PageMetaDto, PageOptionsDto } from '@/common/pagination';
import { User } from '@/users/users.entity';
import {
  CACHE_MANAGER,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw } from 'typeorm';
import { Repository } from 'typeorm';
import { GetReportDto, RegisterSavingDto } from './savings.dto';
import { Savings } from './savings.entity';
import { Cache } from 'cache-manager';

@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(Savings)
    private readonly repository: Repository<Savings>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async clearCache() {
    const keys: string[] = await this.cacheManager.store.keys();
    keys.forEach((key) => {
      if (key.startsWith(`GET_SAVINGS_`)) {
        this.cacheManager.del(key);
      }
    });
  }

  public async create(body: RegisterSavingDto, userId): Promise<Savings> {
    try {
      const user: User = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const todayDateString = new Date(new Date().toISOString().slice(0, 10));
      const existingSaving = await this.repository.findBy({
        user: { id: userId },
        date: Raw((alias) => `${alias} <= :date`, {
          date: todayDateString,
        }),
      });
      if (existingSaving.length) {
        throw new HttpException('Saving already made', HttpStatus.BAD_REQUEST);
      }
      const saving: Savings = new Savings();
      saving.user = user;
      saving.amount = body.amount;
      saving.description = body.description;
      saving.date = todayDateString;
      const newSaving = this.repository.save(saving);
      await this.clearCache();
      return newSaving;
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
  }

  public async getAll(pageOptionsDto: PageOptionsDto, userId: string) {
    try {
      const queryBuilder = this.repository.createQueryBuilder('savings');
      queryBuilder
        .where({ user: Raw((alias) => `${alias} = :userId`, { userId }) })
        .innerJoinAndSelect('savings.user', 'user')
        .orderBy('savings.date', pageOptionsDto.order)
        .skip(pageOptionsDto.skip)
        .take(pageOptionsDto.take);
      const itemCount = await queryBuilder.getCount();
      const { entities } = await queryBuilder.getRawAndEntities();
      const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
      const result = new PageDto(entities, pageMetaDto);
      return result;
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
  }

  public async getReport(body: GetReportDto, userId: string) {
    try {
      const fromDate = new Date(body.startDate);
      const toDate = new Date(body.endDate);
      const queryBuilder = this.repository.createQueryBuilder('savings');
      queryBuilder
        .where({ user: Raw((alias) => `${alias} = :userId`, { userId }) })
        .innerJoinAndSelect('savings.user', 'user')
        .where('savings.date >= :fromDate', { fromDate })
        .andWhere('savings.date <= :toDate', { toDate })
        .orderBy('savings.date', 'ASC');
      const { entities } = await queryBuilder.getRawAndEntities();
      const report = await generateReport(
        'SavingsReport',
        [
          {
            header: 'Date',
            key: 'date',
          },
          {
            header: 'Amount',
            key: 'amount',
          },
          {
            header: 'Description',
            key: 'description',
          },
        ],
        entities,
      );
      return report;
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
  }
}
