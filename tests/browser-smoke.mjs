import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDir = new URL('../test-artifacts/', import.meta.url);

mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true
});

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 844 }
];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}/articles/buck-inductor-selection/`, { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(() => {
      const sidebar = document.querySelector('.article-sidebar');
      const mobileTool = document.querySelector('.article-mobile-tool');
      const mobileToc = document.querySelector('.article-toc--mobile');
      const summary = mobileToc?.querySelector('summary');
      const sticky = document.querySelector('.article-sidebar__sticky');
      const footer = document.querySelector('.site-footer');
      const stickyRect = sticky?.getBoundingClientRect();
      const footerRect = footer?.getBoundingClientRect();

      return {
        innerWidth,
        innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
        sidebarDisplay: sidebar ? getComputedStyle(sidebar).display : null,
        mobileToolDisplay: mobileTool ? getComputedStyle(mobileTool).display : null,
        mobileTocDisplay: mobileToc ? getComputedStyle(mobileToc).display : null,
        mobileTocTag: mobileToc?.tagName.toLowerCase() ?? null,
        summaryMinHeight: summary ? Number.parseFloat(getComputedStyle(summary).minHeight) : 0,
        stickyPosition: sticky ? getComputedStyle(sticky).position : null,
        stickyDoesNotOverlapFooter: stickyRect && footerRect ? stickyRect.bottom <= footerRect.top || footerRect.top > innerHeight : true,
        primaryToolText: mobileTool?.textContent ?? '',
        breadcrumbArticlesHref: document.querySelector('.breadcrumb a[href="/articles/"]')?.getAttribute('href') ?? null,
        relatedArticlesVisible: !!document.querySelector('.related-articles'),
        plannedToolLinks: Array.from(document.querySelectorAll('a')).filter((link) => /Output Capacitor Calculator|Buck Converter Designer/.test(link.textContent ?? '')).length,
        plannedToolCards: document.querySelectorAll('.tool-card--planned').length,
        h1: document.querySelector('h1')?.textContent?.trim() ?? ''
      };
    });

    assert.equal(result.innerWidth, viewport.width, `${viewport.name} viewport width`);
    assert.equal(result.noPageHorizontalScroll, true, `${viewport.name} page-level horizontal overflow`);
    assert.equal(result.h1, 'How to Select an Inductor for a Buck Converter');
    assert.equal(result.breadcrumbArticlesHref, '/articles/', `${viewport.name} breadcrumb articles link`);
    assert.equal(result.relatedArticlesVisible, false, `${viewport.name} self related articles hidden`);
    assert.equal(result.plannedToolLinks, 0, `${viewport.name} planned tools should not be links`);
    assert.ok(result.plannedToolCards >= 2, `${viewport.name} planned tool cards`);

    if (viewport.width >= 920) {
      assert.equal(result.sidebarDisplay, 'block', `${viewport.name} sidebar visible`);
      assert.equal(result.mobileToolDisplay, 'none', `${viewport.name} mobile tool hidden`);
      assert.equal(result.mobileTocDisplay, 'none', `${viewport.name} mobile toc hidden`);
      assert.equal(result.stickyPosition, 'sticky', `${viewport.name} sticky sidebar`);
      assert.equal(result.stickyDoesNotOverlapFooter, true, `${viewport.name} sticky/footer overlap`);
    } else {
      assert.equal(result.sidebarDisplay, 'none', `${viewport.name} sidebar hidden`);
      assert.equal(result.mobileToolDisplay, 'block', `${viewport.name} mobile primary tool visible`);
      assert.equal(result.mobileTocDisplay, 'block', `${viewport.name} mobile toc visible`);
      assert.equal(result.mobileTocTag, 'details', `${viewport.name} mobile toc is collapsible`);
      assert.ok(result.summaryMinHeight >= 44, `${viewport.name} toc summary touch target`);
      assert.match(result.primaryToolText, /Buck Inductor Ripple Calculator/);
    }

    await page.screenshot({
      path: new URL(`article-${viewport.name}.png`, outputDir).pathname,
      fullPage: true
    });
    await page.close();
  }

  const toolPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const response = await toolPage.goto(`${baseUrl}/tools/buck-inductor-ripple-calculator/`, { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200, 'tool page is not 200');
  assert.match(await toolPage.textContent('main'), /Calculator coming in the next iteration/);
  await toolPage.screenshot({
    path: new URL('tool-mobile-390.png', outputDir).pathname,
    fullPage: true
  });
  await toolPage.close();

  const articlesPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const articlesResponse = await articlesPage.goto(`${baseUrl}/articles/`, { waitUntil: 'domcontentloaded' });
  assert.equal(articlesResponse?.status(), 200, 'articles index is not 200');
  const articlesResult = await articlesPage.evaluate(() => ({
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
    title: document.querySelector('h1')?.textContent?.trim() ?? '',
    hasArticle: document.body.textContent?.includes('How to Select an Inductor for a Buck Converter') ?? false
  }));
  assert.equal(articlesResult.noPageHorizontalScroll, true, 'articles index mobile horizontal overflow');
  assert.equal(articlesResult.title, 'Articles');
  assert.equal(articlesResult.hasArticle, true);
  await articlesPage.screenshot({
    path: new URL('articles-index-mobile-390.png', outputDir).pathname,
    fullPage: true
  });
  await articlesPage.close();
} finally {
  await browser.close();
}
