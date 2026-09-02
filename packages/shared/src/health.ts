export type DatabaseHealthStatus = "connected" | "disconnected" | "unconfigured";

export interface DatabaseHealthInfo {
  status: DatabaseHealthStatus;
  latencyMs?: number;
  error?: string;
}

export interface HealthCheckResponse {
  ok: boolean;
  service: string;
  timestamp: string;
  version: string;
  database?: DatabaseHealthInfo;
}

export const ASTRALYN_SERVICE_NAME = "astralyn-worker";
