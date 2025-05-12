export interface SqueezeBoxServerPorts {
  http: number;
  telenet: number;
}

export interface SqueezeBoxPlatformServerConfig {
  host: string;
  ports: SqueezeBoxServerPorts;
}

export interface SqueezeBoxPlatformConfig {
  accessories: SqueezeBoxPlatformServerConfig[];
}
