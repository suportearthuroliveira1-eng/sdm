import { SignJWT, jwtVerify, errors } from "jose";
import { z } from "zod";

/**
 * Link de acesso da aluna: JWT HS256 assinado com ACCESS_LINK_SECRET,
 * uso único (jti guardado em access_links) e validade de 72h.
 * Funções puras: recebem o segredo, para testar sem env.
 */
export const ACCESS_LINK_HOURS = 72;
const AUD = "sdm-access";
const ISS = "sdm";

const claimsSchema = z.object({ sub: z.string().uuid(), jti: z.string().uuid() });
export type AccessClaims = z.infer<typeof claimsSchema>;

const key = (secret: string) => new TextEncoder().encode(secret);

export async function signAccessToken(
  input: { studentId: string; jti: string; now?: Date; hours?: number },
  secret: string,
): Promise<{ token: string; expiresAt: Date }> {
  const now = input.now ?? new Date();
  const hours = input.hours ?? ACCESS_LINK_HOURS;
  const expiresAt = new Date(now.getTime() + hours * 3600_000);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.studentId)
    .setJti(input.jti)
    .setAudience(AUD)
    .setIssuer(ISS)
    .setIssuedAt(Math.floor(now.getTime() / 1000))
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(key(secret));
  return { token, expiresAt };
}

export type VerifyResult =
  | { ok: true; claims: AccessClaims }
  | { ok: false; reason: "expirado" | "invalido" };

export async function verifyAccessToken(token: string, secret: string, now?: Date): Promise<VerifyResult> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      audience: AUD,
      issuer: ISS,
      algorithms: ["HS256"],
      currentDate: now,
    });
    const parsed = claimsSchema.safeParse(payload);
    return parsed.success ? { ok: true, claims: parsed.data } : { ok: false, reason: "invalido" };
  } catch (e) {
    if (e instanceof errors.JWTExpired) return { ok: false, reason: "expirado" };
    return { ok: false, reason: "invalido" };
  }
}

export function accessUrl(appUrl: string, token: string) {
  return `${appUrl.replace(/\/$/, "")}/acesso/${encodeURIComponent(token)}`;
}

/** Mensagem pronta pro WhatsApp. Texto editável no admin (settings.msg_acesso_whatsapp). */
export function whatsappAccessMessage(template: string, vars: { nome: string; link: string; horas?: number }) {
  const primeiro = vars.nome.trim().split(/\s+/)[0] ?? vars.nome;
  return template
    .replaceAll("{nome}", primeiro)
    .replaceAll("{link}", vars.link)
    .replaceAll("{horas}", String(vars.horas ?? ACCESS_LINK_HOURS));
}

export const DEFAULT_WHATSAPP_TEMPLATE =
  "Oi, {nome}! Seu acesso ao app do SDM está pronto. Toque no link pra entrar (vale por {horas}h e funciona uma vez):\n{link}\n\nDepois de entrar, siga o passo a passo pra instalar o app no seu celular.";
