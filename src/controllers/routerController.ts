import { Response } from 'express';
import { mockData } from '../data/mockData';
import { ApiResponse } from '../types';
import { AuthRequest } from '../middleware/auth';

export const getRouters = async (
  req: AuthRequest,
  res: Response<ApiResponse<any[]>>
): Promise<void> => {
  try {
    const { status, location } = req.query;
    let routers = mockData.getRouters();
    if (status && status !== 'all') {
      routers = routers.filter((r) => r.status === status);
    }
    if (location && typeof location === 'string') {
      routers = routers.filter((r) => r.location.toLowerCase().includes(location.toLowerCase()));
    }
    res.json({ success: true, data: routers });
  } catch (error: any) {
    console.error('Get routers error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getRouterById = async (
  req: AuthRequest,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const router = mockData.getRouters().find((r) => r.id === id);
    if (!router) {
      res.status(404).json({ success: false, error: 'Router not found' });
      return;
    }
    res.json({ success: true, data: router });
  } catch (error: any) {
    console.error('Get router error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const toggleRouterStatus = async (
  req: AuthRequest,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['online', 'offline', 'maintenance'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: online, offline, or maintenance',
      });
      return;
    }
    const routers = mockData.getRouters();
    const r = routers.find((x) => x.id === id);
    if (!r) {
      res.status(404).json({ success: false, error: 'Router not found' });
      return;
    }
    r.status = status as any;
    r.lastSeen = new Date().toISOString();
    mockData.setRouters(routers);
    res.json({ success: true, data: r });
  } catch (error: any) {
    console.error('Toggle router status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
