import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../config/database';
import { sendWhatsAppMessage } from '../services/wahaService';
import { logAudit, getIp } from '../services/auditService';

const JWT_SECRET = process.env.JWT_SECRET || 'nexory_secret';
const OTP_EXPIRY_MINUTES = 5;

// ── Paso 1: verificar usuario/contraseña → enviar OTP ──────────
export const loginStep1 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Generar código OTP de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidar OTPs anteriores del usuario
    await prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await prisma.otpCode.create({
      data: { userId: user.id, code, expiresAt },
    });

    const isDev = process.env.NODE_ENV === 'development';

    // Enviar código por WhatsApp si tiene número registrado
    if (user.phone) {
      try {
        await sendWhatsAppMessage(
          user.phone,
          `🔐 *NEXORY — Código de verificación*\n\nTu código es: *${code}*\n\nVálido por ${OTP_EXPIRY_MINUTES} minutos. No lo compartas con nadie.`,
        );
      } catch {
        // WhatsApp falló — no es bloqueante
      }
      res.json({
        message: 'Código enviado por WhatsApp',
        userId: user.id,
        phoneMasked: user.phone.slice(0, 3) + '***' + user.phone.slice(-4),
        ...(isDev && { devCode: code }),
      });
    } else {
      res.json({
        message: 'Usuario sin número de WhatsApp',
        userId: user.id,
        ...(isDev && { devCode: code }),
      });
    }
  } catch (err) {
    console.error('[Auth] loginStep1:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── Paso 2: verificar OTP → devolver JWT ──────────────────────
export const loginStep2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      res.status(400).json({ error: 'userId y código requeridos' });
      return;
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        userId,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      res.status(401).json({ error: 'Código inválido o expirado' });
      return;
    }

    // Marcar OTP como usado
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' },
    );

    // ── Audit log de inicio de sesión ─────────────────────────────
    logAudit(user.id, 'LOGIN', 'User', user.id, `Inicio de sesión: ${user.username}`, getIp(req));

    // ── Notificación de login para todos los usuarios con teléfono ─
    if (user.phone) {
      sendLoginNotification(req, user.name, user.phone).catch(() => {/* silencioso */});
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
      },
    });
  } catch (err) {
    console.error('[Auth] loginStep2:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── Helper: notificación de inicio de sesión ───────────────────
async function sendLoginNotification(req: Request, name: string, phone: string) {
  // Dispositivo desde User-Agent
  const ua = req.headers['user-agent'] ?? '';
  let device = 'Dispositivo desconocido';
  if (/iPhone/.test(ua))              device = 'iPhone';
  else if (/iPad/.test(ua))           device = 'iPad';
  else if (/Android/.test(ua))        device = 'Android';
  else if (/Macintosh|Mac OS X/.test(ua)) device = 'MacBook / Mac';
  else if (/Windows/.test(ua))        device = 'PC Windows';
  else if (/Linux/.test(ua))          device = 'Linux';

  // IP del cliente
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '';

  // Geolocalización via ipapi.co (gratis, sin key)
  let location = 'Ubicación no disponible';
  try {
    const geoIp = ip === '::1' || ip === '127.0.0.1' ? '' : ip;
    const url = geoIp
      ? `https://ipapi.co/${geoIp}/json/`
      : 'https://ipapi.co/json/';
    const geo = await axios.get(url, { timeout: 4000 });
    const { city, region } = geo.data as { city?: string; region?: string };
    if (city && region) location = `${city}, ${region}`;
    else if (city)      location = city;
    else if (region)    location = region;
  } catch { /* si falla, queda el mensaje por defecto */ }

  // Fecha y hora Colombia (UTC-5)
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const firstName = name.split(' ')[0];
  const msg =
    `🔔 *NEXORY — Inicio de sesión detectado*\n\n` +
    `Hola ${firstName},\n\n` +
    `Te informamos sobre un nuevo inicio de sesión en tu cuenta:\n\n` +
    `📱 *Dispositivo:* ${device}\n` +
    `📍 *Ubicación:* ${location}\n` +
    `📅 *Fecha:* ${dateStr}\n` +
    `🕐 *Hora:* ${timeStr}\n\n` +
    `Si fuiste tú, no es necesario hacer nada.\n` +
    `Si no reconoces este acceso, contacta al administrador inmediatamente.`;

  await sendWhatsAppMessage(phone, msg);
  console.log(`[Auth] 🔔 Notificación de login enviada a ${firstName} (${phone})`);
}

// ── Obtener perfil del usuario autenticado ─────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, name: true, role: true },
    });
    if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return; }
    res.json({ ...user, role: user.role.toLowerCase() });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
