import { Response } from 'express';
import { mockBillingData } from '../data/mockData';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/auth';

export const getBillingData = async (
  req: AuthRequest,
  res: Response<ApiResponse<any[]>>
): Promise<void> => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '12'), 24);
    res.json({ success: true, data: mockBillingData.slice(0, limit) });
  } catch (error: any) {
    console.error('Get billing data error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
