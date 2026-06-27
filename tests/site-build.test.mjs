import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const dist = join(root, 'dist');
const articlePath = join(dist, 'articles', 'buck-inductor-selection', 'index.html');
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
  assert.ok(existsSync(toolPath), 'tool placeholder page was not generated');
});

test('draft articles are not generated in production output', () => {
  assert.equal(existsSync(join(dist, 'articles', 'draft-hidden-test', 'index.html')), false);
});

test('article frontmatter includes required metadata fields', () => {
  const articlesDir = join(root, 'src', 'content', 'articles');
  const required = ['title', 'description', 'slug', 'category', 'primaryTool', 'relatedTools', 'publishedAt', 'updatedAt', 'draft'];

  for (const fileName of readdirSync(articlesDir).filter((file) => file.endsWith('.md'))) {
    const data = parseFrontmatter(join(articlesDir, fileName));
    for (const field of required) {
      assert.ok(Object.hasOwn(data, field), `${fileName} is missing ${field}`);
    }
    assert.equal(typeof data.title, 'string');
    assert.equal(typeof data.description, 'string');
    assert.equal(typeof data.slug, 'string');
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
  assert.match(html, /name="robots" content="noindex, nofollow"/);
});

test('robots.txt disallows crawling in private mode', () => {
  const robots = read(join(dist, 'robots.txt'));
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Disallow: \//);
});
