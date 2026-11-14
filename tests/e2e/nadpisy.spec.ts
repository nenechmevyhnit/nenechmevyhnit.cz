import { test, expect, type Page } from '@playwright/test';

/** Nadpisy se čtou z HTML po načtení, před otevřením dalšího detailu klientským skriptem. */
const nadpisy = (page: Page) =>
  page.locator('h1').evaluateAll(els => els.map(e => e.textContent!.replace(/\s+/g, ' ').trim()));

const vzhledTitulku = (page: Page) =>
  page.locator('.hero .u2-titul').evaluate(e => {
    const s = getComputedStyle(e);
    return { velikost: s.fontSize, rodina: s.fontFamily, radek: s.lineHeight, tloustka: s.fontWeight };
  });

test('titulní stránka má jeden h1 a je to slogan archivu', async ({ page }) => {
  await page.goto('/');
  expect(await nadpisy(page)).toEqual(['Za půl roku si to jinak nikdo nebude pamatovat.']);
});

test('stránka kauzy má jeden h1 a je to název kauzy', async ({ page }) => {
  await page.goto('/kauzy/alfa-dotace/');
  expect(await nadpisy(page)).toEqual(['Testovací kauza Alfa']);
});

test('přehled pravidel má jeden h1 a je to otázka přehledu', async ({ page }) => {
  await page.goto('/pravidla/');
  expect(await nadpisy(page)).toEqual(['Komu prospívají nová pravidla?']);
});

test('stránka pravidla má jeden h1 a je to název pravidla', async ({ page }) => {
  await page.goto('/pravidla/zakon-omega/');
  expect(await nadpisy(page)).toEqual(['Testovací novela zákona Omega s dlouhým názvem pro mobil']);
});

test('stránka oblasti má jeden h1 a je to název oblasti', async ({ page }) => {
  await page.goto('/pravidla/oblasti/dotace-stret-zajmu/');
  expect(await nadpisy(page)).toEqual(['Dotace a střet zájmů']);
});

test('slogan na stránce kauzy zůstává vizuálně stejný jako na titulní', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const naTitulni = await vzhledTitulku(page);
  await page.goto('/kauzy/alfa-dotace/');
  await page.evaluate(() => document.fonts.ready);
  expect(await vzhledTitulku(page)).toEqual(naTitulni);
});
