import { Request, Response } from 'express';
import { notifications } from '../mock/store';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = notifications.filter(n => n.userId === null || n.userId === req.user?.userId);
  const unreadCount = result.filter(n => !n.read).length;
  res.json({ success: true, data: result, meta: { unreadCount } });
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  const notif = notifications.find(n => n._id === req.params.id);
  if (!notif) { res.status(404).json({ success: false, error: 'Notificación no encontrada' }); return; }
  notif.read = true;
  res.json({ success: true });
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  notifications.forEach(n => { n.read = true; });
  res.json({ success: true });
};
