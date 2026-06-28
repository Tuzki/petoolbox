import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const dist = join(root, 'dist');
const articlePath = join(dist, 'articles', 'buck-inductor-selection', 'index.html');
const articlesIndexPath = join(dist, 'articles', 'index.html');
const toolPath = join(dist, 'tools', 'buck-inductor-ripple-calculator', 'index.html');
const categoryPaths = [
  join(dist, 'topology-designers', 'index.html'),
  join(dist, 'tools', 'index.html'),
  join(dist, 'magnetics', 'index.html'),
  join(dist, 'control', 'index.html'),
  join(dist, 'simulation', 'index.html')
];

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
  for (const path of categoryPaths) {
    assert.ok(existsSync(path), `${path} was not generated`);
  }
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

test('primary navigation exposes mvp structure without planned dead links', () => {
  const html = read(articlePath);
  const expectedTopLevel = [
    'Topology Designers',
    'Engineering Calculators',
    'Magnetics Design',
    'Control Design',
    'Simulation',
    'Articles'
  ];

  for (const label of expectedTopLevel) {
    assert.match(html, new RegExp(label));
  }

  assert.equal((html.match(/<button[^>]+data-menu-toggle/g) ?? []).length, 2);
  assert.match(html, /class="mega-menu mega-menu--topology-designers"/);
  assert.match(html, /class="mega-menu mega-menu--engineering-calculators"/);
  assert.match(html, /aria-label="Toggle navigation menu"/);
  assert.match(html, /href="\/topology-designers\/"/);
  assert.match(html, /href="\/tools\/"/);
  assert.match(html, /href="\/magnetics\/"/);
  assert.match(html, /href="\/control\/"/);
  assert.match(html, /href="\/simulation\/"/);
  assert.match(html, /href="\/articles\/"/);
  assert.match(html, /href="\/tools\/buck-inductor-ripple-calculator\/"/);
  assert.match(html, /Buck Inductor Ripple Calculator/);
  assert.match(html, /<span class="language-link language-link--active" aria-current="true">EN<\/span>/);
  assert.equal(html.includes('class="language-link language-link--active" href="/"'), false);
  assert.match(html, /aria-disabled="true" title="Chinese version coming soon"/);
  assert.equal(html.includes('href="/zh'), false);
  assert.equal(html.includes('href="/topology-designers/buck-converter-designer'), false);
  assert.equal(html.includes('href="/tools/rc-time-constant'), false);
  assert.equal(/dark mode|theme toggle/i.test(html), false);
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

test('category pages have titles and private noindex', () => {
  const expected = [
    [categoryPaths[0], 'Topology Designers'],
    [categoryPaths[1], 'Engineering Calculators'],
    [categoryPaths[2], 'Magnetics Design'],
    [categoryPaths[3], 'Control Design'],
    [categoryPaths[4], 'Simulation']
  ];

  for (const [path, title] of expected) {
    const html = read(path);
    assert.match(html, new RegExp(`<h1[^>]*>${title}</h1>`));
    assert.match(html, /name="robots" content="noindex, nofollow"/);
  }
});

test('robots.txt disallows crawling in private mode', () => {
  const robots = read(join(dist, 'robots.txt'));
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Disallow: \//);
});

test('internal links in generated pages resolve to generated files', () => {
  const htmlFiles = findHtmlFiles(dist);

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

function findHtmlFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(path));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(path);
    }
  }

  return files;
}
