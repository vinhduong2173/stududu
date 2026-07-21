import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames.
  // Matcher matches all paths except static assets, favicon, internal next paths.
  matcher: [
    // Match all pathnames except for the ones starting with:
    // - _next (Next.js internals)
    // - _vercel (Vercel internals)
    // - static assets (files with extensions)
    '/((?!_next|_vercel|.*\\..*).*)',
    // Match all pathnames within `/`
    '/'
  ]
};
