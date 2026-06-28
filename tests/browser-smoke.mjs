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
        topLevelNavLabels: Array.from(document.querySelectorAll('.site-nav__link')).map((link) => link.textContent?.trim()),
        menuToggleCount: document.querySelectorAll('[data-menu-toggle]').length,
        hasDarkModeText: /dark mode|theme toggle/i.test(document.body.textContent ?? ''),
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
    assert.deepEqual(result.topLevelNavLabels, [
      'Topology Designers',
      'Engineering Calculators',
      'Magnetics Design',
      'Control Design',
      'Simulation',
      'Articles'
    ]);
    assert.equal(result.menuToggleCount, 2, `${viewport.name} only two desktop dropdown toggles`);
    assert.equal(result.hasDarkModeText, false, `${viewport.name} dark mode text absent`);

    if (viewport.width >= 920) {
      assert.equal(result.sidebarDisplay, 'block', `${viewport.name} sidebar visible`);
      assert.equal(result.mobileToolDisplay, 'none', `${viewport.name} mobile tool hidden`);
      assert.equal(result.mobileTocDisplay, 'none', `${viewport.name} mobile toc hidden`);
      assert.equal(result.stickyPosition, 'sticky', `${viewport.name} sticky sidebar`);
      assert.equal(result.stickyDoesNotOverlapFooter, true, `${viewport.name} sticky/footer overlap`);

      const topologyToggle = page.locator('[aria-controls="mega-topology-designers"]');
      await topologyToggle.click();
      assert.equal(await page.locator('#mega-topology-designers').isVisible(), true, 'topology mega menu opens');
      assert.equal(await page.locator('#mega-engineering-calculators').isVisible(), false, 'only one menu open');
      assert.equal(await page.locator('#mega-topology-designers a', { hasText: 'Buck Converter Designer' }).count(), 0, 'planned topology item is not a link');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mega-topology-designers').isVisible(), false, 'escape closes topology menu');

      const calculatorsToggle = page.locator('[aria-controls="mega-engineering-calculators"]');
      await calculatorsToggle.click();
      assert.equal(await page.locator('#mega-engineering-calculators').isVisible(), true, 'calculators mega menu opens');
      assert.equal(
        await page.locator('#mega-engineering-calculators a[href="/tools/buck-inductor-ripple-calculator/"]').count(),
        1,
        'buck calculator link exists'
      );
      assert.equal(await page.locator('#mega-engineering-calculators a', { hasText: 'RC Time Constant Calculator' }).count(), 0, 'planned calculator item is not a link');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mega-engineering-calculators').isVisible(), false, 'escape closes calculators menu');
    } else {
      assert.equal(result.sidebarDisplay, 'none', `${viewport.name} sidebar hidden`);
      assert.equal(result.mobileToolDisplay, 'block', `${viewport.name} mobile primary tool visible`);
      assert.equal(result.mobileTocDisplay, 'block', `${viewport.name} mobile toc visible`);
      assert.equal(result.mobileTocTag, 'details', `${viewport.name} mobile toc is collapsible`);
      assert.ok(result.summaryMinHeight >= 44, `${viewport.name} toc summary touch target`);
      assert.match(result.primaryToolText, /Buck Inductor Ripple Calculator/);

      const menuButton = page.locator('[data-mobile-menu-button]');
      await menuButton.click();
      assert.equal(await menuButton.getAttribute('aria-expanded'), 'true', `${viewport.name} mobile menu opens`);
      assert.equal(await page.locator('#mobile-navigation').isVisible(), true, `${viewport.name} mobile nav visible`);
      await page.locator('[aria-controls="mobile-topology-designers"]').click();
      assert.equal(await page.locator('#mobile-topology-designers').isVisible(), true, `${viewport.name} topology accordion opens`);
      await page.locator('[aria-controls="mobile-engineering-calculators"]').click();
      assert.equal(await page.locator('#mobile-engineering-calculators').isVisible(), true, `${viewport.name} calculators accordion opens independently`);
      assert.equal(
        await page.locator('#mobile-engineering-calculators a[href="/tools/buck-inductor-ripple-calculator/"]').count(),
        1,
        `${viewport.name} mobile buck calculator link exists`
      );
      assert.equal(await page.locator('#mobile-engineering-calculators a', { hasText: 'RC Time Constant Calculator' }).count(), 0, `${viewport.name} planned mobile item is not a link`);
      await page.keyboard.press('Escape');
      assert.equal(await menuButton.getAttribute('aria-expanded'), 'false', `${viewport.name} escape closes mobile menu`);
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

  for (const path of ['/topology-designers/', '/tools/', '/magnetics/', '/control/', '/simulation/']) {
    const categoryPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const categoryResponse = await categoryPage.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
    assert.equal(categoryResponse?.status(), 200, `${path} is not 200`);
    const categoryResult = await categoryPage.evaluate(() => ({
      noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
      h1Count: document.querySelectorAll('h1').length
    }));
    assert.equal(categoryResult.noPageHorizontalScroll, true, `${path} mobile horizontal overflow`);
    assert.equal(categoryResult.h1Count, 1, `${path} should have one h1`);
    await categoryPage.close();
  }
} finally {
  await browser.close();
}
