import { Test, TestingModule } from '@nestjs/testing';
import { RedisClientService } from './redis.service';

describe('RedisService', () => {
  let service: RedisClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisClientService],
    }).compile();

    service = module.get<RedisClientService>(RedisClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
