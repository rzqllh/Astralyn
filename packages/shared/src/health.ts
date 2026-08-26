export interface HealthCheckResponse {
  ok: boolean;
  service: string;
  timestamp: string;
  version: string;
}

export const ASTRALYN_SERVICE_NAME = "astralyn-worker";
