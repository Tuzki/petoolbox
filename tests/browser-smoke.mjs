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
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'mobile-430', width: 430, height: 844 },
  { name: 'mobile-390', width: 390, height: 844 }
];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });

    const homeResult = await page.evaluate(() => {
      const bodyStyle = getComputedStyle(document.body);
      const topLevelNavLabels = Array.from(document.querySelectorAll('.site-nav__link')).map((link) => link.textContent?.trim());

      return {
        innerWidth,
        noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
        bodyBackgroundImage: bodyStyle.backgroundImage,
        bodyBackgroundSize: bodyStyle.backgroundSize,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        topLevelNavLabels,
        menuToggleCount: document.querySelectorAll('[data-menu-toggle]').length,
        activeLanguageTag: document.querySelector('.language-link--active')?.tagName.toLowerCase(),
        activeLanguageHref: document.querySelector('.language-link--active')?.getAttribute('href'),
        activeLanguageCurrent: document.querySelector('.language-link--active')?.getAttribute('aria-current'),
        chineseLanguageTag: document.querySelector('.language-link--disabled')?.tagName.toLowerCase(),
        chineseLanguageHref: document.querySelector('.language-link--disabled')?.getAttribute('href'),
        chineseLanguageDisabled: document.querySelector('.language-link--disabled')?.getAttribute('aria-disabled'),
        hasDarkModeText: /dark mode|theme toggle/i.test(document.body.textContent ?? ''),
        filterLabels: Array.from(document.querySelectorAll('[data-filter-button]')).map((button) => button.textContent?.trim()),
        pressedFilter: document.querySelector('[data-filter-button][aria-pressed="true"]')?.textContent?.trim(),
        toolCards: document.querySelectorAll('[data-tool-card]').length,
        comingSoonCards: document.querySelectorAll('[data-tool-status="coming-soon"]').length,
        betaCards: document.querySelectorAll('[data-tool-status="beta"]').length,
        buckCardText: Array.from(document.querySelectorAll('[data-tool-card]')).find((card) => card.textContent?.includes('Buck Inductor Ripple Calculator'))?.textContent ?? '',
        linkedBuckCards: Array.from(document.querySelectorAll('a.directory-card')).filter((card) => card.textContent?.includes('Buck Inductor Ripple Calculator')).length,
        latestArticle: document.body.textContent?.includes('How to Select an Inductor for a Buck Converter') ?? false
      };
    });

    assert.equal(homeResult.innerWidth, viewport.width, `${viewport.name} viewport width`);
    assert.equal(homeResult.noPageHorizontalScroll, true, `${viewport.name} home page-level horizontal overflow`);
    assert.equal(homeResult.h1, 'Design power converters faster.', `${viewport.name} home h1`);
    assert.match(homeResult.bodyBackgroundImage, /linear-gradient/, `${viewport.name} graph-paper body background`);
    assert.match(homeResult.bodyBackgroundSize, /96px 96px/, `${viewport.name} major grid background size`);
    assert.match(homeResult.bodyBackgroundSize, /24px 24px/, `${viewport.name} minor grid background size`);
    assert.deepEqual(homeResult.topLevelNavLabels, ['Tools', 'Articles', 'About']);
    assert.equal(homeResult.menuToggleCount, 1, `${viewport.name} one tools dropdown toggle`);
    assert.deepEqual(homeResult.filterLabels, ['All', 'Topology', 'Calculators', 'Magnetics', 'Control', 'Simulation']);
    assert.equal(homeResult.pressedFilter, 'All', `${viewport.name} all filter active by default`);
    assert.equal(homeResult.toolCards, 17, `${viewport.name} full MVP tool cards`);
    assert.equal(homeResult.comingSoonCards, 16, `${viewport.name} coming soon card count`);
    assert.equal(homeResult.betaCards, 1, `${viewport.name} beta card count`);
    assert.match(homeResult.buckCardText, /Coming Soon/, `${viewport.name} buck calculator coming soon`);
    assert.equal(homeResult.linkedBuckCards, 0, `${viewport.name} buck calculator card is not a fake link`);
    assert.equal(homeResult.latestArticle, true, `${viewport.name} latest article rendered`);
    assert.equal(homeResult.activeLanguageTag, 'span', `${viewport.name} EN is not a link`);
    assert.equal(homeResult.activeLanguageHref, null, `${viewport.name} EN has no href`);
    assert.equal(homeResult.activeLanguageCurrent, 'true', `${viewport.name} EN current language`);
    assert.equal(homeResult.chineseLanguageTag, 'span', `${viewport.name} Chinese is not a link`);
    assert.equal(homeResult.chineseLanguageHref, null, `${viewport.name} Chinese has no href`);
    assert.equal(homeResult.chineseLanguageDisabled, 'true', `${viewport.name} Chinese disabled`);
    assert.equal(homeResult.hasDarkModeText, false, `${viewport.name} dark mode text absent`);

    await page.locator('[data-filter="calculators"]').click();
    const filterResult = await page.evaluate(() => ({
      pressed: document.querySelector('[data-filter-button][aria-pressed="true"]')?.textContent?.trim(),
      visibleCards: Array.from(document.querySelectorAll('[data-tool-card]')).filter((card) => !(card instanceof HTMLElement) || !card.hidden).length,
      hiddenFocusableLinks: Array.from(document.querySelectorAll('[data-tool-card][hidden] a')).length
    }));
    assert.equal(filterResult.pressed, 'Calculators', `${viewport.name} calculators filter active`);
    assert.equal(filterResult.visibleCards, 5, `${viewport.name} calculators filter shows five tools`);
    assert.equal(filterResult.hiddenFocusableLinks, 0, `${viewport.name} hidden cards have no focusable links`);

    if (viewport.width > 980) {
      const toolsToggle = page.locator('[aria-controls="mega-tools"]');
      await toolsToggle.click();
      assert.equal(await toolsToggle.getAttribute('aria-expanded'), 'true', `${viewport.name} tools menu expanded`);
      assert.equal(await page.locator('#mega-tools').isVisible(), true, `${viewport.name} tools mega menu opens`);
      assert.equal(await page.locator('#mega-tools a[href="/topology-designers/"]').count(), 1, `${viewport.name} topology menu link`);
      assert.equal(await page.locator('#mega-tools a[href="/tools/"]').count(), 1, `${viewport.name} calculators menu link`);
      assert.equal(await page.locator('#mega-tools a[href="/magnetics/"]').count(), 1, `${viewport.name} magnetics menu link`);
      assert.equal(await page.locator('#mega-tools a[href="/control/"]').count(), 1, `${viewport.name} control menu link`);
      assert.equal(await page.locator('#mega-tools a[href="/simulation/"]').count(), 1, `${viewport.name} simulation menu link`);
      assert.match(await page.locator('#mega-tools').textContent(), /Coming Soon/, `${viewport.name} buck featured status`);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mega-tools').isVisible(), false, `${viewport.name} escape closes tools menu`);
    } else {
      const menuButton = page.locator('[data-mobile-menu-button]');
      assert.equal(await menuButton.getAttribute('aria-label'), 'Toggle navigation menu', `${viewport.name} mobile menu label`);
      await menuButton.click();
      assert.equal(await menuButton.getAttribute('aria-expanded'), 'true', `${viewport.name} mobile menu opens`);
      assert.equal(await page.locator('#mobile-navigation').isVisible(), true, `${viewport.name} mobile nav visible`);
      const toolsAccordion = page.locator('[aria-controls="mobile-tools"]');
      await toolsAccordion.click();
      assert.equal(await toolsAccordion.getAttribute('aria-expanded'), 'true', `${viewport.name} tools accordion expands`);
      assert.equal(await page.locator('#mobile-tools').isVisible(), true, `${viewport.name} tools accordion visible`);
      assert.equal(await page.locator('#mobile-tools a[href="/tools/buck-inductor-ripple-calculator/"]').count(), 1, `${viewport.name} mobile buck link exists`);
      await page.keyboard.press('Escape');
      assert.equal(await menuButton.getAttribute('aria-expanded'), 'false', `${viewport.name} escape closes mobile menu`);
      await menuButton.click();
      assert.equal(await page.locator('#mobile-tools').isVisible(), false, `${viewport.name} tools accordion resets after close`);
      assert.equal(await toolsAccordion.getAttribute('aria-expanded'), 'false', `${viewport.name} tools toggle resets`);
      await page.keyboard.press('Escape');
    }

    await page.screenshot({
      path: new URL(`home-${viewport.name}.png`, outputDir).pathname,
      fullPage: true
    });

    await page.goto(`${baseUrl}/articles/buck-inductor-selection/`, { waitUntil: 'domcontentloaded' });

    const articleResult = await page.evaluate(() => {
      const sidebar = document.querySelector('.article-sidebar');
      const mobileTool = document.querySelector('.article-mobile-tool');
      const mobileToc = document.querySelector('.article-toc--mobile');
      const summary = mobileToc?.querySelector('summary');
      const sticky = document.querySelector('.article-sidebar__sticky');
      const footer = document.querySelector('.site-footer');
      const stickyRect = sticky?.getBoundingClientRect();
      const footerRect = footer?.getBoundingClientRect();

      return {
        noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
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
        comingSoonToolLinks: Array.from(document.querySelectorAll('a')).filter((link) => /Output Capacitor Calculator|Buck Converter Designer/.test(link.textContent ?? '')).length,
        plannedToolCards: document.querySelectorAll('.tool-card--planned').length
      };
    });

    assert.equal(articleResult.noPageHorizontalScroll, true, `${viewport.name} article horizontal overflow`);
    assert.equal(articleResult.h1, 'How to Select an Inductor for a Buck Converter');
    assert.equal(articleResult.breadcrumbArticlesHref, '/articles/', `${viewport.name} breadcrumb articles link`);
    assert.equal(articleResult.relatedArticlesVisible, false, `${viewport.name} self related articles hidden`);
    assert.equal(articleResult.comingSoonToolLinks, 0, `${viewport.name} coming soon article tools should not be links`);
    assert.ok(articleResult.plannedToolCards >= 2, `${viewport.name} coming soon tool cards`);

    if (viewport.width > 920) {
      assert.equal(articleResult.sidebarDisplay, 'block', `${viewport.name} sidebar visible`);
      assert.equal(articleResult.mobileToolDisplay, 'none', `${viewport.name} mobile tool hidden`);
      assert.equal(articleResult.mobileTocDisplay, 'none', `${viewport.name} mobile toc hidden`);
      assert.equal(articleResult.stickyPosition, 'sticky', `${viewport.name} sticky sidebar`);
      assert.equal(articleResult.stickyDoesNotOverlapFooter, true, `${viewport.name} sticky/footer overlap`);
    } else {
      assert.equal(articleResult.sidebarDisplay, 'none', `${viewport.name} sidebar hidden`);
      assert.equal(articleResult.mobileToolDisplay, 'block', `${viewport.name} mobile primary tool visible`);
      assert.equal(articleResult.mobileTocDisplay, 'block', `${viewport.name} mobile toc visible`);
      assert.equal(articleResult.mobileTocTag, 'details', `${viewport.name} mobile toc is collapsible`);
      assert.ok(articleResult.summaryMinHeight >= 44, `${viewport.name} toc summary touch target`);
      assert.match(articleResult.primaryToolText, /Buck Inductor Ripple Calculator/);
    }

    await page.screenshot({
      path: new URL(`article-${viewport.name}.png`, outputDir).pathname,
      fullPage: true
    });
    await page.close();
  }

  for (const path of ['/about/', '/topology-designers/', '/tools/', '/magnetics/', '/control/', '/simulation/']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200, `${path} is not 200`);
    const result = await page.evaluate(() => ({
      noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
      h1Count: document.querySelectorAll('h1').length
    }));
    assert.equal(result.noPageHorizontalScroll, true, `${path} mobile horizontal overflow`);
    assert.equal(result.h1Count, 1, `${path} should have one h1`);
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
