import { isPrivateMode, site } from '@/lib/site';

export function GET() {
  const body = isPrivateMode
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nHost: ${site.url}\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
