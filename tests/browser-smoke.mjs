import assert from 'node:assert/strict';
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4321';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outputDir = new URL('../test-artifacts/', import.meta.url);
const llcBaseline = JSON.parse(readFileSync(new URL('./fixtures/default-v5-baseline.json', import.meta.url), 'utf8'));

mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const viewports = [
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 }
];
const symmetricRoutes = [
  '/',
  '/tools/',
  '/topology-designers/',
  '/magnetics/',
  '/control/',
  '/simulation/',
  '/articles/',
  '/about/',
  '/tools/voltage-sensing-adc-scaling/',
  '/tools/sensing-rc-filter-designer/',
  '/tools/llc-resonant-converter-designer/',
  '/articles/buck-inductor-selection/'
];
const zhForbiddenTerms = [
  'Search',
  'Reset',
  'Run',
  'Calculate',
  'Inputs',
  'Outputs',
  'Results',
  'Recommended',
  'Selected',
  'Specifications',
  'Search Summary',
  'Recommended Designs',
  'Selected Design',
  'Candidate Space',
  'Operating Points',
  'Advanced Analysis',
  'Engineering Check',
  'Firmware Scaling',
  'Calculated Design',
  'Pass',
  'Review',
  'Fail',
  'Failed',
  'Marginal',
  'Feasible',
  'No candidates',
  'No results',
  'Input error',
  'Numerical issue',
  'Coming Soon',
  'Available',
  'Learn more',
  'Read article',
  'Voltage-output source',
  'Resistor divider',
  'Engineering Details',
  'How to Use',
  'CHECK INPUTS',
  'On this page',
  'converter design'
];

const normalize = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();
const pathFor = (locale, route) => `/${locale}${route}`;

async function readPageState(page) {
  return page.evaluate(() => ({
    noOverflow: document.documentElement.scrollWidth <= innerWidth,
    lang: document.documentElement.lang,
    h1: document.querySelector('h1')?.textContent?.trim() ?? '',
    body: document.body.innerText,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    alternateCount: document.querySelectorAll('link[rel="alternate"]').length,
    headerLanguage: Array.from(document.querySelectorAll('.site-header__language a')).map((link) => link.getAttribute('href')),
    footerLanguage: Array.from(document.querySelectorAll('.site-footer__language a')).map((link) => link.getAttribute('href')),
    navLinks: Array.from(document.querySelectorAll('.site-nav__link')).map((link) => link.getAttribute('href')),
    activeLanguage: document.querySelector('.language-link--active')?.textContent?.trim() ?? ''
  }));
}

function assertNoZhLeak(text, route) {
  const hits = zhForbiddenTerms.filter((term) => text.includes(term));
  assert.deepEqual(hits, [], `${route} Chinese UI leaks English terms`);
}

function pickOutputs(outputs, keys) {
  return Object.fromEntries(keys.map((key) => [key, normalize(outputs[key])]));
}

async function outputMap(page) {
  return page.evaluate(() => Object.fromEntries(
    Array.from(document.querySelectorAll('[data-output]')).map((node) => [node.getAttribute('data-output'), node.textContent])
  ));
}

async function setInput(page, name, value) {
  const locator = page.locator(`[data-input="${name}"]`);
  await locator.fill(String(value));
  await locator.dispatchEvent('input');
  await locator.dispatchEvent('change');
}

async function assertLanguageSwitchPreservesUrl(page, locale, route) {
  await page.goto(`${baseUrl}${pathFor(locale, route)}?r=1000&c=1e-9#results`, { waitUntil: 'domcontentloaded' });
  const nextLocale = locale === 'en' ? 'zh' : 'en';
  const expected = `${pathFor(nextLocale, route)}?r=1000&c=1e-9#results`;
  const links = await page.evaluate(async () => {
    document.querySelector('[data-mobile-menu-button]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return {
      header: document.querySelector('.site-header__language a')?.getAttribute('href'),
      footer: document.querySelector('.site-footer__language a')?.getAttribute('href'),
      mobile: document.querySelector('.mobile-nav__language a')?.getAttribute('href')
    };
  });
  assert.equal(links.header, expected, `${locale} header language link preserves query/hash`);
  assert.equal(links.footer, expected, `${locale} footer language link preserves query/hash`);
  assert.equal(links.mobile, expected, `${locale} mobile language link preserves query/hash`);
}

async function assertArticleLocalization(page) {
  await page.goto(`${baseUrl}/en/articles/`, { waitUntil: 'domcontentloaded' });
  let text = await documentText(page);
  assert.match(text, /Converter Design/);
  assert.equal(text.includes('converter design'), false);
  assert.match(text, /Practical tools for power electronics engineers\./);

  await page.goto(`${baseUrl}/zh/articles/`, { waitUntil: 'domcontentloaded' });
  text = await documentText(page);
  assert.match(text, /变换器设计/);
  assert.equal(text.includes('converter design'), false);
  assert.match(text, /面向电力电子工程师的实用设计工具。/);
  assert.equal(text.includes('面向电力电子工程师的实用设计工具.'), false);
  assertNoZhLeak(text, 'zh articles index');

  await page.goto(`${baseUrl}/en/articles/buck-inductor-selection/`, { waitUntil: 'domcontentloaded' });
  text = await documentText(page);
  assert.match(text, /On this page/);
  assert.match(text, /Converter Design/);
  assert.match(text, /Practical tools for power electronics engineers\./);

  await page.goto(`${baseUrl}/zh/articles/buck-inductor-selection/`, { waitUntil: 'domcontentloaded' });
  const zhArticle = await page.evaluate(() => ({
    text: document.body.innerText,
    tocLabels: Array.from(document.querySelectorAll('.article-toc summary, .article-toc h2')).map((node) => node.textContent?.trim()),
    tocAria: Array.from(document.querySelectorAll('.article-toc[aria-label]')).map((node) => node.getAttribute('aria-label'))
  }));
  assert.match(zhArticle.text, /变换器设计/);
  assert.equal(zhArticle.text.includes('On this page'), false);
  assert.deepEqual(zhArticle.tocLabels, ['本文目录', '本文目录']);
  assert.deepEqual(zhArticle.tocAria, ['本文目录']);
  assert.match(zhArticle.text, /面向电力电子工程师的实用设计工具。/);
  assert.equal(zhArticle.text.includes('面向电力电子工程师的实用设计工具.'), false);
  assertNoZhLeak(zhArticle.text, 'zh article detail');
}

async function assertSymmetricRoute(page, viewport, locale, route) {
  await page.goto(`${baseUrl}${pathFor(locale, route)}`, { waitUntil: 'domcontentloaded' });
  const state = await readPageState(page);
  assert.equal(state.noOverflow, true, `${viewport.name} ${locale}${route} overflow`);
  assert.equal(state.lang, locale === 'zh' ? 'zh-CN' : 'en');
  assert.match(state.canonical, new RegExp(`${pathFor(locale, route)}$`), `${locale}${route} canonical`);
  assert.equal(state.alternateCount, 3, `${locale}${route} alternate links`);
  assert.ok(state.navLinks.every((href) => href?.startsWith(`/${locale}/`)), `${locale}${route} nav links localized`);
  if (locale === 'zh') {
    assert.equal(state.activeLanguage, '中文');
    assertNoZhLeak(state.body, `${locale}${route}`);
    assert.equal(state.body.includes('Chinese version coming soon'), false);
  } else {
    assert.equal(state.activeLanguage, 'EN');
    assert.equal(/[\u4e00-\u9fff]/.test(state.body.replaceAll('中文', '')), false, `${locale}${route} English UI leaks Chinese text`);
  }
}

async function assertVoltageTool(page) {
  const states = {};
  for (const locale of ['en', 'zh']) {
    await page.goto(`${baseUrl}/${locale}/tools/voltage-sensing-adc-scaling/`, { waitUntil: 'domcontentloaded' });
    await setInput(page, 'maximumInputVoltage', 400);
    states[locale] = await outputMap(page);
    if (locale === 'zh') assertNoZhLeak(await documentText(page), 'zh voltage after update');
  }
  assert.deepEqual(
    pickOutputs(states.en, [
      'upperString',
      'lowerBranch',
      'flowInput',
      'flowAdc',
      'flowCode',
      'adcUtilization',
      'scalingRatio',
      'nominalAccuracy',
      'inputResolution',
      'dividerCurrent',
      'dividerPower',
      'firmwareCode'
    ]),
    pickOutputs(states.zh, [
      'upperString',
      'lowerBranch',
      'flowInput',
      'flowAdc',
      'flowCode',
      'adcUtilization',
      'scalingRatio',
      'nominalAccuracy',
      'inputResolution',
      'dividerCurrent',
      'dividerPower',
      'firmwareCode'
    ]),
    'voltage numeric outputs match across locales'
  );

  await page.goto(`${baseUrl}/zh/tools/voltage-sensing-adc-scaling/`, { waitUntil: 'domcontentloaded' });
  await setInput(page, 'maximumInputVoltage', 0);
  const invalidText = await page.locator('[data-error-for="maximumInputVoltage"]').textContent();
  assert.match(invalidText ?? '', /请输入大于 0 V 的电压/);
  assertNoZhLeak(await documentText(page), 'zh voltage invalid state');
}

async function assertRcTool(page) {
  const scenarios = [
    { name: 'default', values: {} },
    { name: 'weak', values: { filterCapacitancePf: 0.1 } },
    { name: 'slow', values: { filterCapacitancePf: 100000 } },
    { name: 'conflict', values: { signalFrequencyKhz: 100, noiseFrequencyMhz: 0.101, filterCapacitancePf: 10, maxAllowedSignalLossDb: 0.001, desiredNoiseAttenuationDb: 80 } }
  ];
  for (const scenario of scenarios) {
    const states = {};
    for (const locale of ['en', 'zh']) {
      await page.goto(`${baseUrl}/${locale}/tools/sensing-rc-filter-designer/`, { waitUntil: 'domcontentloaded' });
      for (const [name, value] of Object.entries(scenario.values)) await setInput(page, name, value);
      states[locale] = await outputMap(page);
      if (locale === 'zh') assertNoZhLeak(await documentText(page), `zh rc ${scenario.name}`);
    }
    assert.deepEqual(
      pickOutputs(states.en, [
        'sourceResistanceLabel',
        'sourceResistance',
        'cutoffFrequency',
        'tauSummary',
        'noiseAttenuation',
        'signalAttenuation',
        'signalPhase',
        'riseTime',
        'settlingTime',
        'totalResistance',
        'timeConstant',
        'settlingTimePoint1',
        'signalRatio',
        'noiseRatio',
        'signalToCutoff',
        'noiseToCutoff'
      ]),
      pickOutputs(states.zh, [
        'sourceResistanceLabel',
        'sourceResistance',
        'cutoffFrequency',
        'tauSummary',
        'noiseAttenuation',
        'signalAttenuation',
        'signalPhase',
        'riseTime',
        'settlingTime',
        'totalResistance',
        'timeConstant',
        'settlingTimePoint1',
        'signalRatio',
        'noiseRatio',
        'signalToCutoff',
        'noiseToCutoff'
      ]),
      `rc ${scenario.name} numeric outputs match`
    );
  }

  await page.goto(`${baseUrl}/zh/tools/sensing-rc-filter-designer/`, { waitUntil: 'domcontentloaded' });
  await setInput(page, 'filterCapacitancePf', 0);
  assert.match(await page.locator('[data-output="status"]').textContent(), /检查输入/);
  assertNoZhLeak(await documentText(page), 'zh rc invalid state');
}

async function documentText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function assertLlcTool(page) {
  const snapshots = {};
  for (const locale of ['en', 'zh']) {
    await page.goto(`${baseUrl}/${locale}/tools/llc-resonant-converter-designer/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#runBtn').click();
    await page.waitForFunction(() => document.querySelectorAll('#recommendBody tr.click-row').length > 0, null, { timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('#mFeasible')?.textContent?.trim() !== '—', null, { timeout: 30000 });

    await page.locator('.ratio-overview').nth(1).click();
    const activeRatio = normalize(await page.locator('.ratio-overview.active').textContent());
    await page.locator('#recommendBody tr.click-row').nth(1).click();
    const selected = normalize(await page.locator('#selectedPanel').textContent());
    await page.locator('#cornerBody tr').nth(1).click();
    await page.waitForTimeout(250);
    await page.locator('#curveBtn').click();
    await page.waitForFunction(() => (document.querySelector('#gainPlot')?.children.length ?? 0) > 4, null, { timeout: 30000 });

    const snapshot = await page.evaluate(() => ({
      total: document.querySelector('#mTotal')?.textContent?.trim(),
      feasible: document.querySelector('#mFeasible')?.textContent?.trim(),
      marginal: document.querySelector('#mMarginal')?.textContent?.trim(),
      failed: document.querySelector('#mFailed')?.textContent?.trim(),
      rows: Array.from(document.querySelectorAll('#recommendBody tr.click-row')).slice(0, 3).map((row) => Array.from(row.children).slice(0, 12).map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim().replace(/可行|Feasible/g, 'OK').replace(/临界|Marginal/g, 'WARN').replace(/失败|Failed/g, 'BAD').replace(/数值异常|Numerical issue/g, 'NUM'))),
      ratioCards: Array.from(document.querySelectorAll('.ratio-overview')).map((card) => card.textContent?.replace(/\s+/g, ' ').trim().replace(/可行\/临界|Feasible\/marginal/g, 'OK').replace(/最佳裕量|Best margin/g, 'M')),
      cornerRows: Array.from(document.querySelectorAll('#cornerBody tr')).map((row) => Array.from(row.children).map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim().replace(/通过|Pass/g, 'OK').replace(/高频降压|High-frequency buck/g, 'BUCK').replace(/低频升压|Low-frequency boost/g, 'BOOST').replace(/近谐振|Near resonance/g, 'RES'))),
      selectedPanel: document.querySelector('#selectedPanel')?.textContent?.replace(/\s+/g, ' ').trim().replace(/最差裕量|Worst margin/g, 'M').replace(/所需 fs|必需 fs|Required fs/g, 'FS').replace(/限制|Limit/g, 'L').replace(/最差 Ir,pk|Worst Ir,pk/g, 'IPK').replace(/最差 Ir,rms|Worst Ir,rms/g, 'IRMS').replace(/最差 VCr,pk|Worst VCr,pk/g, 'VCR').replace(/最小换流电流|Minimum commutation current|Min commutation/g, 'COMM').replace(/可行|Feasible/g, 'OK').replace(/9 个运行点均可达到，并具有正的最坏工况裕量。|All 9 operating points are reachable with positive worst-case margin.|所有运行点可达且裕量满足约束。|All operating points are reachable with positive constraint margin./g, 'PASS'),
      curveSummary: document.querySelector('#curveSummary')?.textContent?.replace(/\s+/g, ' ').trim(),
      gainChildren: document.querySelector('#gainPlot')?.children.length ?? 0,
      stateChildren: document.querySelector('#statePlot')?.children.length ?? 0,
      waveChildren: document.querySelector('#wavePlot')?.children.length ?? 0
    }));
    snapshots[locale] = { activeRatio, selected, snapshot };
    assert.equal(snapshot.total, String(llcBaseline.total));
    assert.ok(Number(snapshot.feasible) > 0);
    assert.ok(snapshot.gainChildren > 4);
    assert.ok(snapshot.stateChildren > 4);
    assert.ok(snapshot.waveChildren > 4);
    if (locale === 'zh') assertNoZhLeak(await documentText(page), 'zh llc after search');
  }

  assert.deepEqual(snapshots.en.snapshot.rows, snapshots.zh.snapshot.rows, 'llc recommended rows match');
  assert.deepEqual(snapshots.en.snapshot.ratioCards, snapshots.zh.snapshot.ratioCards, 'llc ratio summaries match');
  assert.deepEqual(snapshots.en.snapshot.cornerRows, snapshots.zh.snapshot.cornerRows, 'llc operating rows match');
  assert.equal(snapshots.en.snapshot.selectedPanel, snapshots.zh.snapshot.selectedPanel, 'llc selected design numerics match');
}

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    for (const locale of ['en', 'zh']) {
      for (const route of symmetricRoutes) await assertSymmetricRoute(page, viewport, locale, route);
    }

    await assertLanguageSwitchPreservesUrl(page, 'en', '/tools/sensing-rc-filter-designer/');
    await assertLanguageSwitchPreservesUrl(page, 'zh', '/tools/sensing-rc-filter-designer/');
    await assertArticleLocalization(page);

    if (viewport.name === 'desktop-1280') {
      await assertVoltageTool(page);
      await assertRcTool(page);
      await assertLlcTool(page);
    }

    await page.screenshot({ path: new URL(`bilingual-${viewport.name}.png`, outputDir).pathname, fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}
