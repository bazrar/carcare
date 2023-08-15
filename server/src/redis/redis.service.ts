import { Injectable } from '@nestjs/common';
import { InjectRedis, DEFAULT_REDIS_NAMESPACE } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class RedisClientService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async setValue(key: string, value: string | number): Promise<boolean> {
    const result = await this.redis.set(key, value);
    return result == 'OK';
  }
  async setex(key: string, value: string | number, time: number) {
    const result = await this.redis.set(key, value, 'EX', time);
    return result === 'OK';
  }
  async lpush(key: string, value: string) {
    const result = await this.redis.lpush(key, value);
    console.log(
      '🚀 ~ file: redis.service.ts ~ line 25 ~ RedisClientService ~ lpush ~ result',
      result,
    );
    return result;
  }

  async expire(key: string, time = 60) {
    // timeout after 60
    return this.redis.expire(key, time);
  }
  async getValue(key: string): Promise<string> {
    const result = await this.redis.get(key);
    return result;
  }
  async lrange(key: string, start: number, end: number) {
    return this.redis.lrange(key, start, end);
  }

  async exists(key: string): Promise<boolean> {
    const exists = await this.redis.exists(key);
    return exists !== 0;
  }
  async del(key: string) {
    return this.redis.del(key);
  }
  // async sAdd(key, value): Promise<boolean> {
  //   const result = await this.redis.sadd(key, value);
  //   return [1, 0].includes(result);
  // }

  // async srem(key, member) {
  //   return this.redis.srem(key, member);
  // }
  // async sMember(key: string) {
  //   return this.redis.smembers(key);
  // }
}
