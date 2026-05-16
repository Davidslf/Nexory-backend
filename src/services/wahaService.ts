import axios from 'axios';

const WAHA_BASE_URL  = process.env.WAHA_BASE_URL  ?? 'http://localhost:3010';
const WAHA_API_KEY   = process.env.WAHA_API_KEY   ?? '';
const WAHA_SESSION   = process.env.WAHA_SESSION   ?? 'default';

// ─── Test-phone redirect ───────────────────────────────────────────────────
// If WAHA_TEST_PHONES is set (comma-separated), ALL outbound messages are
// redirected to those numbers instead of the real recipient.
// Example: WAHA_TEST_PHONES=573126226684,573003198321
const TEST_PHONES: string[] = process.env.WAHA_TEST_PHONES
  ? process.env.WAHA_TEST_PHONES.split(',').map(p => p.trim()).filter(Boolean)
  : [];

const wahaHeaders = {
  'Content-Type': 'application/json',
  'X-Api-Key': WAHA_API_KEY,
};

// Format phone to WhatsApp chatId (e.g. 3126226684 → 573126226684@c.us)
const toChatId = (phone: string): string => {
  let digits = phone.replace(/\D/g, '');
  // Prepend Colombia country code if not present
  if (digits.length === 10) digits = `57${digits}`;
  return `${digits}@c.us`;
};

export interface WahaSendResult {
  phone:   string;
  chatId:  string;
  success: boolean;
  error?:  string;
}

// ─── Send a single message ─────────────────────────────────────────────────
const sendRaw = async (chatId: string, text: string): Promise<boolean> => {
  try {
    await axios.post(
      `${WAHA_BASE_URL}/api/sendText`,
      { chatId, text, session: WAHA_SESSION },
      { headers: wahaHeaders, timeout: 10000 }
    );
    return true;
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? err?.message ?? 'Error';
    console.error(`[WAHA] ✗ Error enviando a ${chatId}: ${msg}`);
    return false;
  }
};

// ─── Send a text message via WAHA ─────────────────────────────────────────
export const sendWhatsAppMessage = async (phone: string, text: string): Promise<WahaSendResult> => {
  const chatId = toChatId(phone);

  // If test-phone redirect is active, send to test phones instead
  if (TEST_PHONES.length > 0) {
    console.log(`[WAHA] 🔀 Test mode: redirigiendo ${chatId} → ${TEST_PHONES.join(', ')}`);
    const results = await Promise.all(TEST_PHONES.map(tp => sendRaw(toChatId(tp), text)));
    const success = results.some(r => r);
    if (success) console.log(`[WAHA] ✓ Enviado (test) a ${TEST_PHONES.join(', ')}`);
    return { phone, chatId, success };
  }

  // Normal send
  const ok = await sendRaw(chatId, text);
  if (ok) console.log(`[WAHA] ✓ Enviado a ${chatId}`);
  return { phone, chatId, success: ok };
};

// ─── Send personalized messages to multiple phones ────────────────────────
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

// ─── Check WAHA session status ────────────────────────────────────────────
export const getSessionStatus = async (): Promise<{ ok: boolean; status?: string; error?: string }> => {
  try {
    const res = await axios.get(
      `${WAHA_BASE_URL}/api/sessions/${WAHA_SESSION}`,
      { headers: wahaHeaders, timeout: 5000 }
    );
    const status = (res.data as any)?.status ?? 'UNKNOWN';
    const ok     = status === 'WORKING';
    return { ok, status };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'WAHA no disponible' };
  }
};
