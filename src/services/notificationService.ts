import Notification from '../models/Notification';
import { IClient } from '../models/Client';
import mongoose from 'mongoose';

// ─── Create in-app notification ───────────────────────────────────
export const createNotification = async (data: {
  userId?:   string;
  clientId?: string;
  title:     string;
  message:   string;
  type:      string;
  severity?: string;
  link?:     string;
}) => {
  return Notification.create(data);
};

// ─── Broadcast to all admin/operator users ────────────────────────
export const broadcastNotification = async (data: {
  title:     string;
  message:   string;
  type:      string;
  severity?: string;
  link?:     string;
}) => {
  return Notification.create({ ...data, userId: undefined });
};

// ─── Suspension notice ────────────────────────────────────────────
export const sendSuspensionNotice = async (client: IClient) => {
  // 1. In-app notification for admins
  await broadcastNotification({
    title:    `Cliente suspendido: ${client.name}`,
    message:  `El cliente ${client.name} (${client.billingId}) fue suspendido por mora.`,
    type:     'client_suspended',
    severity: 'warning',
    link:     '/clients',
  });

  // 2. WhatsApp / Email — plug in your provider here
  if (client.phone) {
    await sendWhatsApp(client.phone, buildSuspensionMessage(client));
  }
  if (client.email) {
    await sendEmail(client.email, 'Aviso de suspensión de servicio', buildSuspensionMessage(client));
  }
};

// ─── Payment reminder ─────────────────────────────────────────────
export const sendPaymentReminder = async (client: IClient) => {
  if (client.phone) {
    await sendWhatsApp(client.phone, buildPaymentReminderMessage(client));
  }
  if (client.email) {
    await sendEmail(client.email, 'Recordatorio de pago', buildPaymentReminderMessage(client));
  }
};

// ─── Message builders ─────────────────────────────────────────────
const buildSuspensionMessage = (client: IClient) =>
  `Estimado/a ${client.name}, le informamos que su servicio de internet ha sido suspendido por falta de pago. Para reactivarlo, realice su pago y contáctenos. — Nexory`;

const buildPaymentReminderMessage = (client: IClient) =>
  `Hola ${client.name}, le recordamos que su factura de internet vence próximamente. Realice su pago a tiempo para evitar la suspensión del servicio. — Nexory`;

// ─── WhatsApp stub (plug in Twilio/Meta API) ─────────────────────
const sendWhatsApp = async (phone: string, message: string): Promise<void> => {
  const WHATSAPP_TOKEN   = process.env.WHATSAPP_TOKEN;
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log(`[WhatsApp stub] → ${phone}: ${message.slice(0, 60)}...`);
    return;
  }

  // Meta Cloud API
  try {
    const axios = (await import('axios')).default;
    await axios.post(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to:   phone.replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
  } catch (err) {
    console.error('[WhatsApp] Error:', err);
  }
};

// ─── Email stub (plug in Nodemailer / SendGrid) ───────────────────
const sendEmail = async (to: string, subject: string, body: string): Promise<void> => {
  const SMTP_HOST = process.env.SMTP_HOST;

  if (!SMTP_HOST) {
    console.log(`[Email stub] → ${to} | ${subject}`);
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from:    process.env.SMTP_FROM || 'noreply@nexory.com',
      to,
      subject,
      text: body,
    });
  } catch (err) {
    console.error('[Email] Error:', err);
  }
};
