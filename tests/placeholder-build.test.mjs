import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const dist = join(root, 'dist');
const indexPath = join(dist, 'index.html');
const notFoundPath = join(dist, '404.html');
const robotsPath = join(dist, 'robots.txt');

function read(path) {
  return readFileSync(path, 'utf8');
}

test('production placeholder emits only public placeholder routes', () => {
  assert.ok(existsSync(indexPath), 'placeholder home was not generated');
  assert.ok(existsSync(notFoundPath), '404 page was not generated');
  assert.ok(existsSync(robotsPath), 'robots.txt was not generated');
  assert.equal(existsSync(join(dist, 'articles', 'index.html')), false);
  assert.equal(existsSync(join(dist, 'articles', 'buck-inductor-selection', 'index.html')), false);
  assert.equal(existsSync(join(dist, 'tools', 'buck-inductor-ripple-calculator', 'index.html')), false);
});

test('placeholder home does not expose development navigation', () => {
  const html = read(indexPath);
  assert.match(html, /PE Toolbox/);
  assert.match(html, /Practical tools for power electronics engineers\./);
  assert.match(html, /The website is currently under private development\./);
  assert.equal(html.includes('/articles/'), false);
  assert.equal(html.includes('/tools/'), false);
  assert.equal(html.includes('How to Select an Inductor'), false);
  assert.equal(html.includes('Buck Inductor Ripple Calculator'), false);
});

test('private mode still prevents indexing', () => {
  const html = read(indexPath);
  const robots = read(robotsPath);

  assert.match(html, /name="robots" content="noindex, nofollow"/);
  assert.match(html, /rel="canonical" href="https:\/\/petoolbox\.tech\/"/);
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Disallow: \//);
});

test('generated internal links resolve', () => {
  for (const file of [indexPath, notFoundPath]) {
    const html = read(file);
    const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g)).map((match) => match[1]);

    for (const href of hrefs) {
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      if (href === '/favicon.svg') continue;
      const target = href.endsWith('/') ? join(dist, href, 'index.html') : join(dist, href);
      assert.ok(existsSync(target), `${href} from ${file} does not resolve`);
    }
  }
}
);
