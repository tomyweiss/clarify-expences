import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getDB } from './db';
import { withAuth } from './middleware/auth';
import {
  insertTransaction,
  applyCategorizationRules,
  getChromePath,
  getLaunchArgs,
  isHeadless,
  createScrapeEvent,
  updateScrapeEvent
} from './scraper-utils';

puppeteerExtra.use(StealthPlugin());

// --- Configuration ---
const ISRACARD_BASE = 'https://web.isracard.co.il';
const TRANSACTIONS_URL = (mm, yyyy, cardSuffix) =>
  `${ISRACARD_BASE}/transactions?monthAndYear=${mm}.${yyyy}&cardSuffix=${cardSuffix}`;

const SELECTORS = {
  passwordLoginToggle: 'a, button',
  passwordLoginToggleText: 'או כניסה עם סיסמה קבועה',
  idInput: 'input#otpLoginId_ID',
  card6Input: 'input#cardnum',
  passwordInput: 'input#otpLoginPwd',
  loginButton: 'button.btn-send',
};

const CURRENCY_MAP = { '₪': 'ILS', '$': 'USD', '€': 'EUR', '£': 'GBP' };

// --- Utility Functions ---

function getMonthRange(startDate) {
  const months = [];
  const start = new Date(startDate);
  const now = new Date();
  let year = start.getFullYear();
  let month = start.getMonth();
  while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
    months.push({
      month: String(month + 1).padStart(2, '0'),
      year: String(year),
    });
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  return months;
}

function parseDate(ddmmyy) {
  if (!ddmmyy || typeof ddmmyy !== 'string') return null;
  const parts = ddmmyy.split('.');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;
  return new Date(year, month, day);
}

function parseBillingDate(cellValue, monthContext, yearContext) {
  if (!cellValue) return null;
  const match = cellValue.match(/(\d{2})\.(\d{2})/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  return new Date(parseInt(yearContext, 10), month, day);
}

function parseCurrency(symbol) {
  if (!symbol) return 'ILS';
  const trimmed = symbol.trim();
  return CURRENCY_MAP[trimmed] || trimmed;
}

function parseInstallments(memo) {
  if (!memo) return null;
  const match = memo.match(/תשלום\s+(\d+)\s+מתוך\s+(\d+)/);
  if (!match) return null;
  return { number: parseInt(match[1], 10), total: parseInt(match[2], 10) };
}

function parseXlsx(buffer, monthContext, yearContext) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const allTransactions = [];
  let processedDate = null;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) continue;

    // Try to find billing date once per file if possible, or per sheet
    if (!processedDate) {
      const billingCell = sheet[XLSX.utils.encode_cell({ r: 5, c: 7 })]?.v || sheet[XLSX.utils.encode_cell({ r: 5, c: 0 })]?.v;
      if (billingCell) processedDate = parseBillingDate(String(billingCell), monthContext, yearContext);
    }

    const range = XLSX.utils.decode_range(sheet['!ref']);
    let isParsingTransactions = false;

    for (let r = 0; r <= range.e.r; r++) {
      const cellVal = sheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v;
      const nameVal = sheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v;
      
      // Header Detection: Look for 'Date' header in any row
      if (cellVal && typeof cellVal === 'string' && (cellVal.includes('תאריך רכישה') || cellVal.includes('תאריך העסקה'))) {
        isParsingTransactions = true;
        continue;
      }

      // Break condition for a specific block (Total row)
      if (!cellVal && nameVal && (typeof nameVal === 'string') && nameVal.includes('סה"כ')) {
        isParsingTransactions = false;
        continue;
      }

      if (!isParsingTransactions) continue;

      const dateVal = cellVal;
      if (!dateVal || typeof dateVal !== 'string' || !dateVal.includes('.')) continue;

      const originalAmount = sheet[XLSX.utils.encode_cell({ r, c: 2 })]?.v;
      const originalCurrency = sheet[XLSX.utils.encode_cell({ r, c: 3 })]?.v;
      const chargedAmount = sheet[XLSX.utils.encode_cell({ r, c: 4 })]?.v;
      const chargedCurrency = sheet[XLSX.utils.encode_cell({ r, c: 5 })]?.v;
      const voucherNumber = sheet[XLSX.utils.encode_cell({ r, c: 6 })]?.v || '';
      const memo = sheet[XLSX.utils.encode_cell({ r, c: 7 })]?.v || '';
      
      const parsedDate = parseDate(String(dateVal));
      if (!parsedDate || !nameVal) continue;

      allTransactions.push({
        identifier: String(voucherNumber),
        date: parsedDate.toISOString(),
        description: String(nameVal).trim(),
        originalAmount: -(chargedAmount || originalAmount || 0),
        installmentAmountPreAdjusted: true,
        originalCurrency: parseCurrency(originalCurrency),
        chargedCurrency: parseCurrency(chargedCurrency),
        processedDate: processedDate ? processedDate.toISOString().split('T')[0] : parsedDate.toISOString().split('T')[0],
        memo: String(memo).replace(/\n/g, ' ').trim(),
        type: 'normal',
        status: 'completed',
        category: undefined,
        installments: parseInstallments(String(memo)) || undefined,
      });
    }
  }

  return { processedDate, transactions: allTransactions };
}

async function waitForFile(dir, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('.'));
    if (files.length > 0) {
      const filePath = path.join(dir, files[0]);
      await new Promise(r => setTimeout(r, 1000));
      const buf = fs.readFileSync(filePath);
      fs.unlinkSync(filePath);
      return buf;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

async function login(page, credentials) {
  await page.goto('https://digital.isracard.co.il/personalarea/login', { waitUntil: 'networkidle2', timeout: 30000 });
  const clicked = await page.evaluate(async (text) => {
    const elements = document.querySelectorAll('a, button, span, div, label, p');
    let target = null;
    for (const el of elements) {
      if (el.textContent.includes(text)) target = el;
    }
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }, SELECTORS.passwordLoginToggleText);
  if (!clicked) throw new Error('Could not find password login toggle');
  await page.mouse.click(clicked.x, clicked.y);
  await new Promise(r => setTimeout(r, 3000));
  await page.waitForSelector(SELECTORS.passwordInput, { visible: true, timeout: 15000 });
  const fillField = async (selector, value, label) => {
    await page.waitForSelector(selector, { visible: true, timeout: 5000 });
    await page.click(selector, { clickCount: 3 });
    await new Promise(r => setTimeout(r, 300));
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await page.keyboard.press('Backspace');
    await new Promise(r => setTimeout(r, 200));
    await page.type(selector, String(value), { delay: 80 });
    await new Promise(r => setTimeout(r, 500));
  };
  await fillField(SELECTORS.idInput, credentials.id, 'ID');
  await fillField(SELECTORS.card6Input, credentials.card6Digits, 'Card 6 digits');
  await fillField(SELECTORS.passwordInput, credentials.password, 'Password');
  const loginBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button.btn-send'));
    return buttons.find(b => b.textContent.includes('כניסה לחשבון שלי'));
  });
  if (!loginBtn) throw new Error('Could not find login button');
  await loginBtn.click();
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
}

async function downloadCardXlsx(page, downloadDir) {
  const existing = fs.readdirSync(downloadDir).filter(f => f.endsWith('.xlsx'));
  for (const f of existing) fs.unlinkSync(path.join(downloadDir, f));
  const cdp = await page.target().createCDPSession();
  await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir });
  await new Promise(r => setTimeout(r, 2000));
  const dlCoordsFound = await page.evaluate(() => {
    const elements = document.querySelectorAll('a, button, span, div, label');
    let target = null;
    for (const el of elements) {
      if (el.textContent.includes('הורדה ל- Excel') || el.textContent.includes('הורדה ל-Excel')) target = el;
    }
    if (!target) return null;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  });
  if (!dlCoordsFound) { await cdp.detach(); return null; }
  await new Promise(r => setTimeout(r, 1500));
  const dlClickPos = await page.evaluate(() => {
    const elements = document.querySelectorAll('a, button, span, div, label');
    let target = null;
    for (const el of elements) {
      if (el.textContent.includes('הורדה ל- Excel') || el.textContent.includes('הורדה ל-Excel')) target = el;
    }
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  if (!dlClickPos) { await cdp.detach(); return null; }
  await page.mouse.click(dlClickPos.x, dlClickPos.y);
  const buffer = await waitForFile(downloadDir);
  await cdp.detach();
  return buffer;
}

async function scrapeCardMonth(page, month, year, cardSuffix, downloadDir) {
  const url = TRANSACTIONS_URL(month, year, cardSuffix);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const buffer = await downloadCardXlsx(page, downloadDir);
  if (!buffer) return [];
  const { transactions } = parseXlsx(buffer, month, year);
  return transactions;
}

// --- Main Scrape Function ---

async function performIsracardScrape(options, credentials) {
  const client = await getDB();
  let browser;
  let eventId;
  const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isracard-'));
  try {
    const cardSuffixes = options.cardSuffixes || [];
    eventId = await createScrapeEvent(client, 'isracard', options.startDate, credentials.nickname);
    browser = await puppeteerExtra.launch({
      headless: isHeadless(options),
      executablePath: getChromePath(),
      args: getLaunchArgs(),
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await login(page, credentials);
    const months = getMonthRange(options.startDate);
    let totalTransactions = 0;
    for (const cardSuffix of cardSuffixes) {
      for (const { month, year } of months) {
        try {
          const transactions = await scrapeCardMonth(page, month, year, cardSuffix, downloadDir);
          for (const txn of transactions) {
            await insertTransaction(txn, client, 'isracard', false, cardSuffix);
            totalTransactions++;
          }
        } catch (err) { console.error(`Error card ${cardSuffix} ${month}.${year}:`, err.message); }
      }
    }
    await applyCategorizationRules(client);
    const summary = `Scraped ${cardSuffixes.length} cards, ${totalTransactions} transactions across ${months.length} months`;
    await updateScrapeEvent(client, eventId, 'success', summary);
    return { success: true, transactionsCount: totalTransactions, cardCount: cardSuffixes.length, monthsCount: months.length };
  } catch (err) {
    if (eventId) {
      await updateScrapeEvent(client, eventId, 'failed', err.message || 'An unexpected error occurred during performIsracardScrape');
    }
    throw err;
  } finally {
    if (browser) await browser.close();
    try { fs.rmSync(downloadDir, { recursive: true, force: true }); } catch (e) {}
    client.release();
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  try {
    const { options, credentials } = req.body;
    if (!credentials.id || !credentials.password) return res.status(400).json({ message: 'ID and password are required' });
    const cardSuffixes = options.cardSuffixes || [];
    if (cardSuffixes.length === 0) return res.status(400).json({ message: 'At least one card suffix is required' });

    const result = await performIsracardScrape(options, credentials);
    if (result.success) {
      return res.status(200).json({ message: 'Isracard scraping completed successfully', ...result });
    } else {
      return res.status(500).json({ message: 'Isracard scraping failed', error: result.error });
    }
  } catch (error) {
    console.error('Isracard handler error:', error);
    res.status(500).json({ message: 'Failed to start Isracard scraping', error: error.message });
  }
}

export default withAuth(handler);
