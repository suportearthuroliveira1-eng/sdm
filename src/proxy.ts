import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/public-config";

/**
 * Renova a sessão do Supabase e protege /app e /admin.
 * A checagem de entitlement e de papel acontece no servidor (lib/auth),
 * aqui só barra quem não tem sessão.
 */
const PUBLIC_APP = ["/app/a01", "/app/a02", "/app/a03", "/app/cadastro"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = SUPABASE_URL;
  const anon = SUPABASE_PUBLISHABLE_KEY;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicApp = PUBLIC_APP.some((p) => path === p || path.startsWith(`${p}/`));
  const needsApp = path.startsWith("/app") && !isPublicApp;
  const needsAdmin = path.startsWith("/admin") && !path.startsWith("/admin/entrar");

  if (!user && (needsApp || needsAdmin)) {
    const to = request.nextUrl.clone();
    to.pathname = needsAdmin ? "/admin/entrar" : "/app/a01";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
