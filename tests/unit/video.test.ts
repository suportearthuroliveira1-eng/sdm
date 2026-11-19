import { describe, expect, it } from "vitest";
import { videoDaAula } from "@/lib/domain/video";

describe("vídeo da aula", () => {
  it("YouTube em qualquer formato vira player sem cookies", () => {
    for (const u of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ", "https://youtube.com/shorts/dQw4w9WgXcQ"]) {
      expect(videoDaAula(u)).toEqual({ tipo: "iframe", src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1" });
    }
  });
  it("Vimeo (com hash de vídeo privado), Panda e Drive", () => {
    expect(videoDaAula("https://vimeo.com/123456789/abcdef1234")).toEqual({ tipo: "iframe", src: "https://player.vimeo.com/video/123456789?h=abcdef1234" });
    expect(videoDaAula("https://player-vz-1.tv.pandavideo.com.br/embed/?v=abc")?.tipo).toBe("iframe");
    expect(videoDaAula("https://drive.google.com/file/d/1AbCdEfGhIjK/view")).toEqual({ tipo: "iframe", src: "https://drive.google.com/file/d/1AbCdEfGhIjK/preview" });
  });
  it("arquivo direto vira <video>; site desconhecido vira só link; http e lixo são recusados", () => {
    expect(videoDaAula("https://cdn.exemplo.com/aula.mp4")?.tipo).toBe("arquivo");
    expect(videoDaAula("https://site-qualquer.com/pagina")?.tipo).toBe("link");
    expect(videoDaAula("http://youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(videoDaAula("javascript:alert(1)")).toBeNull();
    expect(videoDaAula("")).toBeNull();
  });
});
