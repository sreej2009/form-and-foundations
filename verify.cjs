// Run against npm run dev. Uses an existing Playwright installation without
// adding a browser-testing dependency to the production application.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync('artifacts', { recursive: true });
  async function at(time) {
    await page.evaluate(t => window.scrollTo(0, innerHeight * 6 * t), time);
    await page.waitForTimeout(2300);
    return page.evaluate(() => {
      const v = document.querySelector('video');
      const media = getComputedStyle(document.querySelector('.cinematic__media'));
      return { time: v.currentTime, duration: v.duration, pct: document.querySelector('.readout__value').textContent,
        scale: new DOMMatrix(media.transform).a, filter: media.filter,
        headline: [...document.querySelectorAll('.hero__line')].map(e => +getComputedStyle(e).opacity),
        cta: +getComputedStyle(document.querySelector('.hero__cta')).opacity,
        overflow: document.documentElement.scrollWidth > innerWidth,
        videoReady: v.readyState, videoOpacity: getComputedStyle(v).opacity,
        viewportTop: document.querySelector('.cinematic__viewport').getBoundingClientRect().top };
    });
  }
  for (const size of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size); await page.waitForTimeout(500);
    const start = await at(0);
    const mid = await at(0.5);
    assert(mid.time > start.time);
    const hold = await at(1.05);
    assert.equal(hold.pct, '100'); assert(Math.abs(hold.scale - 1) < 0.01); assert.equal(hold.cta, 0);
    const push = await at(1.5);
    assert(push.scale > hold.scale); assert.equal(push.time, hold.time); assert.equal(push.headline[0], 0);
    const settled = await at(1.88);
    assert.equal(settled.headline[0], 0);
    const hero = await at(2.194);
    assert(hero.cta > 0.99); assert(hero.headline.every(a => a > 0.99)); assert(!hero.overflow);
    assert.equal(hero.videoOpacity, '1'); assert(!hero.filter.includes('blur')); assert.equal(hero.time, hold.time);
    const bounds = await page.locator('.hero__title').boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= size.width + 1);
    await page.screenshot({ path: `artifacts/hero-${size.width}.png` });
    if (size.width === 390) {
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      await page.getByRole('navigation', { name: 'Mobile', exact: true }).getByRole('link', { name: 'Projects' }).click();
      await page.waitForTimeout(2400);
      assert.equal(await page.locator('.menu').getAttribute('data-open'), 'false');
      assert(await page.locator('#projects').evaluate(e => e.getBoundingClientRect().top >= 0));
    }
    await at(2.4);
    const reverseHold = await at(1.05);
    assert(Math.abs(reverseHold.scale - hold.scale) < 0.01); assert.equal(reverseHold.cta, 0);
    const reverseMid = await at(0.5);
    assert(Math.abs(reverseMid.time - mid.time) < 0.05);
    const reverseStart = await at(0);
    assert(reverseStart.time < 0.1);
    console.log(JSON.stringify({ size, hold, push, settled, hero, reverseMid }));
  }
  assert.deepEqual(errors, []);
  console.log('PASS: forward/reverse construction, 100% hold, camera settle, hero reveal, responsive layouts, mobile navigation, no runtime/console errors.');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
