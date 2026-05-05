import { Request, Response } from 'express';
import { networkHealth, anomalies } from '../mock/store';

export const getNetworkHealth = async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: networkHealth });
};

export const getAnomalies = async (_req: Request, res: Response): Promise<void> => {
  const active = anomalies.filter(a => !a.resolved);
  res.json({ success: true, data: active, meta: { total: anomalies.length, active: active.length } });
};
