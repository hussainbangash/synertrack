import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request nonce-based Content-Security-Policy.
 *
 * A fresh nonce is generated on every request and attached to the CSP header.
 * Next.js reads it and stamps the nonce onto its own inline bootstrap scripts,
 * so `script-src` can avoid `unsafe-inline`. `strict-dynamic` lets those trusted
 * scripts load the chunks they need. Styles still allow `unsafe-inline` because
 * the framework injects inline styles that cannot carry a nonce.
 *
 * Tighten `connect-src`/`img-src`/`style-src` if you add external APIs, image
 * hosts, or a CSS-in-JS library.
 */
export function middleware(request: NextRequest) {
  // Use Web APIs only: middleware runs in the Edge runtime, where Node's
  // `Buffer` is not available (e.g. on Vercel). `btoa` + Web Crypto are.
  const nonce = btoa(crypto.randomUUID());

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `connect-src 'self'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Run on all paths except Next internals and static assets. The negative
    // lookahead keeps the CSP off prefetch/static requests that don't need it.
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
