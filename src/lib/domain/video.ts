/**
 * Link de vídeo da aula → como mostrar no app.
 * Aceita YouTube, Vimeo, Panda Video, Bunny Stream, Google Drive e arquivo direto (.mp4/.webm).
 * Qualquer outro link não vira iframe (segurança): aparece como "Abrir o vídeo".
 */
export type Video = { tipo: "iframe"; src: string } | { tipo: "arquivo"; src: string } | { tipo: "link"; src: string } | null;

export function videoDaAula(url: string | null | undefined): Video {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");
  // YouTube: watch?v=, youtu.be/, shorts/, embed/
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
    const id = host === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v") ?? u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1];
    return id && /^[\w-]{6,20}$/.test(id) ? { tipo: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` } : { tipo: "link", src: u.href };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(\d{6,})/)?.[1];
    const h = u.pathname.match(/\d{6,}\/([0-9a-f]{6,})/)?.[1] ?? u.searchParams.get("h");
    return id ? { tipo: "iframe", src: `https://player.vimeo.com/video/${id}${h ? `?h=${h}` : ""}` } : { tipo: "link", src: u.href };
  }
  if (host.endsWith(".pandavideo.com.br") || host.endsWith(".mediadelivery.net")) return { tipo: "iframe", src: u.href };
  if (host === "drive.google.com") {
    const id = u.pathname.match(/\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get("id");
    return id ? { tipo: "iframe", src: `https://drive.google.com/file/d/${id}/preview` } : { tipo: "link", src: u.href };
  }
  if (/\.(mp4|webm|mov)$/i.test(u.pathname)) return { tipo: "arquivo", src: u.href };
  return { tipo: "link", src: u.href };
}
