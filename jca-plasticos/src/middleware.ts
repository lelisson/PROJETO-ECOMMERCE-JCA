import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (
    process.env.NEXT_PUBLIC_APENAS_VISUALIZACAO === "true" &&
    request.nextUrl.pathname.startsWith("/checkout")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout", "/checkout/:path*"],
};
