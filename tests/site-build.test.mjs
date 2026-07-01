import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const dist = join(root, 'dist');
const locales = ['en', 'zh'];
const formalRoutes = [
  '',
  'tools',
  'tools/voltage-sensing-adc-scaling',
  'tools/sensing-rc-filter-designer',
  'tools/llc-resonant-converter-designer',
  'topology-designers',
  'magnetics',
  'control',
  'simulation',
  'articles',
  'articles/buck-inductor-selection',
  'about'
];

function pagePath(locale, route) {
  return join(dist, locale, route, 'index.html');
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function frontmatter(file) {
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
    } else if (rawValue === 'null') data[key] = null;
    else if (rawValue === 'true' || rawValue === 'false') data[key] = rawValue === 'true';
    else if (rawValue === '[]') data[key] = [];
    else data[key] = rawValue.replace(/^"|"$/g, '');
  }
  return data;
}

test('formal routes are symmetric across English and Chinese', () => {
  for (const route of formalRoutes) {
    for (const locale of locales) {
      assert.ok(existsSync(pagePath(locale, route)), `/${locale}/${route} was not generated`);
    }
  }
});

test('root and legacy routes are noindex redirects to English', () => {
  const rootHtml = read(join(dist, 'index.html'));
  assert.match(rootHtml, /url=\/en\//);
  assert.match(rootHtml, /noindex/);
  for (const route of ['tools', 'articles', 'about', 'tools/voltage-sensing-adc-scaling']) {
    const html = read(join(dist, route, 'index.html'));
    assert.match(html, /noindex, follow/);
    assert.match(html, /url=\/en\//);
  }
});

test('html lang and SEO alternates are emitted per locale', () => {
  for (const locale of locales) {
    const html = read(pagePath(locale, 'tools/voltage-sensing-adc-scaling'));
    assert.match(html, new RegExp(`<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}"`));
    assert.match(html, new RegExp(`<link rel="canonical" href="https://petoolbox.tech/${locale}/tools/voltage-sensing-adc-scaling/"`));
    assert.match(html, /hreflang="en" href="https:\/\/petoolbox.tech\/en\/tools\/voltage-sensing-adc-scaling\/"/);
    assert.match(html, /hreflang="zh-CN" href="https:\/\/petoolbox.tech\/zh\/tools\/voltage-sensing-adc-scaling\/"/);
    assert.match(html, /hreflang="x-default" href="https:\/\/petoolbox.tech\/en\/tools\/voltage-sensing-adc-scaling\/"/);
  }
});

test('language switch links keep the current path', () => {
  const enHtml = read(pagePath('en', 'articles/buck-inductor-selection'));
  const zhHtml = read(pagePath('zh', 'articles/buck-inductor-selection'));
  assert.match(enHtml, /href="\/zh\/articles\/buck-inductor-selection\/"/);
  assert.match(zhHtml, /href="\/en\/articles\/buck-inductor-selection\/"/);
});

test('internal links stay within the active locale', () => {
  const enHtml = read(pagePath('en', ''));
  const zhHtml = read(pagePath('zh', ''));
  assert.match(enHtml, /href="\/en\/tools\/"/);
  assert.match(enHtml, /href="\/en\/articles\/buck-inductor-selection\/"/);
  assert.match(zhHtml, /href="\/zh\/tools\/"/);
  assert.match(zhHtml, /href="\/zh\/articles\/buck-inductor-selection\/"/);
});

test('article pairing is strict for current content', () => {
  const enDir = join(root, 'src', 'content', 'articles', 'en');
  const zhDir = join(root, 'src', 'content', 'articles', 'zh');
  const enFiles = readdirSync(enDir).filter((file) => file.endsWith('.md')).sort();
  const zhFiles = readdirSync(zhDir).filter((file) => file.endsWith('.md')).sort();
  assert.deepEqual(zhFiles, enFiles);
  for (const file of enFiles) {
    const en = frontmatter(join(enDir, file));
    const zh = frontmatter(join(zhDir, file));
    for (const key of ['articleId', 'category', 'primaryTool', 'publishedAt', 'updatedAt', 'draft']) {
      assert.deepEqual(zh[key], en[key], `${file} mismatch: ${key}`);
    }
    assert.notEqual(zh.title, en.title, `${file} title should be localized`);
    assert.notEqual(zh.description, en.description, `${file} description should be localized`);
  }
});

test('draft articles are not generated in production output', () => {
  assert.equal(existsSync(join(dist, 'en', 'articles', 'draft-hidden-test', 'index.html')), false);
  assert.equal(existsSync(join(dist, 'zh', 'articles', 'draft-hidden-test', 'index.html')), false);
});

test('localized visible content is present', () => {
  const enHtml = read(pagePath('en', ''));
  const zhHtml = read(pagePath('zh', ''));
  assert.match(enHtml, /Design power converters faster/);
  assert.match(zhHtml, /更快完成电源变换器设计/);
  assert.match(zhHtml, /工程计算工具/);
  assert.equal(zhHtml.includes('Chinese version coming soon'), false);
});

test('article chrome uses localized category and toc labels', () => {
  const enIndex = read(pagePath('en', 'articles'));
  const zhIndex = read(pagePath('zh', 'articles'));
  const enArticle = read(pagePath('en', 'articles/buck-inductor-selection'));
  const zhArticle = read(pagePath('zh', 'articles/buck-inductor-selection'));

  assert.match(enIndex, /Converter Design/);
  assert.equal(enIndex.includes('converter design'), false);
  assert.match(zhIndex, /变换器设计/);
  assert.equal(zhIndex.includes('converter design'), false);

  assert.match(enArticle, /On this page/);
  assert.match(enArticle, /Converter Design/);
  assert.match(zhArticle, /本文目录/);
  assert.match(zhArticle, /aria-label="本文目录"/);
  assert.equal(zhArticle.includes('On this page'), false);
  assert.match(zhArticle, /变换器设计/);
});

test('footer tagline punctuation is localized', () => {
  const enHtml = read(pagePath('en', ''));
  const zhHtml = read(pagePath('zh', ''));
  const zhArticle = read(pagePath('zh', 'articles/buck-inductor-selection'));

  assert.match(enHtml, /Practical tools for power electronics engineers\./);
  assert.match(zhHtml, /面向电力电子工程师的实用设计工具。/);
  assert.match(zhArticle, /面向电力电子工程师的实用设计工具。/);
  assert.equal(zhHtml.includes('面向电力电子工程师的实用设计工具.'), false);
  assert.equal(zhArticle.includes('面向电力电子工程师的实用设计工具.'), false);
});
