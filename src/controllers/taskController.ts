import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { TaskStatus, Priority } from '@prisma/client';
import { logAudit, getIp } from '../services/auditService';

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, priority } = req.query;
    const tasks = await prisma.task.findMany({
      where: {
        ...(status ? { status: status.toString().toUpperCase() as TaskStatus } : {}),
        ...(priority ? { priority: priority.toString().toUpperCase() as Priority } : {}),
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo tareas' });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.create({ data: req.body });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Error creando tarea' });
  }
};

export const completeTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    const actorId = (req as any).user?.id;
    if (actorId) {
      logAudit(actorId, 'COMPLETAR_TAREA', 'Task', task.id, task.title, getIp(req));
    }
    res.json(task);
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Tarea no encontrada' }); return; }
    res.status(500).json({ error: 'Error completando tarea' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(task);
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Tarea no encontrada' }); return; }
    res.status(500).json({ error: 'Error actualizando tarea' });
  }
};
