/** Log estruturado (JSON numa linha). Nunca passar segredos ou tokens. */
type Level = "info" | "warn" | "error";
export function log(level: Level, msg: string, ctx: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, msg, ts: new Date().toISOString(), ...ctx });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
