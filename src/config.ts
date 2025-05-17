export interface SqueezeBoxServerPorts {
  http: number;
  cli: number;
}

export interface SqueezeBoxPlatformServerConfig {
  host: string;
  ports: SqueezeBoxServerPorts;
}

export interface SqueezeBoxPlatformConfig {
  accessories: SqueezeBoxPlatformServerConfig[];
}
