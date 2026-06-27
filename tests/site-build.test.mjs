import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const dist = join(root, 'dist');
const articlePath = join(dist, 'articles', 'buck-inductor-selection', 'index.html');
const articlesIndexPath = join(dist, 'articles', 'index.html');
const toolPath = join(dist, 'tools', 'buck-inductor-ripple-calculator', 'index.html');

function read(path) {
  return readFileSync(path, 'utf8');
}

function parseFrontmatter(file) {
  const source = read(file);
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, `${file} is missing frontmatter`);

  const data = {};
  let currentArray = null;

  for (const line of match[1].split('\n')) {
    const arrayItem = line.match(/^\s+-\s+"?([^"]+)"?\s*$/);
    if (arrayItem && currentArray) {
      data[currentArray].push(arrayItem[1]);
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9]+):\s*(.*)$/);
    if (!pair) continue;

    const [, key, rawValue] = pair;
    currentArray = null;

    if (rawValue === '') {
      data[key] = [];
      currentArray = key;
    } else if (rawValue === 'null') {
      data[key] = null;
    } else if (rawValue === 'true' || rawValue === 'false') {
      data[key] = rawValue === 'true';
    } else if (rawValue === '[]') {
      data[key] = [];
    } else {
      data[key] = rawValue.replace(/^"|"$/g, '');
    }
  }

  return data;
}

test('production build emits the article and tool pages', () => {
  assert.ok(existsSync(articlePath), 'article page was not generated');
  assert.ok(existsSync(articlesIndexPath), 'articles index page was not generated');
  assert.ok(existsSync(toolPath), 'tool placeholder page was not generated');
});

test('draft articles are not generated in production output', () => {
  assert.equal(existsSync(join(dist, 'articles', 'draft-hidden-test', 'index.html')), false);
});

test('article frontmatter includes required metadata fields', () => {
  const articlesDir = join(root, 'src', 'content', 'articles');
  const required = ['title', 'description', 'category', 'primaryTool', 'relatedTools', 'publishedAt', 'updatedAt', 'draft'];

  for (const fileName of readdirSync(articlesDir).filter((file) => file.endsWith('.md'))) {
    const data = parseFrontmatter(join(articlesDir, fileName));
    for (const field of required) {
      assert.ok(Object.hasOwn(data, field), `${fileName} is missing ${field}`);
    }
    assert.equal(typeof data.title, 'string');
    assert.equal(typeof data.description, 'string');
    assert.equal(Object.hasOwn(data, 'slug'), false, `${fileName} must not contain handwritten slug frontmatter`);
    assert.equal(typeof data.category, 'string');
    assert.ok(data.primaryTool === null || typeof data.primaryTool === 'string');
    assert.ok(Array.isArray(data.relatedTools));
    assert.match(data.publishedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(data.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(typeof data.draft, 'boolean');
  }
});

test('article page includes automatic tool links and private noindex', () => {
  const html = read(articlePath);
  assert.match(html, /Buck Inductor Ripple Calculator/);
  assert.match(html, /Output Capacitor Calculator/);
  assert.match(html, /Buck Converter Designer/);
  assert.match(html, /href="\/tools\/buck-inductor-ripple-calculator\/"/);
  assert.equal(html.includes('href="/tools/buck-inductor-ripple-calculator/">Output Capacitor Calculator'), false);
  assert.equal(html.includes('href="/tools/buck-inductor-ripple-calculator/">Buck Converter Designer'), false);
  assert.match(html, />Planned</);
  assert.match(html, /rel="canonical" href="https:\/\/petoolbox\.tech\/articles\/buck-inductor-selection\/"/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
});

test('article page uses filename slug, hides self recommendations, and has correct breadcrumb', () => {
  const html = read(articlePath);
  assert.match(html, /Home/);
  assert.match(html, /href="\/articles\/">Articles<\/a>/);
  assert.equal(html.includes('class="related-articles"'), false);
  assert.ok(existsSync(join(dist, 'articles', 'buck-inductor-selection', 'index.html')));
});

test('articles index lists non-draft articles', () => {
  const html = read(articlesIndexPath);
  assert.match(html, /How to Select an Inductor for a Buck Converter/);
  assert.match(html, /href="\/articles\/buck-inductor-selection\/"/);
  assert.equal(html.includes('Draft Article Smoke Test'), false);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
});

test('robots.txt disallows crawling in private mode', () => {
  const robots = read(join(dist, 'robots.txt'));
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Disallow: \//);
});

test('internal links in generated pages resolve to generated files', () => {
  const htmlFiles = [
    join(dist, 'index.html'),
    articlesIndexPath,
    articlePath,
    toolPath
  ];

  for (const file of htmlFiles) {
    const html = read(file);
    const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g)).map((match) => match[1]);
    for (const href of hrefs) {
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      if (href.startsWith('/_astro/') || href === '/favicon.svg') continue;
      const [pathname] = href.split('#');
      const target = pathname.endsWith('/')
        ? join(dist, pathname, 'index.html')
        : join(dist, pathname);
      assert.ok(existsSync(target), `${href} from ${file} does not resolve`);
    }
  }
});
