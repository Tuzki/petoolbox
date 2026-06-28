import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const articleHtml = readFileSync(join(root, 'dist', 'articles', 'buck-inductor-selection', 'index.html'), 'utf8');
const articleCss = readCssBundle();

function readCssBundle() {
  const astroDir = join(root, 'dist', '_astro');
  return readdirSync(astroDir)
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join(astroDir, file), 'utf8'))
    .join('\n');
}

test('desktop article layout contains sidebar toc and tool rail', () => {
  assert.match(articleHtml, /class="article-grid"/);
  assert.match(articleHtml, /class="article-sidebar"/);
  assert.match(articleHtml, /On this page/);
  assert.match(articleHtml, /Tools for This Design/);
  assert.match(articleHtml, /href="\/articles\/">Articles<\/a>/);
  assert.equal(articleHtml.includes('class="related-articles"'), false);
  assert.match(articleCss, /grid-template-columns:minmax\(0,820px\) minmax\(280px,320px\)/);
  assert.match(articleCss, /position:sticky/);
});

test('mobile article layout has single-column affordances', () => {
  assert.match(articleHtml, /article-mobile-tool/);
  assert.match(articleHtml, /<details class="article-toc article-toc--mobile">/);
  assert.match(articleCss, /@media\s*\(max-width:920px\)/);
  assert.match(articleCss, /\.article-grid\{display:block\}/);
  assert.match(articleCss, /\.article-sidebar\{display:none\}/);
  assert.match(articleCss, /overflow-x:auto/);
});

test('primary tool appears before article body for mobile reading', () => {
  const descriptionIndex = articleHtml.indexOf('article-hero__description');
  const mobileToolIndex = articleHtml.indexOf('article-mobile-tool');
  const articleGridIndex = articleHtml.indexOf('article-grid');

  assert.ok(descriptionIndex > -1);
  assert.ok(mobileToolIndex > descriptionIndex);
  assert.ok(articleGridIndex > mobileToolIndex);
});

test('planned tool cards are rendered as non-links', () => {
  assert.match(articleHtml, /aria-label="Output Capacitor Calculator Coming Soon tool"/);
  assert.match(articleHtml, /aria-label="Buck Converter Designer Coming Soon tool"/);
  assert.equal(articleHtml.includes('href="/tools/buck-inductor-ripple-calculator/">Output Capacitor Calculator'), false);
  assert.equal(articleHtml.includes('href="/tools/buck-inductor-ripple-calculator/">Buck Converter Designer'), false);
});
