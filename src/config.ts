export interface SqueezeBoxServerPorts {
  http: number;
  telenet: number;
}

export interface SqueezeBoxPlatformServerConfig {
  host: string;
  httpPort: number;
  telenetPort: number;
}

export interface SqueezeBoxPlatformConfig {
  accessories: SqueezeBoxPlatformServerConfig[];
}
