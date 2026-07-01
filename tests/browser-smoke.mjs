import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDir = new URL('../test-artifacts/', import.meta.url);
const llcBaseline = JSON.parse(readFileSync(new URL('./fixtures/default-v5-baseline.json', import.meta.url), 'utf8'));

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
        linkedLlcCards: Array.from(document.querySelectorAll('a.directory-card')).filter((card) => card.textContent?.includes('LLC Resonant Converter Designer')).length,
        linkedVoltageSensingCards: Array.from(document.querySelectorAll('a.directory-card')).filter((card) => card.textContent?.includes('Voltage Sensing & ADC Scaling')).length,
        linkedRcFilterCards: Array.from(document.querySelectorAll('a.directory-card')).filter((card) => card.textContent?.includes('Sensing RC Filter Designer')).length,
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
    assert.equal(homeResult.toolCards, 19, `${viewport.name} full MVP cards`);
    assert.equal(homeResult.comingSoonCards, 15, `${viewport.name} coming soon count`);
    assert.equal(homeResult.availableCards, 3, `${viewport.name} available count`);
    assert.equal(homeResult.betaCards, 1, `${viewport.name} beta count`);
    assert.match(homeResult.buckCardText, /Coming Soon/, `${viewport.name} buck coming soon`);
    assert.equal(homeResult.linkedBuckCards, 0, `${viewport.name} buck card is not link`);
    assert.equal(homeResult.linkedLlcCards, 1, `${viewport.name} llc card is link`);
    assert.equal(homeResult.linkedVoltageSensingCards, 1, `${viewport.name} voltage sensing card is link`);
    assert.equal(homeResult.linkedRcFilterCards, 1, `${viewport.name} rc filter card is link`);
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
    assert.equal(filterResult.visibleCards, 7, `${viewport.name} calculators filter count`);

    if (viewport.width > 1180) {
      const topologyToggle = page.locator('[aria-controls="mega-topology-designers"]');
      await topologyToggle.click();
      assert.equal(await topologyToggle.getAttribute('aria-expanded'), 'true', `${viewport.name} topology expanded`);
      assert.equal(await page.locator('#mega-topology-designers').isVisible(), true, `${viewport.name} topology menu visible`);
      assert.match(await page.locator('#mega-topology-designers').textContent(), /Buck Converter Designer/);
      assert.equal(await page.locator('#mega-topology-designers a', { hasText: 'Buck Converter Designer' }).count(), 0, `${viewport.name} planned topology not link`);
      assert.equal(await page.locator('#mega-topology-designers a[href="/tools/llc-resonant-converter-designer/"]').count(), 1, `${viewport.name} llc topology menu link`);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#mega-topology-designers').isVisible(), false, `${viewport.name} escape closes topology`);

      const calculatorsToggle = page.locator('[aria-controls="mega-engineering-calculators"]');
      await calculatorsToggle.click();
      assert.equal(await page.locator('#mega-engineering-calculators').isVisible(), true, `${viewport.name} calculators menu visible`);
      assert.match(await page.locator('#mega-engineering-calculators').textContent(), /Buck Inductor Ripple Calculator/);
      assert.match(await page.locator('#mega-engineering-calculators').textContent(), /Voltage Sensing & ADC Scaling/);
      assert.match(await page.locator('#mega-engineering-calculators').textContent(), /Sensing RC Filter Designer/);
      assert.match(await page.locator('#mega-engineering-calculators').textContent(), /Coming Soon/);
      assert.equal(await page.locator('#mega-engineering-calculators a[href="/tools/buck-inductor-ripple-calculator/"]').count(), 1, `${viewport.name} buck menu link`);
      assert.equal(await page.locator('#mega-engineering-calculators a[href="/tools/voltage-sensing-adc-scaling/"]').count(), 1, `${viewport.name} voltage sensing menu link`);
      assert.equal(await page.locator('#mega-engineering-calculators a[href="/tools/sensing-rc-filter-designer/"]').count(), 1, `${viewport.name} rc filter menu link`);
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

    const rcPage = await browser.newPage({ viewport });
    const consoleErrors = [];
    rcPage.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await rcPage.goto(`${baseUrl}/tools/sensing-rc-filter-designer/`, { waitUntil: 'domcontentloaded' });
    const rcDefault = await rcPage.evaluate(() => {
      const magnitude = document.querySelector('[data-chart="magnitude"]');
      const phase = document.querySelector('[data-chart="phase"]');
      const countCurvePixels = (canvas, curve) => {
        if (!(canvas instanceof HTMLCanvasElement)) return false;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        const ratio = window.devicePixelRatio || 1;
        const left = Math.floor(canvas.width * 0.16);
        const top = Math.floor(canvas.height * 0.12);
        const width = Math.floor(canvas.width * 0.72);
        const height = Math.floor(canvas.height * 0.66);
        const data = ctx.getImageData(left, top, width, height).data;
        let count = 0;
        for (let index = 0; index < data.length; index += 4) {
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];
          const isBlueCurve = curve === 'magnitude' && r < 70 && g > 70 && g < 150 && b > 130 && b < 210;
          const isTealCurve = curve === 'phase' && r < 70 && g > 90 && g < 150 && b > 90 && b < 150;
          if (a > 200 && (isBlueCurve || isTealCurve)) count += 1;
        }
        return count / ratio > 30;
      };

      return {
        noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        status: document.querySelector('[data-output="status"]')?.textContent?.trim() ?? '',
        sourceMode: document.querySelector('input[name="sourceMode"]:checked')?.value,
        sourceResistance: document.querySelector('[data-output="sourceResistance"]')?.textContent?.trim() ?? '',
        cutoff: document.querySelector('[data-output="cutoffFrequency"]')?.textContent?.trim() ?? '',
        noise: document.querySelector('[data-output="noiseAttenuation"]')?.textContent?.trim() ?? '',
        signal: document.querySelector('[data-output="signalAttenuation"]')?.textContent?.trim() ?? '',
        phase: document.querySelector('[data-output="signalPhase"]')?.textContent?.trim() ?? '',
        bodyText: document.body.textContent ?? '',
        signalHasNegativeZero: (document.querySelector('[data-output="signalAttenuation"]')?.textContent ?? '').includes('-0.00'),
        magnitudeCurve: countCurvePixels(magnitude, 'magnitude'),
        phaseCurve: countCurvePixels(phase, 'phase')
      };
    });
    assert.equal(rcDefault.noPageHorizontalScroll, true, `${viewport.name} rc filter horizontal overflow`);
    assert.equal(rcDefault.h1, 'Sensing RC Filter Designer', `${viewport.name} rc h1`);
    assert.equal(rcDefault.status, 'GOOD BALANCE', `${viewport.name} rc default status`);
    assert.equal(rcDefault.sourceMode, 'resistor-divider', `${viewport.name} rc default source mode`);
    assert.match(rcDefault.sourceResistance, /Ω|kΩ|MΩ/, `${viewport.name} rc source resistance`);
    assert.match(rcDefault.cutoff, /Hz|kHz|MHz/, `${viewport.name} rc cutoff`);
    assert.match(rcDefault.noise, /dB/, `${viewport.name} rc noise attenuation`);
    assert.match(rcDefault.signal, /dB/, `${viewport.name} rc signal attenuation`);
    assert.match(rcDefault.phase, /°/, `${viewport.name} rc signal phase`);
    assert.match(rcDefault.bodyText, /Max Allowed Signal Loss/, `${viewport.name} rc max signal loss label`);
    assert.match(rcDefault.bodyText, /Desired Noise Attenuation/, `${viewport.name} rc desired noise label`);
    assert.equal(/ADC resolution|sample capacitor|SAR ADC|LSB error/i.test(rcDefault.bodyText), false, `${viewport.name} rc no adc internal model`);
    assert.equal(rcDefault.signalHasNegativeZero, false, `${viewport.name} rc no negative zero dB`);
    assert.equal(rcDefault.magnitudeCurve, true, `${viewport.name} magnitude chart draws curve`);
    assert.equal(rcDefault.phaseCurve, true, `${viewport.name} phase chart draws curve`);

    await rcPage.locator('.rc-source-mode label', { hasText: 'Voltage-output source' }).click();
    const outputMode = await rcPage.evaluate(() => ({
      mode: document.querySelector('input[name="sourceMode"]:checked')?.value,
      sourceLabel: document.querySelector('[data-output="sourceLabel"]')?.textContent?.trim() ?? '',
      sourceResistance: document.querySelector('[data-output="sourceResistance"]')?.textContent?.trim() ?? ''
    }));
    assert.equal(outputMode.mode, 'voltage-output', `${viewport.name} rc source switches`);
    assert.equal(outputMode.sourceLabel, 'Voltage-output source', `${viewport.name} rc source label updates`);
    assert.match(outputMode.sourceResistance, /100 Ω/, `${viewport.name} rc output source resistance`);

    await rcPage.locator('[data-input="filterCapacitancePf"]').fill('220');
    const updatedRc = await rcPage.evaluate(() => ({
      cutoff: document.querySelector('[data-output="cutoffFrequency"]')?.textContent?.trim() ?? '',
      status: document.querySelector('[data-output="status"]')?.textContent?.trim() ?? ''
    }));
    assert.notEqual(updatedRc.cutoff, rcDefault.cutoff, `${viewport.name} rc live update changes cutoff`);
    assert.match(updatedRc.status, /GOOD BALANCE|FILTER TOO WEAK|FILTER TOO SLOW|TARGET CONFLICT/, `${viewport.name} rc status remains valid`);

    const updatedCurves = await rcPage.evaluate(() => {
      const countCurvePixels = (selector, curve) => {
        const canvas = document.querySelector(selector);
        if (!(canvas instanceof HTMLCanvasElement)) return false;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        const ratio = window.devicePixelRatio || 1;
        const data = ctx.getImageData(
          Math.floor(canvas.width * 0.16),
          Math.floor(canvas.height * 0.12),
          Math.floor(canvas.width * 0.72),
          Math.floor(canvas.height * 0.66)
        ).data;
        let count = 0;
        for (let index = 0; index < data.length; index += 4) {
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];
          const isBlueCurve = curve === 'magnitude' && r < 70 && g > 70 && g < 150 && b > 130 && b < 210;
          const isTealCurve = curve === 'phase' && r < 70 && g > 90 && g < 150 && b > 90 && b < 150;
          if (a > 200 && (isBlueCurve || isTealCurve)) count += 1;
        }
        return count / ratio > 30;
      };

      return {
        magnitudeCurve: countCurvePixels('[data-chart="magnitude"]', 'magnitude'),
        phaseCurve: countCurvePixels('[data-chart="phase"]', 'phase')
      };
    });
    assert.equal(updatedCurves.magnitudeCurve, true, `${viewport.name} magnitude chart redraws curve`);
    assert.equal(updatedCurves.phaseCurve, true, `${viewport.name} phase chart redraws curve`);

    await rcPage.locator('[data-input="filterCapacitancePf"]').fill('');
    const invalidCapacitance = await rcPage.evaluate(() => {
      const countCurvePixels = (selector, curve) => {
        const canvas = document.querySelector(selector);
        if (!(canvas instanceof HTMLCanvasElement)) return false;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        const data = ctx.getImageData(
          Math.floor(canvas.width * 0.16),
          Math.floor(canvas.height * 0.12),
          Math.floor(canvas.width * 0.72),
          Math.floor(canvas.height * 0.66)
        ).data;
        let count = 0;
        for (let index = 0; index < data.length; index += 4) {
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];
          const isBlueCurve = curve === 'magnitude' && r < 70 && g > 70 && g < 150 && b > 130 && b < 210;
          const isTealCurve = curve === 'phase' && r < 70 && g > 90 && g < 150 && b > 90 && b < 150;
          if (a > 200 && (isBlueCurve || isTealCurve)) count += 1;
        }
        return count;
      };

      return {
        status: document.querySelector('[data-output="status"]')?.textContent?.trim() ?? '',
        cutoff: document.querySelector('[data-output="cutoffFrequency"]')?.textContent?.trim() ?? '',
        signal: document.querySelector('[data-output="signalAttenuation"]')?.textContent?.trim() ?? '',
        placeholder: document.querySelector('[data-output="actionText"]')?.textContent?.trim() ?? '',
        magnitudeCurvePixels: countCurvePixels('[data-chart="magnitude"]', 'magnitude'),
        phaseCurvePixels: countCurvePixels('[data-chart="phase"]', 'phase')
      };
    });
    assert.equal(invalidCapacitance.status, 'CHECK INPUTS', `${viewport.name} rc invalid empty capacitor status`);
    assert.equal(invalidCapacitance.cutoff, '—', `${viewport.name} rc invalid cutoff placeholder`);
    assert.equal(invalidCapacitance.signal, '—', `${viewport.name} rc invalid signal placeholder`);
    assert.match(invalidCapacitance.placeholder, /frequency-response charts will update/, `${viewport.name} rc invalid guidance`);
    assert.equal(invalidCapacitance.magnitudeCurvePixels, 0, `${viewport.name} rc invalid magnitude clears old curve`);
    assert.equal(invalidCapacitance.phaseCurvePixels, 0, `${viewport.name} rc invalid phase clears old curve`);

    await rcPage.locator('[data-input="filterCapacitancePf"]').fill('22');
    await rcPage.locator('[data-input="signalFrequencyKhz"]').fill('0');
    const invalidSignalFrequency = await rcPage.evaluate(() => ({
      status: document.querySelector('[data-output="status"]')?.textContent?.trim() ?? '',
      signal: document.querySelector('[data-output="signalAttenuation"]')?.textContent?.trim() ?? ''
    }));
    assert.equal(invalidSignalFrequency.status, 'CHECK INPUTS', `${viewport.name} rc zero signal frequency invalid`);
    assert.equal(invalidSignalFrequency.signal, '—', `${viewport.name} rc zero signal placeholder`);
    assert.deepEqual(consoleErrors, [], `${viewport.name} rc no console errors after invalid signal frequency`);

    await rcPage.locator('[data-input="signalFrequencyKhz"]').fill('10');
    await rcPage.locator('[data-input="filterResistanceKohms"]').fill('-1');
    const invalidNegativeResistance = await rcPage.evaluate(() => ({
      status: document.querySelector('[data-output="status"]')?.textContent?.trim() ?? '',
      cutoff: document.querySelector('[data-output="cutoffFrequency"]')?.textContent?.trim() ?? ''
    }));
    assert.equal(invalidNegativeResistance.status, 'CHECK INPUTS', `${viewport.name} rc negative filter resistance invalid`);
    assert.equal(invalidNegativeResistance.cutoff, '—', `${viewport.name} rc negative resistance placeholder`);

    await rcPage.locator('[data-input="filterResistanceKohms"]').fill('1');
    const restoredRc = await rcPage.evaluate(() => {
      const canvas = document.querySelector('[data-chart="magnitude"]');
      const ctx = canvas instanceof HTMLCanvasElement ? canvas.getContext('2d') : null;
      let curvePixels = 0;
      if (canvas instanceof HTMLCanvasElement && ctx) {
        const ratio = window.devicePixelRatio || 1;
        const data = ctx.getImageData(
          Math.floor(canvas.width * 0.16),
          Math.floor(canvas.height * 0.12),
          Math.floor(canvas.width * 0.72),
          Math.floor(canvas.height * 0.66)
        ).data;
        for (let index = 0; index < data.length; index += 4) {
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];
          if (a > 200 && r < 70 && g > 70 && g < 150 && b > 130 && b < 210) curvePixels += 1 / ratio;
        }
      }
      return {
        status: document.querySelector('[data-output="status"]')?.textContent?.trim() ?? '',
        curve: curvePixels > 30
      };
    });
    assert.match(restoredRc.status, /GOOD BALANCE|FILTER TOO WEAK|FILTER TOO SLOW|TARGET CONFLICT/, `${viewport.name} rc restored status recalculates`);
    assert.equal(restoredRc.curve, true, `${viewport.name} rc restored curve appears`);

    await rcPage.screenshot({
      path: new URL(`rc-filter-tool-${viewport.name}.png`, outputDir).pathname,
      fullPage: true
    });
    await rcPage.close();
  }

  const llcPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const llcPageErrors = [];
  llcPage.on('pageerror', (error) => llcPageErrors.push(error.message));
  llcPage.on('console', (message) => {
    if (message.type() === 'error') llcPageErrors.push(message.text());
  });
  await llcPage.goto(`${baseUrl}/tools/llc-resonant-converter-designer/`, { waitUntil: 'domcontentloaded' });
  await llcPage.locator('#runBtn').click();
  await llcPage.waitForFunction(() => document.querySelector('#mFeasible')?.textContent?.trim() === '539', null, { timeout: 120000 });
  await llcPage.waitForFunction(() => document.querySelectorAll('#statePlot path').length > 0 && document.querySelectorAll('#wavePlot path').length > 0, null, { timeout: 120000 });
  const llcInteractionResult = await llcPage.evaluate(() => {
    const defaultSelected = document.querySelector('#selectedPanel h3')?.textContent?.trim() ?? '';
    const alternate = Array.from(document.querySelectorAll('#matrix [data-id]')).find((cell) => !cell.classList.contains('selected'));
    alternate?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const alternateSelected = document.querySelector('#selectedPanel h3')?.textContent?.trim() ?? '';
    document.querySelector('#recommendBody tr[data-id]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return {
      defaultSelected,
      alternateSelected,
      restoredSelected: document.querySelector('#selectedPanel h3')?.textContent?.trim() ?? ''
    };
  });
  assert.notEqual(llcInteractionResult.alternateSelected, llcInteractionResult.defaultSelected, 'llc candidate switching changes selected design');
  assert.equal(llcInteractionResult.restoredSelected, llcInteractionResult.defaultSelected, 'llc candidate switching restores default design');
  await llcPage.waitForFunction(() => document.querySelectorAll('#statePlot path').length > 0 && document.querySelectorAll('#wavePlot path').length > 0, null, { timeout: 120000 });
  const llcResult = await llcPage.evaluate(() => ({
    noPageHorizontalScroll: document.documentElement.scrollWidth <= innerWidth,
    h1: document.querySelector('h1')?.textContent?.trim() ?? '',
    h1Count: document.querySelectorAll('h1').length,
    visibleTextHasChinese: /[\u3400-\u9FFF]/.test(document.querySelector('[data-llc-designer-root]')?.innerText ?? ''),
    transformerRatioCards: document.querySelectorAll('#ratioOverview .ratio-overview').length,
    total: Number(document.querySelector('#mTotal')?.textContent?.trim()),
    feasible: Number(document.querySelector('#mFeasible')?.textContent?.trim()),
    marginal: Number(document.querySelector('#mMarginal')?.textContent?.trim()),
    failed: Number(document.querySelector('#mFailed')?.textContent?.trim()),
    selectedTitle: document.querySelector('#selectedPanel h3')?.textContent?.trim() ?? '',
    selectedMargin: document.querySelector('#selectedPanel .margin-badge')?.textContent?.trim() ?? '',
    selectedCorner: document.querySelector('#cornerBody tr.active td:first-child')?.textContent?.trim() ?? '',
    top5: Array.from(document.querySelectorAll('#recommendBody tr')).slice(0, 5).map((row) => Array.from(row.children).map((cell) => cell.textContent.trim().replace(/\s+/g, ' '))),
    corners: Array.from(document.querySelectorAll('#cornerBody tr')).map((row) => Array.from(row.children).map((cell) => cell.textContent.trim().replace(/\s+/g, ' '))),
    statePathCount: document.querySelectorAll('#statePlot path').length,
    waveformPathCount: document.querySelectorAll('#wavePlot path').length
  }));
  assert.equal(llcResult.noPageHorizontalScroll, true, 'llc desktop horizontal overflow');
  assert.equal(llcResult.h1, 'LLC Resonant Converter Designer', 'llc h1');
  assert.equal(llcResult.h1Count, 1, 'llc one h1');
  assert.equal(llcResult.visibleTextHasChinese, false, 'llc visible text is English only');
  assert.equal(llcResult.transformerRatioCards, 5, 'llc five transformer-ratio cards');
  assert.equal(llcResult.total, llcBaseline.total, 'llc total candidate count');
  assert.equal(llcResult.feasible, llcBaseline.feasible, 'llc feasible count');
  assert.equal(llcResult.marginal, llcBaseline.marginal, 'llc marginal count');
  assert.equal(llcResult.failed, llcBaseline.failed, 'llc failed count');
  assert.equal(llcResult.selectedTitle, llcBaseline.selectedTitle, 'llc selected candidate');
  assert.equal(llcResult.selectedMargin, llcBaseline.selectedMargin, 'llc selected margin');
  assert.equal(llcResult.selectedCorner, llcBaseline.selectedCorner, 'llc selected corner');
  assert.deepEqual(llcResult.top5, llcBaseline.top5, 'llc top 5 baseline');
  assert.deepEqual(llcResult.corners, llcBaseline.corners, 'llc corner baseline');
  assert.equal(llcResult.statePathCount, llcBaseline.statePathCount, 'llc state-plane path count');
  assert.equal(llcResult.waveformPathCount, llcBaseline.waveformPathCount, 'llc waveform path count');
  await llcPage.locator('#curveBtn').click();
  await llcPage.waitForFunction(() => document.querySelector('#curveBtn')?.textContent?.trim() === 'Calculate Gain Envelope', null, { timeout: 120000 });
  const llcGainResult = await llcPage.evaluate(() => ({
    pathCount: document.querySelectorAll('#gainPlot path').length,
    summaryText: document.querySelector('#curveSummary')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  }));
  assert.ok(llcGainResult.pathCount > 0, 'llc gain envelope draws paths');
  assert.match(llcGainResult.summaryText, /Target gain range.+Required fs range.+Tightest corner/, 'llc gain envelope summary updates');
  const llcOperatingSwitch = await llcPage.evaluate(() => {
    const before = document.querySelector('#cornerBody tr.active td:first-child')?.textContent?.trim() ?? '';
    const alternate = Array.from(document.querySelectorAll('#cornerBody tr[data-i]')).find((row) => !row.classList.contains('active'));
    alternate?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return {
      before,
      after: document.querySelector('#cornerBody tr.active td:first-child')?.textContent?.trim() ?? ''
    };
  });
  assert.notEqual(llcOperatingSwitch.after, llcOperatingSwitch.before, 'llc operating-point switching changes active row');
  await llcPage.waitForFunction(() => document.querySelectorAll('#statePlot path').length > 0 && document.querySelectorAll('#wavePlot path').length > 0, null, { timeout: 120000 });
  const llcOperatingPaths = await llcPage.evaluate(() => ({
    statePathCount: document.querySelectorAll('#statePlot path').length,
    waveformPathCount: document.querySelectorAll('#wavePlot path').length
  }));
  assert.ok(llcOperatingPaths.statePathCount > 0, 'llc state-plane remains rendered after operating-point switch');
  assert.ok(llcOperatingPaths.waveformPathCount > 0, 'llc waveform remains rendered after operating-point switch');
  assert.deepEqual(llcPageErrors, llcBaseline.pageErrors, 'llc browser page errors');
  await llcPage.close();

  const llcMobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await llcMobilePage.goto(`${baseUrl}/tools/llc-resonant-converter-designer/`, { waitUntil: 'domcontentloaded' });
  await llcMobilePage.locator('#runBtn').click();
  await llcMobilePage.waitForFunction(() => document.querySelector('#mFeasible')?.textContent?.trim() === '539', null, { timeout: 120000 });
  await llcMobilePage.waitForFunction(() => document.querySelectorAll('#statePlot path').length > 0 && document.querySelectorAll('#wavePlot path').length > 0, null, { timeout: 120000 });
  const llcMobileOverflow = await llcMobilePage.evaluate(() => ({
    noPageHorizontalScroll: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
  }));
  assert.equal(llcMobileOverflow.noPageHorizontalScroll, true, 'llc mobile horizontal overflow after calculation');
  await llcMobilePage.close();

  for (const path of ['/about/', '/topology-designers/', '/tools/', '/magnetics/', '/control/', '/simulation/', '/tools/buck-inductor-ripple-calculator/', '/tools/voltage-sensing-adc-scaling/', '/tools/sensing-rc-filter-designer/', '/tools/llc-resonant-converter-designer/', '/articles/']) {
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
