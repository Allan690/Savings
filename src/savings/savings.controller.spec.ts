import { User } from '@/users/users.entity';
import { CACHE_MANAGER } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavingsController } from './savings.controller';
import { Savings } from './savings.entity';
import { SavingsService } from './savings.service';
describe('SavingsController', () => {
  let savingsController: SavingsController;
  type MockType<T> = {
    [P in keyof T]?: jest.Mock<Record<string, unknown>>;
  };

  const SavingsrepositoryMockFactory: () => MockType<Repository<Savings>> =
    jest.fn(() => ({
      findBy: jest.fn((entity) => entity),
      save: jest.fn((entity) => entity),
      createQueryBuilder: jest.fn(),
    }));

  const UserrepositoryMockFactory: () => MockType<Repository<User>> = jest.fn(
    () => ({
      findOneBy: jest.fn((entity) => entity),
    }),
  );

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

  let savingsRepo: MockType<Repository<Savings>>;

  beforeAll(async () => {
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
      controllers: [SavingsController],
    }).compile();
    savingsController = module.get<SavingsController>(SavingsController);
    savingsRepo = module.get(getRepositoryToken(Savings));
  });

  describe('create', () => {
    it('should create a saving', async () => {
      const saving = await savingsController.registerSaving(
        {
          amount: 500,
          description: 'testing',
        },
        { user: { id: '111' } },
      );
      expect(saving).toEqual({
        amount: 500,
        description: 'testing',
        date: expect.any(Date),
        user: {
          id: '111',
        },
      });
      expect(savingsRepo.save).toHaveBeenCalledWith({
        amount: 500,
        description: 'testing',
        date: expect.any(Date),
        user: {
          id: '111',
        },
      });
    });
  });

  describe('getSavings', () => {
    beforeEach(() => {
      jest
        .spyOn(savingsRepo, 'createQueryBuilder')
        .mockImplementation(() => createQueryBuilder);
    });
    it('should get all savings', async () => {
      const pageOptions = {
        page: 1,
        skip: 0,
        take: 10,
      };
      const savings = await savingsController.getSavings(pageOptions, {
        user: { id: '1' },
      });
      expect(savings).toHaveProperty('data');
      expect(savings).toHaveProperty('meta');
      expect(savings.data).toEqual(savingsTest);
      expect(savings.meta).toEqual({
        hasNextPage: false,
        hasPreviousPage: false,
        itemCount: 2,
        page: 1,
        pageCount: 1,
        take: 10,
      });
    });
  });
});
