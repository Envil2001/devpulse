import { Throttle } from '@nestjs/throttler';

export const AuthThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ default: { ttl: 60_000, limit: 5 } });

export const TelemetryThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ default: { ttl: 60_000, limit: 60 } });

export { SkipThrottle as NoThrottle } from '@nestjs/throttler';
