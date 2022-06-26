import { Test } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SavingsService } from './savings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Savings } from './savings.entity';
import { User } from '@/users/users.entity';
import { Order } from '@/common/constants';

jest.mock('@/common/excel/excel.report', () => ({
  generateReport: jest.fn().mockResolvedValue('mock/path'),
}));
import * as excelReport from '@/common/excel/excel.report';

describe('SavingsService', () => {
  type MockType<T> = {
    [P in keyof T]?: jest.Mock<Record<string, unknown>>;
  };
  const UserrepositoryMockFactory: () => MockType<Repository<User>> = jest.fn(
    () => ({
      findOneBy: jest.fn((entity) => entity),
    }),
  );
  const SavingsrepositoryMockFactory: () => MockType<Repository<Savings>> =
    jest.fn(() => ({
      findBy: jest.fn((entity) => entity),
      save: jest.fn((entity) => entity),
      createQueryBuilder: jest.fn(),
    }));

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const cacheManagerMockFactory: () => MockType<Cache> = jest.fn(() => ({
    del: jest.fn((entity) => entity),
    store: {
      keys: jest.fn(() => ['GET_SAVINGS_1']),
    },
  }));

  const savingsTest = [
    { id: '1', amount: 100, description: 'test', date: new Date() },
    { id: '2', amount: 200, description: 'test2', date: new Date() },
  ];

  const createQueryBuilder: any = {
    select: () => createQueryBuilder,
    innerJoinAndSelect: () => createQueryBuilder,
    where: () => createQueryBuilder,
    andWhere: () => createQueryBuilder,
    orderBy: () => createQueryBuilder,
    skip: () => createQueryBuilder,
    take: () => createQueryBuilder,
    getCount: jest.fn().mockReturnValue(2),
    getRawAndEntities: jest.fn().mockImplementation(() => {
      return {
        entities: savingsTest,
      };
    }),
  };

  let savingsService: SavingsService;
  let savingsRepo: MockType<Repository<Savings>>;
  let userRepo: MockType<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SavingsService,
        {
          provide: getRepositoryToken(Savings),
          useFactory: SavingsrepositoryMockFactory,
        },
        {
          provide: getRepositoryToken(User),
          useFactory: UserrepositoryMockFactory,
        },
        {
          provide: CACHE_MANAGER,
          useFactory: cacheManagerMockFactory,
        },
      ],
    }).compile();

    savingsService = module.get(SavingsService);
    savingsRepo = module.get(getRepositoryToken(Savings));
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    const savingsTest = {
      amount: 100,
      description: 'test',
    };

    beforeEach(() => {
      jest
        .spyOn(userRepo, 'findOneBy')
        .mockReturnValue({ id: '1', name: 'test' });
      jest
        .spyOn(savingsRepo, 'save')
        .mockReturnValue({ id: '1', ...savingsTest });
      jest.spyOn(savingsRepo, 'findBy').mockReturnValue({});
    });

    it('should create a saving', async () => {
      const saving = await savingsService.create(savingsTest, 1);
      expect(saving).toEqual({ id: '1', ...savingsTest });
      expect(savingsRepo.save).toHaveBeenCalledWith({
        user: { id: '1', name: 'test' },
        amount: 100,
        description: 'test',
        date: expect.any(Date),
      });
      expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw an error if user not found', async () => {
      jest.spyOn(userRepo, 'findOneBy').mockReturnValue(null);
      await expect(savingsService.create(savingsTest, 1)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getAll', () => {
    const pageOptions = {
      order: Order.ASC,
      page: 1,
      take: 10,
      skip: 0,
    };

    beforeEach(() => {
      jest
        .spyOn(savingsRepo, 'createQueryBuilder')
        .mockImplementation(() => createQueryBuilder);
    });

    it('should get all savings', async () => {
      const savings = await savingsService.getAll(pageOptions, '1');
      expect(savings.data).toEqual(savingsTest);
      expect(savingsRepo.createQueryBuilder).toHaveBeenCalled();
      expect(savingsRepo.createQueryBuilder().getCount).toReturnWith(2);
      expect(savings.meta).toBeDefined();
      expect(savings.meta.itemCount).toBe(2);
      expect(savings.meta.pageCount).toBe(1);
      expect(savingsRepo.createQueryBuilder().getRawAndEntities).toReturnWith({
        entities: savingsTest,
      });
    });

    it('should throw a 400 error if error occurs', () => {
      jest
        .spyOn(savingsRepo, 'createQueryBuilder')
        .mockImplementationOnce(() => {
          throw new Error('error');
        });
      expect(savingsService.getAll(pageOptions, '1')).rejects.toThrow('error');
    });
  });

  describe('getReport', () => {
    beforeEach(() => {
      jest
        .spyOn(savingsRepo, 'createQueryBuilder')
        .mockImplementation(() => createQueryBuilder);
    });
    it('should get a report', async () => {
      const body = {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };
      const report = await savingsService.getReport(body, '1');
      expect(report).toBe('mock/path');
      expect(excelReport.generateReport).toHaveBeenCalledWith(
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
        savingsTest,
      );
    });
  });
});
