import { decrypt, encrypt } from './cryptoService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PppoeClientData {
  name:     string;
  password: string;  // plaintext — will be encrypted when persisted to DB
  profile?: string;
}

export interface PppoeSecret {
  id:       string;
  name:     string;
  profile:  string;
  disabled: boolean;
  comment?: string;
}

export interface ActiveSession {
  id:       string;
  name:     string;
  address:  string;
  uptime:   string;
  bytesIn:  string;
  bytesOut: string;
  service:  string;
}

export interface RouterDiagnostics {
  online:        boolean;
  activeSession: boolean;
  uptime?:       string;
  address?:      string;
  bytesIn?:      string;
  bytesOut?:     string;
}

export interface RouterMetrics {
  cpuLoad:       string;
  freeMemory:    string;
  totalMemory:   string;
  uptime:        string;
  routerOsVersion: string;
}

// ─── RouterOS 7.x compatibility: handle !empty reply ─────────────────────────
// RouterOS 7+ returns !empty when a query has no results. node-routeros throws
// RosException UNKNOWNREPLY in that case. We wrap write() to return [] instead.
const safeWrite = async (
  conn: Awaited<ReturnType<typeof getConnection>>,
  cmd: string,
  params: string[] = [],
): Promise<Record<string, unknown>[]> => {
  try {
    return await conn.write(cmd, params) as Record<string, unknown>[];
  } catch (err: any) {
    if (err?.errno === 'UNKNOWNREPLY' || String(err?.message).includes('UNKNOWNREPLY')) {
      return [];
    }
    throw err;
  }
};

// ─── Internal: build a RouterOSAPI connection from env vars ───────────────────

const getConnection = async () => {
  const mod = await import('node-routeros').catch(() => null);
  if (!mod) throw new Error('node-routeros no está disponible');

  const host = process.env.MIKROTIK_HOST;
  const user = process.env.MIKROTIK_USER;
  const pass = process.env.MIKROTIK_PASS;

  if (!host || !user || !pass) {
    throw new Error('Faltan variables de entorno: MIKROTIK_HOST, MIKROTIK_USER, MIKROTIK_PASS');
  }

  return new mod.RouterOSAPI({
    host,
    user,
    password: pass,
    port:    Number(process.env.MIKROTIK_PORT || 8728),
    timeout: 10,
  });
};

// ─── Test connection ──────────────────────────────────────────────────────────

export const testConnection = async (): Promise<{ success: boolean; version?: string; error?: string }> => {
  let conn: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    conn = await getConnection();
    await conn.connect();
    const res = await conn.write('/system/resource/print');
    await conn.close();
    return { success: true, version: res[0]?.['version'] as string };
  } catch (err: unknown) {
    await conn?.close().catch(() => {});
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── Create PPPoE client ──────────────────────────────────────────────────────

export const createPppoeClient = async (
  data: PppoeClientData,
): Promise<{ success: boolean; encryptedPassword?: string; error?: string }> => {
  let conn: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    conn = await getConnection();
    await conn.connect();

    // Check duplicate
    const existing = await safeWrite(conn, '/ppp/secret/print', [`?name=${data.name}`]);
    if (existing.length) {
      await conn.close();
      return { success: false, error: `El usuario PPPoE '${data.name}' ya existe en MikroTik` };
    }

    await conn.write('/ppp/secret/add', [
      `=name=${data.name}`,
      `=password=${data.password}`,
      `=service=pppoe`,
      `=profile=${data.profile ?? process.env.MIKROTIK_DEFAULT_PROFILE ?? 'perfil-clientes'}`,
    ]);

    await conn.close();
    return { success: true, encryptedPassword: encrypt(data.password) };
  } catch (err: unknown) {
    await conn?.close().catch(() => {});
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── Disable PPPoE client (corte) ────────────────────────────────────────────

export const disableClient = async (
  pppoeUsername: string,
): Promise<{ success: boolean; error?: string }> => {
  let conn: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    conn = await getConnection();
    await conn.connect();

    const secrets = await safeWrite(conn, '/ppp/secret/print', [`?name=${pppoeUsername}`]);
    if (!secrets.length) throw new Error(`PPPoE secret '${pppoeUsername}' no encontrado`);

    await conn.write('/ppp/secret/set', [
      `=.id=${secrets[0]['.id']}`,
      '=disabled=yes',
    ]);

    // Terminate active session if exists
    const sessions = await safeWrite(conn, '/ppp/active/print', [`?name=${pppoeUsername}`]);
    for (const s of sessions) {
      await conn.write('/ppp/active/remove', [`=.id=${s['.id']}`]);
    }

    await conn.close();
    return { success: true };
  } catch (err: unknown) {
    await conn?.close().catch(() => {});
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── Enable PPPoE client (restaurar) ─────────────────────────────────────────

export const enableClient = async (
  pppoeUsername: string,
): Promise<{ success: boolean; error?: string }> => {
  let conn: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    conn = await getConnection();
    await conn.connect();

    const secrets = await safeWrite(conn, '/ppp/secret/print', [`?name=${pppoeUsername}`]);
    if (!secrets.length) throw new Error(`PPPoE secret '${pppoeUsername}' no encontrado`);

    await conn.write('/ppp/secret/set', [
      `=.id=${secrets[0]['.id']}`,
      '=disabled=no',
    ]);

    await conn.close();
    return { success: true };
  } catch (err: unknown) {
    await conn?.close().catch(() => {});
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── List PPPoE secrets ───────────────────────────────────────────────────────

export const listPppoeClients = async (): Promise<{ success: boolean; data?: PppoeSecret[]; error?: string }> => {
  let conn: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    conn = await getConnection();
    await conn.connect();

    const raw = await safeWrite(conn, '/ppp/secret/print');
    await conn.close();

    const data: PppoeSecret[] = raw.map((r: Record<string, unknown>) => ({
      id:       String(r['.id'] ?? ''),
      name:     String(r['name'] ?? ''),
      profile:  String(r['profile'] ?? ''),
      disabled: r['disabled'] === 'true' || r['disabled'] === true,
      comment:  r['comment'] ? String(r['comment']) : undefined,
    }));

    return { success: true, data };
  } catch (err: unknown) {
    await conn?.close().catch(() => {});
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── List active PPPoE sessions ───────────────────────────────────────────────

export const listActiveSessions = async (): Promise<{ success: boolean; data?: ActiveSession[]; error?: string }> => {
  let conn: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    conn = await getConnection();
    await conn.connect();

    const raw = await safeWrite(conn, '/ppp/active/print');
    await conn.close();

    const data: ActiveSession[] = raw.map((r: Record<string, unknown>) => ({
      id:       String(r['.id'] ?? ''),
      name:     String(r['name'] ?? ''),
      address:  String(r['address'] ?? ''),
      uptime:   String(r['uptime'] ?? ''),
      bytesIn:  String(r['bytes-in'] ?? '0'),
      bytesOut: String(r['bytes-out'] ?? '0'),
      service:  String(r['service'] ?? 'pppoe'),
    }));

    return { success: true, data };
  } catch (err: unknown) {
    await conn?.close().catch(() => {});
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── Diagnose a specific client ───────────────────────────────────────────────

export const diagnoseClient = async (pppoeUsername: string): Promise<RouterDiagnostics> => {
  let conn: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    conn = await getConnection();
    await conn.connect();

    const sessions = await safeWrite(conn, '/ppp/active/print', [`?name=${pppoeUsername}`]);
    await conn.close();

    if (!sessions.length) return { online: false, activeSession: false };

    const s = sessions[0] as Record<string, unknown>;
    return {
      online:        true,
      activeSession: true,
      uptime:        String(s['uptime'] ?? ''),
      address:       String(s['address'] ?? ''),
      bytesIn:       String(s['bytes-in'] ?? '0'),
      bytesOut:      String(s['bytes-out'] ?? '0'),
    };
  } catch {
    await conn?.close().catch(() => {});
    return { online: false, activeSession: false };
  }
};

// ─── Full client diagnostics (PPPoE secret + active session) ─────────────────

export interface FullDiagnostics {
  // Secret / account
  secretExists:   boolean;
  secretDisabled: boolean;
  secretProfile:  string;
  // Session
  online:         boolean;
  uptime?:        string;
  assignedIp?:    string;
  bytesIn?:       string;
  bytesOut?:      string;
  calledStationId?: string;
  // Checks
  checks: { label: string; ok: boolean; detail: string }[];
}

export const fullDiagnoseClient = async (pppoeUsername: string): Promise<{ success: boolean; data?: FullDiagnostics; error?: string }> => {
  let conn: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    conn = await getConnection();
    await conn.connect();

    // 1. Check PPPoE secret
    const secrets  = await safeWrite(conn, '/ppp/secret/print', [`?name=${pppoeUsername}`]);
    const sessions = await safeWrite(conn, '/ppp/active/print', [`?name=${pppoeUsername}`]);

    await conn.close();

    const secretExists   = secrets.length > 0;
    const secret         = secrets[0] as Record<string, unknown> | undefined;
    const secretDisabled = secret ? (secret['disabled'] === 'true' || secret['disabled'] === true) : false;
    const secretProfile  = secret ? String(secret['profile'] ?? '—') : '—';

    const online         = sessions.length > 0;
    const session        = sessions[0] as Record<string, unknown> | undefined;
    const uptime         = session ? String(session['uptime'] ?? '') : undefined;
    const assignedIp     = session ? String(session['address'] ?? '') : undefined;
    const bytesIn        = session ? String(session['bytes-in']  ?? '0') : undefined;
    const bytesOut       = session ? String(session['bytes-out'] ?? '0') : undefined;
    const calledStationId = session ? String(session['called-station-id'] ?? '') : undefined;

    const checks: FullDiagnostics['checks'] = [
      {
        label:  'Cuenta PPPoE existe en MikroTik',
        ok:     secretExists,
        detail: secretExists ? `Perfil: ${secretProfile}` : 'El secret no fue encontrado en /ppp/secret',
      },
      {
        label:  'Cuenta habilitada',
        ok:     secretExists && !secretDisabled,
        detail: secretDisabled ? 'La cuenta está deshabilitada en MikroTik' : 'Habilitada',
      },
      {
        label:  'Sesión PPPoE activa',
        ok:     online,
        detail: online ? `IP asignada: ${assignedIp} · Tiempo conectado: ${uptime}` : 'Sin sesión activa en /ppp/active',
      },
      {
        label:  'Tráfico circulando',
        ok:     online && (Number(bytesIn) > 0 || Number(bytesOut) > 0),
        detail: online
          ? `↓ ${formatBytes(Number(bytesIn ?? 0))}  ↑ ${formatBytes(Number(bytesOut ?? 0))}`
          : 'Sin datos (sesión inactiva)',
      },
    ];

    return {
      success: true,
      data: {
        secretExists, secretDisabled, secretProfile,
        online, uptime, assignedIp, bytesIn, bytesOut, calledStationId,
        checks,
      },
    };
  } catch (err: unknown) {
    await conn?.close().catch(() => {});
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── Restart client PPPoE session (force reconnect) ──────────────────────────

export const restartPppoeSession = async (
  pppoeUsername: string,
): Promise<{ success: boolean; wasOnline: boolean; error?: string }> => {
  let conn: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    conn = await getConnection();
    await conn.connect();

    const sessions = await safeWrite(conn, '/ppp/active/print', [`?name=${pppoeUsername}`]);

    if (!sessions.length) {
      await conn.close();
      return { success: true, wasOnline: false }; // already offline, nothing to restart
    }

    for (const s of sessions) {
      await conn.write('/ppp/active/remove', [`=.id=${(s as Record<string, unknown>)['.id']}`]);
    }

    await conn.close();
    console.log(`[MikroTik] ✓ Sesión reiniciada: ${pppoeUsername} (${sessions.length} sesión/es terminada/s)`);
    return { success: true, wasOnline: true };
  } catch (err: unknown) {
    await conn?.close().catch(() => {});
    return { success: false, wasOnline: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── Helper: format bytes ─────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024)                  return `${bytes} B`;
  if (bytes < 1024 * 1024)           return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)   return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// ─── Router-level metrics ─────────────────────────────────────────────────────

export const getRouterMetrics = async (): Promise<{ success: boolean; data?: RouterMetrics; error?: string }> => {
  let conn: Awaited<ReturnType<typeof getConnection>> | null = null;
  try {
    conn = await getConnection();
    await conn.connect();
    const res = await conn.write('/system/resource/print');
    await conn.close();

    const r = res[0] as Record<string, unknown>;
    return {
      success: true,
      data: {
        cpuLoad:         String(r['cpu-load'] ?? ''),
        freeMemory:      String(r['free-memory'] ?? ''),
        totalMemory:     String(r['total-memory'] ?? ''),
        uptime:          String(r['uptime'] ?? ''),
        routerOsVersion: String(r['version'] ?? ''),
      },
    };
  } catch (err: unknown) {
    await conn?.close().catch(() => {});
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── Re-export encrypt for use in other modules ───────────────────────────────
export { encrypt as encryptPassword, decrypt as decryptPassword };
