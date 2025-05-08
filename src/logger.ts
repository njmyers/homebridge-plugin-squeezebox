import { CharacteristicValue } from 'homebridge';
import type { SqueezeboxHomebridgePlatform } from './platform.js';

export interface Logger {
  info(message: string, ...parameters: unknown[]): void;
  success(message: string, ...parameters: unknown[]): void;
  warn(message: string, ...parameters: unknown[]): void;
  error(message: string, ...parameters: unknown[]): void;
  debug(message: string, ...parameters: unknown[]): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, ...parameters: unknown[]): void {
    console.log(message, ...parameters);
  }

  success(message: string, ...parameters: unknown[]): void {
    console.log(message, ...parameters);
  }

  warn(message: string, ...parameters: unknown[]): void {
    console.warn(message, ...parameters);
  }

  error(message: string, ...parameters: unknown[]): void {
    console.error(message, ...parameters);
  }

  debug(message: string, ...parameters: unknown[]): void {
    console.debug(message, ...parameters);
  }
}

export class ServiceLogger {
  constructor(
    private readonly platform: SqueezeboxHomebridgePlatform,
    private readonly service: string,
    private readonly name: CharacteristicValue,
  ) {}

  info(message: string, params?: Record<string, unknown>) {
    this.platform.log.info(message, {
      service: this.service,
      name: this.name,
      ...params,
    });
  }

  warn(message: string, params?: Record<string, unknown>) {
    this.platform.log.warn(message, {
      service: this.service,
      name: this.name,
      ...params,
    });
  }
  error(message: string, params?: Record<string, unknown>) {
    this.platform.log.error(message, {
      service: this.service,
      name: this.name,
      ...params,
    });
  }
  debug(message: string, params?: Record<string, unknown>) {
    this.platform.log.debug(message, {
      service: this.service,
      name: this.name,
      ...params,
    });
  }
  success(message: string, params?: Record<string, unknown>) {
    this.platform.log.debug(message, {
      service: this.service,
      name: this.name,
      ...params,
    });
  }
}
