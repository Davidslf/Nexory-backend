import nodemailer from 'nodemailer';

// ─── Transporter ──────────────────────────────────────────────────────────────
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user ?? 'noreply@nexory.com';

  if (!host || !user || !pass) return null;

  return { transporter: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }), from };
};

// ─── Brand colors ─────────────────────────────────────────────────────────────
// Primary: #0ea5e9 (sky-500) / dark: #0284c7 — matches NEXORY UI
const BRAND = {
  primary:     '#0ea5e9',
  primaryDark: '#0284c7',
  primaryDeep: '#0369a1',
  accent:      '#38bdf8',
  bg:          '#f0f9ff',
  bgCard:      '#ffffff',
  bgFooter:    '#f8fafc',
  textMain:    '#0f172a',
  textMuted:   '#64748b',
  border:      '#e2e8f0',
  success:     '#22c55e',
  warning:     '#f59e0b',
  danger:      '#ef4444',
};

const LOGO_URL = 'https://raw.githubusercontent.com/Davidslf/Montiara/refs/heads/main/NEXORY-CIRULO.jpg';

// ─── Base HTML layout ─────────────────────────────────────────────────────────
const layout = (title: string, body: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#e8f4fd;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f4fd;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(14,165,233,0.12),0 1px 4px rgba(0,0,0,0.06);">

        <!-- ── Header ── -->
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryDeep} 100%);padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <!-- Logo -->
                <td style="padding:24px 32px 24px 28px;vertical-align:middle;width:72px;">
                  <img src="${LOGO_URL}" alt="NEXORY"
                    width="60" height="60"
                    style="border-radius:50%;border:3px solid rgba(255,255,255,0.3);display:block;object-fit:cover;"/>
                </td>
                <!-- Brand name -->
                <td style="padding:24px 32px 24px 0;vertical-align:middle;">
                  <p style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;line-height:1;">NEXORY</p>
                  <p style="margin:4px 0 0;color:rgba(255,255,255,0.65);font-size:11px;letter-spacing:0.5px;text-transform:uppercase;font-weight:500;">Sistema de gestión ISP</p>
                </td>
                <!-- Title badge -->
                <td style="padding:24px 28px 24px 0;vertical-align:middle;text-align:right;">
                  <span style="display:inline-block;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.25);border-radius:20px;padding:5px 14px;color:#ffffff;font-size:11px;font-weight:600;letter-spacing:0.3px;">
                    ${title}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Accent bar ── -->
        <tr>
          <td style="background:linear-gradient(90deg,${BRAND.accent},${BRAND.primary},${BRAND.primaryDark});height:3px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:36px 36px 28px;">
            ${body}
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="${LOGO_URL}" alt="" width="24" height="24"
                    style="border-radius:50%;display:inline-block;vertical-align:middle;margin-right:8px;opacity:0.7;"/>
                  <span style="color:#94a3b8;font-size:11px;vertical-align:middle;">NEXORY &mdash; Sistema de gestión de internet</span>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <span style="color:#cbd5e1;font-size:10px;">No respondas este correo</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

      <!-- Sub-footer -->
      <p style="margin:16px 0 0;color:#94a3b8;font-size:10px;text-align:center;">
        Este mensaje fue generado automáticamente &bull; &copy; ${new Date().getFullYear()} NEXORY
      </p>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Templates ────────────────────────────────────────────────────────────────

export const otpTemplate = (name: string, code: string, minutes = 5) => ({
  subject: `🔐 Tu código de verificación NEXORY: ${code}`,
  html: layout('Verificación de acceso', `
    <h2 style="margin:0 0 6px;color:${BRAND.textMain};font-size:22px;font-weight:700;">Hola ${name.split(' ')[0]} 👋</h2>
    <p style="margin:0 0 28px;color:${BRAND.textMuted};font-size:14px;line-height:1.6;">
      Recibiste este correo porque iniciaste sesión en NEXORY.<br/>
      Usa el siguiente código para completar la verificación.
    </p>

    <!-- Código OTP -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr><td align="center">
        <div style="display:inline-block;background:linear-gradient(135deg,${BRAND.bg},#e0f2fe);border:2px solid ${BRAND.accent};border-radius:16px;padding:28px 56px;text-align:center;">
          <p style="margin:0 0 8px;color:${BRAND.primary};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Código de acceso</p>
          <p style="margin:0;color:${BRAND.primaryDeep};font-size:48px;font-weight:900;letter-spacing:10px;font-family:'Courier New',monospace;line-height:1;">${code}</p>
          <p style="margin:10px 0 0;color:${BRAND.textMuted};font-size:12px;">Válido por <strong>${minutes} minutos</strong></p>
        </div>
      </td></tr>
    </table>

    <!-- Alerta de seguridad -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
          <p style="margin:0;color:#92400e;font-size:12px;line-height:1.5;">
            🔒 <strong>Nunca compartas este código.</strong> NEXORY jamás te lo pedirá por teléfono o WhatsApp.
            Si no fuiste tú, ignora este correo.
          </p>
        </td>
      </tr>
    </table>
  `),
});

export const loginNotificationTemplate = (name: string, device: string, location: string, date: string, time: string) => ({
  subject: `🔔 Nuevo inicio de sesión detectado — NEXORY`,
  html: layout('Alerta de seguridad', `
    <h2 style="margin:0 0 6px;color:${BRAND.textMain};font-size:22px;font-weight:700;">Hola ${name.split(' ')[0]},</h2>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;line-height:1.6;">
      Detectamos un nuevo inicio de sesión en tu cuenta de NEXORY. Aquí están los detalles:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};margin-bottom:24px;">
      ${[
        ['📱', 'Dispositivo', device],
        ['📍', 'Ubicación',  location],
        ['📅', 'Fecha',      date],
        ['🕐', 'Hora',       time],
      ].map(([icon, label, val], i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding:13px 18px;color:${BRAND.textMuted};font-size:13px;border-bottom:1px solid ${BRAND.border};width:36%;white-space:nowrap;">
            ${icon}&nbsp; ${label}
          </td>
          <td style="padding:13px 18px;color:${BRAND.textMain};font-size:13px;font-weight:600;border-bottom:1px solid ${BRAND.border};">
            ${val}
          </td>
        </tr>
      `).join('')}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:12px;">
          <p style="margin:0;color:#166534;font-size:12px;line-height:1.5;">
            ✅ <strong>Si fuiste tú</strong>, no hay nada que hacer. Tu sesión está activa y segura.
          </p>
        </td>
      </tr>
    </table>
    <br/>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;">
          <p style="margin:0;color:#991b1b;font-size:12px;line-height:1.5;">
            ⚠️ <strong>Si NO reconoces este acceso</strong>, contacta al administrador del sistema inmediatamente.
          </p>
        </td>
      </tr>
    </table>
  `),
});

export const communicationTemplate = (
  clientName: string,
  title: string,
  body: string,
  companyName = 'NEXORY',
) => ({
  subject: `📢 ${title} — ${companyName}`,
  html: layout(title, `
    <h2 style="margin:0 0 6px;color:${BRAND.textMain};font-size:22px;font-weight:700;">Hola ${clientName.split(' ')[0]} 👋</h2>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;">Tienes un nuevo mensaje de tu proveedor de internet <strong>${companyName}</strong>:</p>

    <!-- Mensaje principal -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:4px;background:linear-gradient(180deg,${BRAND.primary},${BRAND.accent});border-radius:4px 0 0 4px;">&nbsp;</td>
        <td style="background:${BRAND.bg};border:1px solid #bae6fd;border-left:none;border-radius:0 12px 12px 0;padding:20px 24px;">
          <h3 style="margin:0 0 10px;color:${BRAND.primaryDeep};font-size:16px;font-weight:700;">${title}</h3>
          <p style="margin:0;color:${BRAND.textMain};font-size:14px;line-height:1.75;white-space:pre-line;">${body}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:${BRAND.textMuted};font-size:12px;line-height:1.6;">
      Si tienes alguna pregunta, comunícate con nosotros a través de WhatsApp o llama a tu punto de atención más cercano.
    </p>
  `),
});

export const paymentReminderTemplate = (
  clientName: string,
  amount: number,
  dueDay: number,
  plan: string,
) => ({
  subject: `💳 Recordatorio de pago — ${plan}`,
  html: layout('Recordatorio de pago', `
    <h2 style="margin:0 0 6px;color:${BRAND.textMain};font-size:22px;font-weight:700;">Hola ${clientName.split(' ')[0]},</h2>
    <p style="margin:0 0 28px;color:${BRAND.textMuted};font-size:14px;line-height:1.6;">
      Te recordamos que tienes un pago pendiente de tu servicio de internet.
    </p>

    <!-- Monto destacado -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td align="center">
        <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fde68a;border-radius:16px;padding:28px 40px;text-align:center;display:inline-block;width:100%;box-sizing:border-box;">
          <p style="margin:0 0 6px;color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">💳 Valor a pagar</p>
          <p style="margin:0;color:#78350f;font-size:44px;font-weight:900;line-height:1;">$${amount.toLocaleString('es-CO')}</p>
          <p style="margin:10px 0 0;color:#92400e;font-size:13px;">
            Plan: <strong>${plan}</strong> &bull; Vence el día <strong>${dueDay}</strong> de cada mes
          </p>
        </div>
      </td></tr>
    </table>

    <!-- Alerta -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;">
          <p style="margin:0;color:#991b1b;font-size:12px;line-height:1.5;">
            ⚠️ Realiza tu pago a tiempo para evitar la <strong>suspensión del servicio</strong>.
          </p>
        </td>
      </tr>
    </table>
  `),
});

export const suspensionTemplate = (clientName: string, plan: string, dueDay: number) => ({
  subject: '⚠️ Servicio suspendido — NEXORY ISP',
  html: layout('Servicio suspendido', `
    <h2 style="margin:0 0 6px;color:${BRAND.textMain};font-size:22px;font-weight:700;">Hola ${clientName.split(' ')[0]},</h2>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;line-height:1.6;">
      Lamentamos informarte que tu servicio de internet ha sido <strong style="color:#dc2626;">suspendido temporalmente</strong> por falta de pago.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:4px;background:#dc2626;border-radius:4px 0 0 4px;">&nbsp;</td>
        <td style="background:#fef2f2;border:1px solid #fecaca;border-left:none;border-radius:0 12px 12px 0;padding:20px 24px;">
          <h3 style="margin:0 0 10px;color:#dc2626;font-size:15px;font-weight:700;">⚠️ Servicio suspendido</h3>
          <p style="margin:0;color:${BRAND.textMain};font-size:14px;line-height:1.75;">
            Plan: <strong>${plan}</strong><br/>
            Día de cobro: <strong>día ${dueDay} de cada mes</strong><br/><br/>
            Para reactivar tu servicio, ponte al día con tu pago y comunícate con nosotros.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:${BRAND.textMuted};font-size:12px;line-height:1.6;">
      Una vez confirmado tu pago, tu servicio será reactivado de inmediato. ¡Gracias por tu comprensión!
    </p>
  `),
});

export const reactivationTemplate = (clientName: string, plan: string) => ({
  subject: '✅ Servicio reactivado — NEXORY ISP',
  html: layout('Servicio reactivado', `
    <h2 style="margin:0 0 6px;color:${BRAND.textMain};font-size:22px;font-weight:700;">¡Hola ${clientName.split(' ')[0]}! 🎉</h2>
    <p style="margin:0 0 24px;color:${BRAND.textMuted};font-size:14px;line-height:1.6;">
      Nos complace informarte que tu servicio de internet ha sido <strong style="color:#16a34a;">reactivado exitosamente</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:4px;background:#16a34a;border-radius:4px 0 0 4px;">&nbsp;</td>
        <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:none;border-radius:0 12px 12px 0;padding:20px 24px;">
          <h3 style="margin:0 0 10px;color:#16a34a;font-size:15px;font-weight:700;">✅ Servicio activo</h3>
          <p style="margin:0;color:${BRAND.textMain};font-size:14px;line-height:1.75;">
            Plan: <strong>${plan}</strong><br/><br/>
            Ya puedes navegar con normalidad. Si experimentas algún problema de conexión, reinicia tu router y espera 2 minutos.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:${BRAND.textMuted};font-size:12px;line-height:1.6;">
      Gracias por estar al día. ¡Te deseamos una excelente navegación! 🚀
    </p>
  `),
});

// ─── Send function ────────────────────────────────────────────────────────────
export interface EmailResult {
  success: boolean;
  to:      string;
  error?:  string;
}

export const sendEmail = async (
  to: string,
  template: { subject: string; html: string },
): Promise<EmailResult> => {
  const cfg = createTransporter();
  if (!cfg) {
    console.warn('[Email] SMTP no configurado — revisa SMTP_HOST, SMTP_USER, SMTP_PASS en .env');
    return { success: false, to, error: 'SMTP no configurado' };
  }

  try {
    await cfg.transporter.sendMail({
      from:    cfg.from,
      to,
      subject: template.subject,
      html:    template.html,
    });
    console.log(`[Email] ✓ Enviado a ${to}: ${template.subject}`);
    return { success: true, to };
  } catch (err: any) {
    console.error(`[Email] ✗ Error enviando a ${to}:`, err.message);
    return { success: false, to, error: err.message };
  }
};

export const sendBulkEmails = async (
  targets: { email: string; name: string; clientId: string; template: { subject: string; html: string } }[],
): Promise<{ clientId: string; status: 'sent' | 'failed' }[]> => {
  const results = await Promise.allSettled(
    targets.map(t => sendEmail(t.email, t.template))
  );

  return results.map((r, i) => ({
    clientId: targets[i].clientId,
    status: r.status === 'fulfilled' && r.value.success ? 'sent' : 'failed',
  }));
};
