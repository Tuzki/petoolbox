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
      const header = document.querySelector('header')?.textContent ?? '';

      return {
        noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
        bodyBackgroundImage: bodyStyle.backgroundImage,
        bodyBackgroundSize: bodyStyle.backgroundSize,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        topLevelNavLabels: Array.from(document.querySelectorAll('.site-nav__link')).map((link) => link.textContent?.trim()),
        menuToggleCount: document.querySelectorAll('[data-menu-toggle]').length,
        headerHasTopTools: /\bTools\b/.test(header),
        headerHasAbout: /\bAbout\b/.test(header),
        activeLanguageTag: document.querySelector('.language-link--active')?.tagName.toLowerCase(),
        activeLanguageHref: document.querySelector('.language-link--active')?.getAttribute('href'),
        chineseLanguageTag: document.querySelector('.language-link--disabled')?.tagName.toLowerCase(),
        chineseLanguageHref: document.querySelector('.language-link--disabled')?.getAttribute('href'),
        chineseLanguageDisabled: document.querySelector('.language-link--disabled')?.getAttribute('aria-disabled'),
        hasDarkModeText: /dark mode|theme toggle/i.test(document.body.textContent ?? ''),
        filterLabels: Array.from(document.querySelectorAll('[data-filter-button]')).map((button) => button.textContent?.trim()),
        pressedFilter: document.querySelector('[data-filter-button][aria-pressed="true"]')?.textContent?.trim(),
        toolCards: document.querySelectorAll('[data-tool-card]').length,
        comingSoonCards: document.querySelectorAll('[data-tool-status="coming-soon"]').length,
        availableCards: document.querySelectorAll('[data-tool-status="available"]').length,
        betaCards: document.querySelectorAll('[data-tool-status="beta"]').length,
        buckCardText: Array.from(document.querySelectorAll('[data-tool-card]')).find((card) => card.textContent?.includes('Buck Inductor Ripple Calculator'))?.textContent ?? '',
        linkedBuckCards: Array.from(document.querySelectorAll('a.directory-card')).filter((card) => card.textContent?.includes('Buck Inductor Ripple Calculator')).length,
        linkedVoltageSensingCards: Array.from(document.querySelectorAll('a.directory-card')).filter((card) => card.textContent?.includes('Voltage Sensing & ADC Scaling')).length,
        latestArticle: document.body.textContent?.includes('How to Select an Inductor for a Buck Converter') ?? false
      };
    });

    assert.equal(homeResult.noPageHorizontalScroll, true, `${viewport.name} home horizontal overflow`);
    assert.equal(homeResult.h1, 'Design power converters faster.', `${viewport.name} home h1`);
    assert.match(homeResult.bodyBackgroundImage, /linear-gradient/, `${viewport.name} grid background`);
    assert.match(homeResult.bodyBackgroundSize, /96px 96px/, `${viewport.name} major grid`);
    assert.match(homeResult.bodyBackgroundSize, /24px 24px/, `${viewport.name} minor grid`);
    assert.deepEqual(homeResult.topLevelNavLabels, [
      'Topology Designers',
      'Engineering Calculators',
      'Magnetics Design',
      'Control Design',
      'Simulation',
      'Articles'
    ]);
    assert.equal(homeResult.menuToggleCount, 2, `${viewport.name} two dropdown toggles`);
    assert.equal(homeResult.headerHasTopTools, false, `${viewport.name} no top-level Tools`);
    assert.equal(homeResult.headerHasAbout, false, `${viewport.name} no top-level About`);
    assert.deepEqual(homeResult.filterLabels, ['All', 'Topology', 'Calculators', 'Magnetics', 'Control', 'Simulation']);
    assert.equal(homeResult.pressedFilter, 'All', `${viewport.name} all active`);
    assert.equal(homeResult.toolCards, 18, `${viewport.name} full MVP cards`);
    assert.equal(homeResult.comingSoonCards, 16, `${viewport.name} coming soon count`);
    assert.equal(homeResult.availableCards, 1, `${viewport.name} available count`);
    assert.equal(homeResult.betaCards, 1, `${viewport.name} beta count`);
    assert.match(homeResult.buckCardText, /Coming Soon/, `${viewport.name} buck coming soon`);
    assert.equal(homeResult.linkedBuckCards, 0, `${viewport.name} buck card is not link`);
    assert.equal(homeResult.linkedVoltageSensingCards, 1, `${viewport.name} voltage sensing card is link`);
    assert.equal(homeResult.latestArticle, true, `${viewport.name} latest article`);
    assert.equal(homeResult.activeLanguageTag, 'span', `${viewport.name} EN not link`);
    assert.equal(homeResult.activeLanguageHref, null, `${viewport.name} EN no href`);
    assert.equal(homeResult.chineseLanguageTag, 'span', `${viewport.name} Chinese not link`);
    assert.equal(homeResult.chineseLanguageHref, null, `${viewport.name} Chinese no href`);
    assert.equal(homeResult.chineseLanguageDisabled, 'true', `${viewport.name} Chinese disabled`);
    assert.equal(homeResult.hasDarkModeText, false, `${viewport.name} no dark mode text`);

    await page.locator('[data-filter="calculators"]').click();
    const filterResult = await page.evaluate(() => ({
      pressed: document.querySelector('[data-filter-button][aria-pressed="true"]')?.textContent?.trim(),
      visibleCards: Array.from(document.querySelectorAll('[data-tool-card]')).filter((card) => !(card instanceof HTMLElement) || !card.hidden).length
    }));
    assert.equal(filterResult.pressed, 'Calculators', `${viewport.name} calculators filter active`);
    assert.equal(filterResult.visibleCards, 6, `${viewport.name} calculators filter count`);

    if (viewport.width > 1180) {
      const topologyToggle = page.locator('[aria-controls="mega-topology-designers"]');
      await topologyToggle.click();
      assert.equal(await topologyToggle.getAttribute('aria-expanded'), 'true', `${viewport.name} topology expanded`);
      assert.equal(await page.locator('#mega-topology-designers').isVisible(), true, `${viewport.name} topology menu visible`);
      assert.match(await page.locator('#mega-topology-designers').textContent(), /Buck Converter Designer/);
      assert.equal(await page.locator('#mega-topology-designers a', { hasText: 'Buck Converter Designer' }).count(), 0, `${viewport.name} planned topology not link`);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mega-topology-designers').isVisible(), false, `${viewport.name} escape closes topology`);

      const calculatorsToggle = page.locator('[aria-controls="mega-engineering-calculators"]');
      await calculatorsToggle.click();
      assert.equal(await page.locator('#mega-engineering-calculators').isVisible(), true, `${viewport.name} calculators menu visible`);
      assert.match(await page.locator('#mega-engineering-calculators').textContent(), /Buck Inductor Ripple Calculator/);
      assert.match(await page.locator('#mega-engineering-calculators').textContent(), /Voltage Sensing & ADC Scaling/);
      assert.match(await page.locator('#mega-engineering-calculators').textContent(), /Coming Soon/);
      assert.equal(await page.locator('#mega-engineering-calculators a[href="/tools/buck-inductor-ripple-calculator/"]').count(), 1, `${viewport.name} buck menu link`);
      assert.equal(await page.locator('#mega-engineering-calculators a[href="/tools/voltage-sensing-adc-scaling/"]').count(), 1, `${viewport.name} voltage sensing menu link`);
      await page.mouse.click(20, 220);
      assert.equal(await page.locator('#mega-engineering-calculators').isVisible(), false, `${viewport.name} outside click closes calculators`);
    } else {
      const menuButton = page.locator('[data-mobile-menu-button]');
      assert.equal(await menuButton.getAttribute('aria-label'), 'Toggle navigation menu', `${viewport.name} mobile button label`);
      await menuButton.click();
      assert.equal(await menuButton.getAttribute('aria-expanded'), 'true', `${viewport.name} mobile menu opens`);
      assert.equal(await page.locator('#mobile-navigation').isVisible(), true, `${viewport.name} mobile nav visible`);
      assert.equal(await page.locator('[data-mobile-submenu-toggle]').count(), 2, `${viewport.name} two mobile accordions`);
      await page.locator('[aria-controls="mobile-topology-designers"]').click();
      await page.locator('[aria-controls="mobile-engineering-calculators"]').click();
      assert.equal(await page.locator('#mobile-topology-designers').isVisible(), true, `${viewport.name} topology accordion`);
      assert.equal(await page.locator('#mobile-engineering-calculators').isVisible(), true, `${viewport.name} calculators accordion`);
      await page.keyboard.press('Escape');
      assert.equal(await menuButton.getAttribute('aria-expanded'), 'false', `${viewport.name} escape closes mobile`);
      await menuButton.click();
      assert.equal(await page.locator('#mobile-topology-designers').isVisible(), false, `${viewport.name} topology resets`);
      assert.equal(await page.locator('#mobile-engineering-calculators').isVisible(), false, `${viewport.name} calculators resets`);
      await page.keyboard.press('Escape');
    }

    await page.screenshot({
      path: new URL(`home-${viewport.name}.png`, outputDir).pathname,
      fullPage: true
    });

    await page.goto(`${baseUrl}/articles/buck-inductor-selection/`, { waitUntil: 'domcontentloaded' });
    const articleResult = await page.evaluate(() => ({
      noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      sidebarDisplay: getComputedStyle(document.querySelector('.article-sidebar')).display,
      mobileToolDisplay: getComputedStyle(document.querySelector('.article-mobile-tool')).display,
      mobileTocDisplay: getComputedStyle(document.querySelector('.article-toc--mobile')).display,
      comingSoonToolLinks: Array.from(document.querySelectorAll('a')).filter((link) => /Output Capacitor Calculator|Buck Converter Designer/.test(link.textContent ?? '')).length
    }));
    assert.equal(articleResult.noPageHorizontalScroll, true, `${viewport.name} article horizontal overflow`);
    assert.equal(articleResult.h1, 'How to Select an Inductor for a Buck Converter');
    assert.equal(articleResult.comingSoonToolLinks, 0, `${viewport.name} article coming soon tools not links`);
    if (viewport.width > 920) {
      assert.equal(articleResult.sidebarDisplay, 'block', `${viewport.name} article sidebar visible`);
      assert.equal(articleResult.mobileToolDisplay, 'none', `${viewport.name} mobile tool hidden`);
      assert.equal(articleResult.mobileTocDisplay, 'none', `${viewport.name} mobile toc hidden`);
    } else {
      assert.equal(articleResult.sidebarDisplay, 'none', `${viewport.name} article sidebar hidden`);
      assert.equal(articleResult.mobileToolDisplay, 'block', `${viewport.name} mobile tool visible`);
      assert.equal(articleResult.mobileTocDisplay, 'block', `${viewport.name} mobile toc visible`);
    }
    await page.close();

    const toolPage = await browser.newPage({ viewport });
    await toolPage.goto(`${baseUrl}/tools/voltage-sensing-adc-scaling/`, { waitUntil: 'domcontentloaded' });
    const defaultToolResult = await toolPage.evaluate(() => ({
      noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      hasCalculateButton: Array.from(document.querySelectorAll('button, a')).some((element) => element.textContent?.trim() === 'Calculate'),
      maximumInputVoltage: document.querySelector('[data-input="maximumInputVoltage"]')?.value,
      adcReferenceVoltage: document.querySelector('[data-input="adcReferenceVoltage"]')?.value,
      adcResolutionBits: document.querySelector('[data-input="adcResolutionBits"]')?.value,
      resistorSeries: document.querySelector('[data-input="resistorSeries"]')?.value,
      resistorSize: document.querySelector('[data-input="resistorSize"]')?.value,
      upperResistorCount: document.querySelector('[data-input="upperResistorCount"]')?.value,
      upperString: document.querySelector('[data-output="upperString"]')?.textContent?.trim() ?? '',
      lowerBranch: document.querySelector('[data-output="lowerBranch"]')?.textContent?.trim() ?? '',
      flowCode: document.querySelector('[data-output="flowCode"]')?.textContent?.trim() ?? '',
      standardValueFit: document.querySelector('[data-output="nominalAccuracy"]')?.textContent?.trim() ?? '',
      overallStatus: document.querySelector('[data-output="overallStatus"]')?.textContent?.trim() ?? '',
      bodyText: document.body.textContent ?? '',
      firmwareCodePanelTop: document.querySelector('.code-panel code')?.getBoundingClientRect().top ?? 0,
      copyButtonBottom: document.querySelector('[data-copy-code]')?.getBoundingClientRect().bottom ?? 0,
      dividerCurrent: document.querySelector('[data-output="dividerCurrent"]')?.textContent?.trim() ?? '',
      dividerPower: document.querySelector('[data-output="dividerPower"]')?.textContent?.trim() ?? '',
      inputResolution: document.querySelector('[data-output="inputResolution"]')?.textContent?.trim() ?? '',
      checks: document.querySelectorAll('.engineering-check').length,
      firmwareCode: document.querySelector('[data-output="firmwareCode"]')?.textContent ?? ''
    }));
    assert.equal(defaultToolResult.noPageHorizontalScroll, true, `${viewport.name} voltage tool horizontal overflow`);
    assert.equal(defaultToolResult.h1, 'Voltage Sensing & ADC Scaling', `${viewport.name} voltage tool h1`);
    assert.equal(defaultToolResult.hasCalculateButton, false, `${viewport.name} no calculate button`);
    assert.equal(defaultToolResult.maximumInputVoltage, '800', `${viewport.name} default vin`);
    assert.equal(defaultToolResult.adcReferenceVoltage, '2.5', `${viewport.name} default vref`);
    assert.equal(defaultToolResult.adcResolutionBits, '10', `${viewport.name} default bits`);
    assert.equal(defaultToolResult.resistorSeries, 'E24', `${viewport.name} default series`);
    assert.equal(defaultToolResult.resistorSize, '0805', `${viewport.name} default size`);
    assert.equal(defaultToolResult.upperResistorCount, '6', `${viewport.name} default upper count`);
    assert.match(defaultToolResult.upperString, /6 × /, `${viewport.name} upper recommendation`);
    assert.match(defaultToolResult.lowerBranch, /1 × /, `${viewport.name} lower recommendation`);
    assert.match(defaultToolResult.flowCode, /\d+ \/ 1023/, `${viewport.name} adc code`);
    assert.match(defaultToolResult.standardValueFit, /%/, `${viewport.name} standard-value fit`);
    assert.notEqual(defaultToolResult.overallStatus, 'Fail', `${viewport.name} default status is not fail`);
    assert.match(defaultToolResult.bodyText, /Calculated Design/, `${viewport.name} calculated design label`);
    assert.match(defaultToolResult.bodyText, /Standard-Value Fit/, `${viewport.name} fit label`);
    assert.match(defaultToolResult.bodyText, /Deviation from target/, `${viewport.name} deviation label`);
    assert.match(defaultToolResult.bodyText, /resistor search favors a practical lower resistance/i, `${viewport.name} search strategy note`);
    assert.equal(defaultToolResult.bodyText.includes('Recommended Design'), false, `${viewport.name} no recommended design label`);
    assert.equal(defaultToolResult.bodyText.includes('Nominal Accuracy'), false, `${viewport.name} no nominal accuracy label`);
    assert.match(defaultToolResult.dividerCurrent, /µA|mA|A/, `${viewport.name} divider current`);
    assert.match(defaultToolResult.dividerPower, /µW|mW|W/, `${viewport.name} divider power`);
    assert.match(defaultToolResult.inputResolution, /µV\/LSB|mV\/LSB|V\/LSB/, `${viewport.name} input resolution`);
    assert.equal(defaultToolResult.checks, 4, `${viewport.name} engineering checks`);
    assert.match(defaultToolResult.firmwareCode, /VIN_PER_COUNT/, `${viewport.name} firmware code`);
    assert.ok(defaultToolResult.copyButtonBottom <= defaultToolResult.firmwareCodePanelTop, `${viewport.name} copy button does not cover code`);

    await toolPage.locator('[data-input="maximumInputVoltage"]').fill('400');
    const updatedToolResult = await toolPage.evaluate(() => ({
      flowInput: document.querySelector('[data-output="flowInput"]')?.textContent?.trim() ?? '',
      flowCode: document.querySelector('[data-output="flowCode"]')?.textContent?.trim() ?? ''
    }));
    assert.match(updatedToolResult.flowInput, /400/, `${viewport.name} live vin update`);
    assert.match(updatedToolResult.flowCode, /\d+ \/ 1023/, `${viewport.name} live adc code update`);

    await toolPage.locator('.tool-segmented label', { hasText: '2 Lower in Parallel' }).click();
    const parallelResult = await toolPage.locator('[data-output="lowerDetail"]').textContent();
    assert.match(parallelResult ?? '', /Parallel equivalent/, `${viewport.name} parallel lower topology`);

    await toolPage.screenshot({
      path: new URL(`voltage-tool-${viewport.name}.png`, outputDir).pathname,
      fullPage: true
    });
    await toolPage.close();
  }

  for (const path of ['/about/', '/topology-designers/', '/tools/', '/magnetics/', '/control/', '/simulation/', '/tools/buck-inductor-ripple-calculator/', '/tools/voltage-sensing-adc-scaling/', '/articles/']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200, `${path} is not 200`);
    const result = await page.evaluate(() => ({
      noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
      h1Count: document.querySelectorAll('h1').length
    }));
    assert.equal(result.noPageHorizontalScroll, true, `${path} mobile horizontal overflow`);
    assert.equal(result.h1Count, 1, `${path} one h1`);
    await page.close();
  }
} finally {
  await browser.close();
}
