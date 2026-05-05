import axios from 'axios';

const WAHA_BASE_URL = process.env.WAHA_BASE_URL ?? 'http://localhost:3010';
const WAHA_API_KEY  = process.env.WAHA_API_KEY  ?? '';
const WAHA_SESSION  = process.env.WAHA_SESSION  ?? 'default';

const wahaHeaders = {
  'Content-Type': 'application/json',
  'X-Api-Key': WAHA_API_KEY,
};

// Format phone to WhatsApp chatId (e.g. 573126226684 → 573126226684@c.us)
const toChatId = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@c.us`;
};

export interface WahaSendResult {
  phone:   string;
  chatId:  string;
  success: boolean;
  error?:  string;
}

// ─── Send a text message via WAHA ─────────────────────────────────────
export const sendWhatsAppMessage = async (phone: string, text: string): Promise<WahaSendResult> => {
  const chatId = toChatId(phone);
  try {
    await axios.post(
      `${WAHA_BASE_URL}/api/sendText`,
      { chatId, text, session: WAHA_SESSION },
      { headers: wahaHeaders, timeout: 10000 }
    );
    console.log(`[WAHA] ✓ Enviado a ${chatId}`);
    return { phone, chatId, success: true };
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? err?.message ?? 'Error desconocido';
    console.error(`[WAHA] ✗ Error enviando a ${chatId}: ${msg}`);
    return { phone, chatId, success: false, error: msg };
  }
};

// ─── Send personalized messages to multiple phones ────────────────────
// Each target carries its own pre-built message text.
export const sendBulkWhatsApp = async (
  targets: { phone: string; name: string; clientId: string; message: string }[],
): Promise<{ clientId: string; status: 'sent' | 'failed' }[]> => {
  const results = await Promise.allSettled(
    targets.map(t => sendWhatsAppMessage(t.phone, t.message))
  );

  return results.map((r, i) => ({
    clientId: targets[i].clientId,
    status: r.status === 'fulfilled' && r.value.success ? 'sent' : 'failed',
  }));
};

// ─── Check WAHA session status ────────────────────────────────────────
export const getSessionStatus = async (): Promise<{ ok: boolean; status?: string; error?: string }> => {
  try {
    const res = await axios.get(
      `${WAHA_BASE_URL}/api/sessions/${WAHA_SESSION}`,
      { headers: wahaHeaders, timeout: 5000 }
    );
    return { ok: true, status: (res.data as any)?.status ?? 'UNKNOWN' };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'WAHA no disponible' };
  }
};
