import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const dist = join(root, 'dist');
const vercelConfig = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const locales = ['en', 'zh'];
const formalRoutes = [
  '',
  'tools',
  'tools/voltage-sensing-adc-scaling',
  'tools/sensing-rc-filter-designer',
  'tools/shunt-current-sensing-evaluator',
  'tools/gate-resistor-power-stress-evaluator',
  'tools/rc-snubber-first-pass-designer',
  'tools/llc-resonant-converter-designer',
  'topology-designers',
  'magnetics',
  'control',
  'simulation',
  'articles',
  'articles/nvidia-800v-power-architecture',
  'feedback',
  'about'
];

function pagePath(locale, route) {
  return join(dist, locale, route, 'index.html');
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function mainHtml(html) {
  return html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
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

test('root path uses Vercel HTTP redirect to English', () => {
  assert.deepEqual(
    vercelConfig.redirects?.find((redirect) => redirect.source === '/'),
    { source: '/', destination: '/en/', permanent: false }
  );
});

test('robots advertises public sitemap on the canonical domain', () => {
  const robots = read(join(dist, 'robots.txt'));
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/www\.petoolbox\.tech\/sitemap-index\.xml/);
  assert.equal(robots.includes('Disallow: /'), false);
});

test('sitemap uses canonical domain and excludes draft or retired launch content', () => {
  const sitemap = read(join(dist, 'sitemap-index.xml'));
  for (const route of [
    '/en/',
    '/zh/',
    '/en/tools/',
    '/zh/tools/',
    '/en/articles/',
    '/zh/articles/',
    '/en/feedback/',
    '/zh/feedback/',
    '/en/articles/nvidia-800v-power-architecture/',
    '/zh/articles/nvidia-800v-power-architecture/',
    '/en/tools/llc-resonant-converter-designer/',
    '/zh/tools/llc-resonant-converter-designer/',
    '/en/tools/voltage-sensing-adc-scaling/',
    '/zh/tools/voltage-sensing-adc-scaling/',
    '/en/tools/sensing-rc-filter-designer/',
    '/zh/tools/sensing-rc-filter-designer/',
    '/en/tools/shunt-current-sensing-evaluator/',
    '/zh/tools/shunt-current-sensing-evaluator/',
    '/en/tools/gate-resistor-power-stress-evaluator/',
    '/zh/tools/gate-resistor-power-stress-evaluator/'
    ,'/en/tools/rc-snubber-first-pass-designer/'
    ,'/zh/tools/rc-snubber-first-pass-designer/'
  ]) {
    assert.match(sitemap, new RegExp(`https://www\\.petoolbox\\.tech${route}`));
  }
  for (const term of ['https://petoolbox.tech/', 'draft-hidden-test', 'buck-inductor-selection', 'rc-time-constant', 'voltage-divider', 'buck-inductor-ripple', 'petoolbox-git', 'petoolbox.vercel.app']) {
    assert.equal(sitemap.includes(term), false, `sitemap should not include ${term}`);
  }
});

test('legacy routes are noindex redirects to English', () => {
  for (const route of ['tools', 'articles', 'about', 'tools/voltage-sensing-adc-scaling', 'tools/shunt-current-sensing-evaluator', 'tools/gate-resistor-power-stress-evaluator', 'tools/rc-snubber-first-pass-designer']) {
    const html = read(join(dist, route, 'index.html'));
    assert.match(html, /noindex, follow/);
    assert.match(html, /url=\/en\//);
  }
});

test('html lang and SEO alternates are emitted per locale', () => {
  for (const locale of locales) {
    const html = read(pagePath(locale, 'tools/voltage-sensing-adc-scaling'));
    assert.match(html, new RegExp(`<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}"`));
    assert.match(html, new RegExp(`<link rel="canonical" href="https://www.petoolbox.tech/${locale}/tools/voltage-sensing-adc-scaling/"`));
    assert.match(html, /hreflang="en" href="https:\/\/www\.petoolbox\.tech\/en\/tools\/voltage-sensing-adc-scaling\/"/);
    assert.match(html, /hreflang="zh-CN" href="https:\/\/www\.petoolbox\.tech\/zh\/tools\/voltage-sensing-adc-scaling\/"/);
    assert.match(html, /hreflang="x-default" href="https:\/\/www\.petoolbox\.tech\/en\/tools\/voltage-sensing-adc-scaling\/"/);
  }
});

test('published tool pages have localized title and meta description', () => {
  const cases = [
    {
      locale: 'en',
      route: 'tools/llc-resonant-converter-designer',
      title: 'LLC Resonant Converter Designer | PE Toolbox',
      description: 'Design LLC resonant converters from input/output specifications, transformer ratio, resonant tank parameters, gain limits, and operating-point constraints.'
    },
    {
      locale: 'en',
      route: 'tools/voltage-sensing-adc-scaling',
      title: 'Voltage Sensing and ADC Scaling Calculator | PE Toolbox',
      description: 'Calculate resistor divider values, ADC input range, measurement resolution, voltage stress, and tolerance impact for high-voltage sensing circuits.'
    },
    {
      locale: 'en',
      route: 'tools/sensing-rc-filter-designer',
      title: 'Sensing RC Filter Designer | PE Toolbox',
      description: 'Design RC input filters for sensing and ADC interfaces, including cutoff frequency, settling behavior, source impedance, and sampling constraints.'
    },
    {
      locale: 'en',
      route: 'tools/shunt-current-sensing-evaluator',
      title: 'Shunt Current Sensing Evaluator | PE Toolbox',
      description: 'Evaluate shunt resistor current sensing circuits, including sense voltage, power loss, amplifier output range, resolution, and thermal stress.'
    },
    {
      locale: 'en',
      route: 'tools/gate-resistor-power-stress-evaluator',
      title: 'Gate Resistor Power and Stress Evaluator | PE Toolbox',
      description: 'Estimate gate resistor average power, pulse energy, peak stress, package margin, and parallel resistor sharing for power switch gate-drive design.'
    },
    {
      locale: 'zh',
      route: 'tools/llc-resonant-converter-designer',
      title: 'LLC 谐振变换器设计器 | PE Toolbox',
      description: '根据输入输出规格、变压器匝比、谐振腔参数、增益限制和运行点约束，评估 LLC 谐振变换器设计方案。'
    },
    {
      locale: 'zh',
      route: 'tools/voltage-sensing-adc-scaling',
      title: '电压采样与 ADC 量程计算器 | PE Toolbox',
      description: '计算高压采样分压电阻、ADC 输入范围、测量分辨率、电阻耐压、功耗和误差影响。'
    },
    {
      locale: 'zh',
      route: 'tools/sensing-rc-filter-designer',
      title: '采样 RC 滤波器设计器 | PE Toolbox',
      description: '用于传感与 ADC 接口的 RC 输入滤波器设计，评估截止频率、建立时间、源阻抗和采样约束。'
    },
    {
      locale: 'zh',
      route: 'tools/shunt-current-sensing-evaluator',
      title: '分流电阻电流采样评估器 | PE Toolbox',
      description: '评估分流电阻电流采样电路的采样电压、功耗、放大器输出范围、分辨率和热应力。'
    },
    {
      locale: 'zh',
      route: 'tools/gate-resistor-power-stress-evaluator',
      title: '栅极电阻功率与应力评估器 | PE Toolbox',
      description: '估算功率器件栅极驱动电阻的平均功率、脉冲能量、峰值应力、封装余量和并联分流情况。'
    }
  ];

  for (const item of cases) {
    const html = read(pagePath(item.locale, item.route));
    assert.ok(html.includes(`<title>${item.title}</title>`), `${item.locale}/${item.route} title`);
    assert.ok(html.includes(`<meta name="description" content="${item.description}"`), `${item.locale}/${item.route} description`);
  }
});

test('shunt current sensing page has localized copy and expected controls', () => {
  const enHtml = read(pagePath('en', 'tools/shunt-current-sensing-evaluator'));
  const zhHtml = read(pagePath('zh', 'tools/shunt-current-sensing-evaluator'));

  assert.match(enHtml, /Shunt Current Sensing Evaluator/);
  assert.equal(/[\u4e00-\u9fff]/.test(enHtml.replaceAll('中文', '')), false);
  assert.match(zhHtml, /分流电阻电流采样评估器/);
  for (const term of ['Design needs review', 'Current Condition', 'Power per shunt']) {
    assert.equal(zhHtml.includes(term), false, `zh shunt page leaked "${term}"`);
  }
  assert.match(enHtml, /data-input="resistancePerShuntMohm"[^>]*step="0.1"/);
  assert.match(enHtml, /data-input="ratedPowerPerShuntW"[^>]*step="0.1"/);
  assert.match(enHtml, /data-input="csaGain"[^>]*step="1"/);
  assert.match(enHtml, /0.500 mΩ/);
  assert.match(enHtml, /50.0 mV/);
  assert.match(enHtml, /80.6 mA\/LSB/);
});

test('gate resistor stress page has localized copy and constrained controls', () => {
  const enHtml = read(pagePath('en', 'tools/gate-resistor-power-stress-evaluator'));
  const zhHtml = read(pagePath('zh', 'tools/gate-resistor-power-stress-evaluator'));

  assert.match(enHtml, /Gate Resistor Power and Stress Evaluator/);
  assert.match(enHtml, /typical screening value/);
  assert.equal(/[\u4e00-\u9fff]/.test(enHtml.replaceAll('中文', '')), false);
  assert.match(zhHtml, /栅极电阻功率与应力评估器/);
  assert.match(zhHtml, /典型筛选值/);
  for (const term of ['Design Inputs', 'Average Power OK', 'Switching frequency', 'Loss Distribution']) {
    assert.equal(zhHtml.includes(term), false, `zh gate page leaked "${term}"`);
  }
  assert.match(enHtml, /data-input="totalGateChargeNc"[^>]*step="0.1"/);
  assert.match(enHtml, /data-input="equivalentGateCapacitanceNf"[^>]*step="0.1"/);
  assert.match(enHtml, /data-input="switchingFrequencyKhz"[^>]*step="1"/);
  assert.match(enHtml, /value="200"/);
  assert.doesNotMatch(enHtml, /value="220"/);
  assert.match(enHtml, /172.20 mW/);
  assert.match(enHtml, /1.722 µJ/);
  assert.match(enHtml, /8.20 mA/);
});

test('language switch links keep the current path', () => {
  const enHtml = read(pagePath('en', 'articles/nvidia-800v-power-architecture'));
  const zhHtml = read(pagePath('zh', 'articles/nvidia-800v-power-architecture'));
  assert.match(enHtml, /href="\/zh\/articles\/nvidia-800v-power-architecture\/"/);
  assert.match(zhHtml, /href="\/en\/articles\/nvidia-800v-power-architecture\/"/);
});

test('internal links stay within the active locale', () => {
  const enHtml = read(pagePath('en', ''));
  const zhHtml = read(pagePath('zh', ''));
  assert.match(enHtml, /href="\/en\/tools\/"/);
  assert.match(enHtml, /href="\/en\/articles\/nvidia-800v-power-architecture\/"/);
  assert.match(enHtml, /href="\/en\/feedback\/"/);
  assert.match(zhHtml, /href="\/zh\/tools\/"/);
  assert.match(zhHtml, /href="\/zh\/articles\/nvidia-800v-power-architecture\/"/);
  assert.match(zhHtml, /href="\/zh\/feedback\/"/);
});

test('feedback pages publish the launch email contact', () => {
  const enHtml = read(pagePath('en', 'feedback'));
  const zhHtml = read(pagePath('zh', 'feedback'));

  assert.match(enHtml, /<h1 id="feedback-title">Feedback<\/h1>/);
  assert.match(enHtml, /chris\.hutao@gmail\.com/);
  assert.match(enHtml, /mailto:chris\.hutao@gmail\.com\?subject=PE%20Toolbox%20Feedback/);
  assert.match(enHtml, /Suggested information to include/);
  assert.match(zhHtml, /<h1 id="feedback-title">反馈<\/h1>/);
  assert.match(zhHtml, /chris\.hutao@gmail\.com/);
  assert.match(zhHtml, /mailto:chris\.hutao@gmail\.com\?subject=PE%20Toolbox%20Feedback/);
  assert.match(zhHtml, /建议反馈内容包括/);
  for (const html of [enHtml, zhHtml]) {
    assert.equal(html.includes('published contact channel once it is available'), false);
    assert.equal(html.includes('后续公布的联系渠道反馈'), false);
    assert.equal(/github\.com\/[^"]*issues/i.test(html), false);
  }
});

test('public pages do not expose the project repository link', () => {
  for (const route of ['', 'about', 'feedback', 'tools', 'articles']) {
    for (const locale of locales) {
      const html = read(pagePath(locale, route));
      assert.equal(html.includes('github.com/Tuzki/petoolbox'), false, `/${locale}/${route} should not link to the project repository`);
    }
  }
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
  assert.equal(existsSync(join(dist, 'en', 'articles', 'buck-inductor-selection', 'index.html')), false);
  assert.equal(existsSync(join(dist, 'zh', 'articles', 'buck-inductor-selection', 'index.html')), false);
});

test('localized visible content is present', () => {
  const enHtml = read(pagePath('en', ''));
  const zhHtml = read(pagePath('zh', ''));
  const enMain = mainHtml(enHtml);
  const zhMain = mainHtml(zhHtml);

  assert.match(enMain, /Power Electronics Design Tools/);
  assert.match(enMain, /Browser-based calculators, design workflows, and engineering notes/);
  for (const term of ['power electronics', 'design tools', 'calculators', 'LLC Resonant Converter Designer', 'Shunt Current Sensing Evaluator', 'Gate Resistor Power and Stress Evaluator']) {
    assert.match(enMain, new RegExp(term.replaceAll('&', '&amp;'), 'i'));
  }
  assert.match(enMain, /Featured Tools/);
  assert.match(enMain, /Latest Article/);
  assert.match(enMain, /NVIDIA 800V Power Architecture/);
  assert.equal(enMain.includes('directory-card--coming-soon'), false);
  assert.equal(enMain.includes('tool-filter'), false);

  assert.match(zhMain, /电力电子设计工具/);
  assert.match(zhMain, /浏览器端计算器、设计流程与工程笔记/);
  for (const term of ['电力电子', '设计工具', '计算器', 'LLC 谐振变换器', '电流采样', '栅极电阻']) {
    assert.match(zhMain, new RegExp(term));
  }
  assert.match(zhMain, /可用工具/);
  assert.match(zhMain, /最新文章/);
  assert.match(zhMain, /英伟达 800V 电源体系/);
  assert.equal(zhMain.includes('directory-card--coming-soon'), false);
  assert.equal(zhMain.includes('tool-filter'), false);
  assert.equal(zhHtml.includes('Chinese version coming soon'), false);
});

test('article chrome uses localized category and toc labels', () => {
  const enIndex = read(pagePath('en', 'articles'));
  const zhIndex = read(pagePath('zh', 'articles'));
  const enArticle = read(pagePath('en', 'articles/nvidia-800v-power-architecture'));
  const zhArticle = read(pagePath('zh', 'articles/nvidia-800v-power-architecture'));

  assert.match(enIndex, /Engineering Articles/);
  assert.match(enIndex, /NVIDIA 800V Power Architecture/);
  assert.equal(enIndex.includes('How to Select an Inductor for a Buck Converter'), false);
  assert.equal(enIndex.includes('converter design'), false);
  assert.match(zhIndex, /工程文章/);
  assert.match(zhIndex, /英伟达 800V 电源体系/);
  assert.equal(zhIndex.includes('如何为 Buck 变换器选择电感'), false);
  assert.equal(zhIndex.includes('converter design'), false);

  assert.match(enArticle, /On this page/);
  assert.match(enArticle, /Engineering Articles/);
  assert.match(zhArticle, /本文目录/);
  assert.match(zhArticle, /aria-label="本文目录"/);
  assert.equal(zhArticle.includes('On this page'), false);
  assert.match(zhArticle, /工程文章/);
});

test('footer tagline punctuation is localized', () => {
  const enHtml = read(pagePath('en', ''));
  const zhHtml = read(pagePath('zh', ''));
  const zhArticle = read(pagePath('zh', 'articles/nvidia-800v-power-architecture'));

  assert.match(enHtml, /Practical tools for power electronics engineers\./);
  assert.match(zhHtml, /面向电力电子工程师的实用设计工具。/);
  assert.match(zhArticle, /面向电力电子工程师的实用设计工具。/);
  assert.equal(zhHtml.includes('面向电力电子工程师的实用设计工具.'), false);
  assert.equal(zhArticle.includes('面向电力电子工程师的实用设计工具.'), false);
});
