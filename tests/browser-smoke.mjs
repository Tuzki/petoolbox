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
  { name: 'mobile-390', width: 390, height: 844 }
];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });

    for (const locale of ['en', 'zh']) {
      await page.goto(`${baseUrl}/${locale}/`, { waitUntil: 'domcontentloaded' });
      const home = await page.evaluate((activeLocale) => ({
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
        lang: document.documentElement.lang,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        navLinks: Array.from(document.querySelectorAll('.site-nav__link')).map((link) => link.getAttribute('href')),
        activeLanguage: document.querySelector('.language-link--active')?.textContent?.trim(),
        switchHref: Array.from(document.querySelectorAll('.site-header__language a')).map((link) => link.getAttribute('href'))[0],
        cards: document.querySelectorAll('[data-tool-card]').length,
        availableCards: document.querySelectorAll('[data-tool-status="available"]').length,
        body: document.body.textContent ?? '',
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
        alternateCount: document.querySelectorAll('link[rel="alternate"]').length,
        localizedArticleLinks: Array.from(document.querySelectorAll('a')).filter((link) => link.getAttribute('href')?.startsWith(`/${activeLocale}/articles/`)).length
      }), locale);

      assert.equal(home.noOverflow, true, `${viewport.name} ${locale} home overflow`);
      assert.equal(home.lang, locale === 'zh' ? 'zh-CN' : 'en');
      assert.match(home.canonical ?? '', new RegExp(`/${locale}/$`));
      assert.equal(home.alternateCount, 3);
      assert.equal(home.cards, 19);
      assert.equal(home.availableCards, 3);
      assert.ok(home.navLinks.every((href) => href?.startsWith(`/${locale}/`)), `${locale} nav links localized`);
      assert.ok(home.localizedArticleLinks >= 1, `${locale} article links localized`);
      if (locale === 'en') {
        assert.equal(home.h1, 'Design power converters faster.');
        assert.equal(home.activeLanguage, 'EN');
        assert.equal(home.switchHref, '/zh/');
        assert.match(home.body, /Engineering Calculators/);
      } else {
        assert.equal(home.h1, '更快完成电源变换器设计。');
        assert.equal(home.activeLanguage, '中文');
        assert.equal(home.switchHref, '/en/');
        assert.match(home.body, /工程计算工具/);
        assert.equal(home.body.includes('Chinese version coming soon'), false);
      }

      await page.goto(`${baseUrl}/${locale}/tools/voltage-sensing-adc-scaling/`, { waitUntil: 'domcontentloaded' });
      const voltage = await page.evaluate(() => ({
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        vin: document.querySelector('[data-input="maximumInputVoltage"]')?.value,
        upperString: document.querySelector('[data-output="upperString"]')?.textContent?.trim() ?? '',
        flowCode: document.querySelector('[data-output="flowCode"]')?.textContent?.trim() ?? '',
        checks: document.querySelectorAll('.engineering-check').length,
        firmwareCode: document.querySelector('[data-output="firmwareCode"]')?.textContent ?? '',
        switchHref: document.querySelector('.site-header__language a')?.getAttribute('href')
      }));
      assert.equal(voltage.noOverflow, true, `${viewport.name} ${locale} voltage overflow`);
      assert.match(voltage.h1, locale === 'zh' ? /电压采样/ : /Voltage Sensing/);
      assert.equal(voltage.vin, '800');
      assert.match(voltage.upperString, /6 × /);
      assert.match(voltage.flowCode, /\d+ \/ 1023/);
      assert.equal(voltage.checks, 4);
      assert.match(voltage.firmwareCode, /VIN_PER_COUNT/);
      assert.equal(voltage.switchHref, `/${locale === 'en' ? 'zh' : 'en'}/tools/voltage-sensing-adc-scaling/`);

      await page.locator('[data-input="maximumInputVoltage"]').fill('400');
      const updatedFlow = await page.locator('[data-output="flowInput"]').textContent();
      assert.match(updatedFlow ?? '', /400/);

      await page.goto(`${baseUrl}/${locale}/tools/sensing-rc-filter-designer/`, { waitUntil: 'domcontentloaded' });
      const rc = await page.evaluate(() => ({
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        status: document.querySelector('[data-output="status"]')?.textContent?.trim() ?? '',
        cutoff: document.querySelector('[data-output="cutoffFrequency"]')?.textContent?.trim() ?? '',
        magnitudePixels: (() => {
          const canvas = document.querySelector('[data-chart="magnitude"]');
          if (!(canvas instanceof HTMLCanvasElement)) return 0;
          const data = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
          if (!data) return 0;
          let count = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) count += 1;
          }
          return count;
        })()
      }));
      assert.equal(rc.noOverflow, true, `${viewport.name} ${locale} rc overflow`);
      assert.match(rc.h1, locale === 'zh' ? /采样 RC/ : /Sensing RC/);
      assert.ok(rc.status.length > 0);
      assert.match(rc.cutoff, /Hz/);
      assert.ok(rc.magnitudePixels > 1000, `${viewport.name} ${locale} rc chart rendered`);

      await page.goto(`${baseUrl}/${locale}/tools/llc-resonant-converter-designer/`, { waitUntil: 'domcontentloaded' });
      const llc = await page.evaluate(() => ({
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        total: document.querySelector('#mTotal')?.textContent?.trim(),
        ratioPills: Array.from(document.querySelectorAll('.llc-ratio-pill')).map((pill) => pill.textContent?.trim()),
        hasRunButton: Boolean(document.querySelector('#runBtn')),
        body: document.body.textContent ?? ''
      }));
      assert.equal(llc.noOverflow, true, `${viewport.name} ${locale} llc overflow`);
      assert.match(llc.h1, locale === 'zh' ? /LLC 谐振/ : /LLC Resonant/);
      assert.equal(llc.total, String(llcBaseline.total));
      assert.equal(llc.ratioPills.length, 5);
      assert.equal(llc.hasRunButton, true);
      assert.match(llc.body, locale === 'zh' ? /设计规格/ : /Specifications/);
    }

    await page.goto(`${baseUrl}/en/articles/buck-inductor-selection/`, { waitUntil: 'domcontentloaded' });
    const article = await page.evaluate(() => ({
      noOverflow: document.documentElement.scrollWidth <= innerWidth,
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      toolLinks: Array.from(document.querySelectorAll('a')).filter((link) => /Output Capacitor Calculator|Buck Converter Designer/.test(link.textContent ?? '')).length
    }));
    assert.equal(article.noOverflow, true, `${viewport.name} article overflow`);
    assert.equal(article.h1, 'How to Select an Inductor for a Buck Converter');
    assert.equal(article.toolLinks, 0);

    await page.screenshot({ path: new URL(`bilingual-${viewport.name}.png`, outputDir).pathname, fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}
