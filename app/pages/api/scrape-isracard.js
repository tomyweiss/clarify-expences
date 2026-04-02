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
  createAuditEntry,
  updateAuditEntry,
  isHeadless
} from './scraper-utils';

puppeteerExtra.use(StealthPlugin());

// --- Configuration (adjust selectors after first manual test) ---
const ISRACARD_BASE = 'https://web.isracard.co.il';
const TRANSACTIONS_URL = (mm, yyyy, cardSuffix) =>
  `${ISRACARD_BASE}/transactions?monthAndYear=${mm}.${yyyy}&cardSuffix=${cardSuffix}`;

const SELECTORS = {
  // Login page: first click this link/button to switch to password login mode
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
  let month = start.getMonth(); // 0-indexed

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
  // Format: "לחיוב ב-DD.MM"
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
  // Match "תשלום X מתוך Y"
  const match = memo.match(/תשלום\s+(\d+)\s+מתוך\s+(\d+)/);
  if (!match) return null;
  return { number: parseInt(match[1], 10), total: parseInt(match[2], 10) };
}

function parseXlsx(buffer, monthContext, yearContext) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.find(n => n.includes('פירוט')) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet || !sheet['!ref']) {
    console.log(`Empty sheet in xlsx for ${monthContext}.${yearContext}`);
    return { processedDate: null, transactions: [] };
  }

  // Extract billing date from row 6 (0-indexed row 5), column H (col 7)
  const billingCell = sheet[XLSX.utils.encode_cell({ r: 5, c: 7 })]?.v
    || sheet[XLSX.utils.encode_cell({ r: 5, c: 0 })]?.v;
  const processedDate = parseBillingDate(billingCell, monthContext, yearContext);

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const transactions = [];

  // Find the header row (contains "תאריך רכישה")
  let dataStartRow = -1;
  for (let r = 0; r <= Math.min(range.e.r, 20); r++) {
    const cellVal = sheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v;
    if (cellVal && typeof cellVal === 'string' && cellVal.includes('תאריך רכישה')) {
      dataStartRow = r + 1;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.log(`Could not find header row in xlsx for ${monthContext}.${yearContext}`);
    return { processedDate, transactions: [] };
  }

  for (let r = dataStartRow; r <= range.e.r; r++) {
    const dateVal = sheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v;
    const nameVal = sheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v;

    // Stop at summary row
    if (!dateVal && nameVal && (typeof nameVal === 'string') && nameVal.includes('סה"כ')) break;
    // Skip empty rows
    if (!dateVal) continue;

    const originalAmount = sheet[XLSX.utils.encode_cell({ r, c: 2 })]?.v;
    const originalCurrency = sheet[XLSX.utils.encode_cell({ r, c: 3 })]?.v;
    const chargedAmount = sheet[XLSX.utils.encode_cell({ r, c: 4 })]?.v;
    const chargedCurrency = sheet[XLSX.utils.encode_cell({ r, c: 5 })]?.v;
    const voucherNumber = sheet[XLSX.utils.encode_cell({ r, c: 6 })]?.v || '';
    const memo = sheet[XLSX.utils.encode_cell({ r, c: 7 })]?.v || '';

    const installments = parseInstallments(memo);
    const parsedDate = parseDate(dateVal);

    if (!parsedDate || !nameVal) continue;

    transactions.push({
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
      installments: installments || undefined,
    });
  }

  return { processedDate, transactions };
}

// --- Browser Automation ---

async function waitForFile(dir, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.startsWith('.'));
    if (files.length > 0) {
      const filePath = path.join(dir, files[0]);
      // Wait a moment to ensure download is complete
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
  console.log('Navigating to Isracard login...');
  await page.goto('https://digital.isracard.co.il/personalarea/login', { waitUntil: 'networkidle2', timeout: 30000 });

  // First, click "או כניסה עם סיסמה קבועה" to switch to password login mode
  console.log('Looking for password login toggle...');
  const toggleText = SELECTORS.passwordLoginToggleText;

  // Find the element's bounding box and click its center coordinates
  // This simulates a real user click (mousedown+mouseup+click at coordinates)
  const clicked = await page.evaluate(async (text) => {
    const elements = document.querySelectorAll('a, button, span, div, label, p');
    // Find the innermost element whose own text matches (not just a parent container)
    let target = null;
    for (const el of elements) {
      if (el.textContent.includes(text)) {
        // Prefer the most specific (deepest) match
        target = el;
      }
    }
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }, toggleText);

  if (!clicked) throw new Error('Could not find password login toggle');

  // Click at the exact coordinates — fires real browser mouse events
  await page.mouse.click(clicked.x, clicked.y);
  console.log(`Clicked password login toggle at (${clicked.x}, ${clicked.y})`);
  await new Promise(r => setTimeout(r, 3000));

  // Wait for the password input to confirm we're on the right form
  await page.waitForSelector(SELECTORS.passwordInput, { visible: true, timeout: 15000 });
  console.log('Password login form is ready');

  // Fill each field: click to focus, clear, type with delays between fields
  const fillField = async (selector, value, label) => {
    await page.waitForSelector(selector, { visible: true, timeout: 5000 });
    await page.click(selector, { clickCount: 3 });
    await new Promise(r => setTimeout(r, 300));
    // Select all and delete to ensure field is empty
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await page.keyboard.press('Backspace');
    await new Promise(r => setTimeout(r, 200));
    await page.type(selector, String(value), { delay: 80 });
    console.log(`Filled ${label}`);
    await new Promise(r => setTimeout(r, 500));
  };

  await fillField(SELECTORS.idInput, credentials.id, 'ID');
  await fillField(SELECTORS.card6Input, credentials.card6Digits, 'Card 6 digits');
  await fillField(SELECTORS.passwordInput, credentials.password, 'Password');

  // Click login button ("כניסה לחשבון שלי", not "שלח קוד לנייד")
  const loginBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button.btn-send'));
    return buttons.find(b => b.textContent.includes('כניסה לחשבון שלי'));
  });
  if (!loginBtn) throw new Error('Could not find login button');
  await loginBtn.click();

  // Wait for navigation after login
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
  console.log('Login completed, current URL:', page.url());

  // Verify we're not still on the login page
  const currentUrl = page.url();
  if (currentUrl.includes('login') || currentUrl.includes('Login')) {
    throw new Error('Login appears to have failed - still on login page');
  }
}

async function downloadCardXlsx(page, downloadDir) {
  // Clear any existing files in download dir
  const existing = fs.readdirSync(downloadDir).filter(f => f.endsWith('.xlsx'));
  for (const f of existing) fs.unlinkSync(path.join(downloadDir, f));

  // Set up CDP download
  const cdp = await page.target().createCDPSession();
  await cdp.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir,
  });

  // Brief wait for page data to render
  await new Promise(r => setTimeout(r, 2000));

  // Scroll the download button into view, then get its coordinates
  const dlCoords = await page.evaluate(() => {
    const elements = document.querySelectorAll('a, button, span, div, label');
    let target = null;
    for (const el of elements) {
      if (el.textContent.includes('הורדה ל- Excel') || el.textContent.includes('הורדה ל-Excel')) {
        target = el;
      }
    }
    if (!target) return null;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  });

  if (!dlCoords) {
    console.log('No download button found on this page, skipping');
    await cdp.detach();
    return null;
  }

  // Wait for scroll to finish
  await new Promise(r => setTimeout(r, 1500));

  // Now get coordinates after scrolling
  const dlClickPos = await page.evaluate(() => {
    const elements = document.querySelectorAll('a, button, span, div, label');
    let target = null;
    for (const el of elements) {
      if (el.textContent.includes('הורדה ל- Excel') || el.textContent.includes('הורדה ל-Excel')) {
        target = el;
      }
    }
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });

  if (!dlClickPos) {
    console.log('No download button found after scroll, skipping');
    await cdp.detach();
    return null;
  }

  await page.mouse.click(dlClickPos.x, dlClickPos.y);
  console.log(`Clicked download button at (${dlClickPos.x}, ${dlClickPos.y}), waiting for file...`);

  const buffer = await waitForFile(downloadDir);
  await cdp.detach();

  if (!buffer) {
    console.log('Download timed out');
    return null;
  }

  console.log(`Downloaded xlsx: ${buffer.length} bytes`);
  return buffer;
}

async function scrapeCardMonth(page, month, year, cardSuffix, downloadDir) {
  const url = TRANSACTIONS_URL(month, year, cardSuffix);
  console.log(`Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for page data to render
  await new Promise(r => setTimeout(r, 2000));

  const buffer = await downloadCardXlsx(page, downloadDir);
  if (!buffer) return [];

  const { transactions } = parseXlsx(buffer, month, year);
  console.log(`Parsed ${transactions.length} transactions for card ${cardSuffix} ${month}.${year}`);
  return transactions;
}

// --- Background scrape job ---

async function runIsracardScrapeInBackground(options, credentials, auditId) {
  const client = await getDB();
  let browser;
  const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isracard-'));

  try {
    const cardSuffixes = options.cardSuffixes || [];

    // Launch browser
    browser = await puppeteerExtra.launch({
      headless: isHeadless(options),
      executablePath: getChromePath(),
      args: getLaunchArgs(),
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Login
    await login(page, credentials);

    // Calculate month range
    const months = getMonthRange(options.startDate);
    console.log(`Scraping ${cardSuffixes.length} cards x ${months.length} months`);
    console.log(`Cards: ${cardSuffixes.join(', ')}`);
    console.log(`Months: ${months.map(m => `${m.month}.${m.year}`).join(', ')}`);

    let totalTransactions = 0;

    // Scrape each card x month combination
    for (const cardSuffix of cardSuffixes) {
      for (const { month, year } of months) {
        try {
          const transactions = await scrapeCardMonth(page, month, year, cardSuffix, downloadDir);

          for (const txn of transactions) {
            await insertTransaction(txn, client, 'isracard', false);
            totalTransactions++;
          }
        } catch (err) {
          console.error(`Error scraping card ${cardSuffix} ${month}.${year}:`, err.message);
          // Continue to next
        }
      }
    }

    await applyCategorizationRules(client);

    const message = `Success: cards=${cardSuffixes.length}, months=${months.length}, transactions=${totalTransactions}`;
    console.log(message);
    await updateAuditEntry(client, auditId, 'success', message);
  } catch (error) {
    console.error('Background Isracard scraping failed:', error);
    try {
      await updateAuditEntry(client, auditId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    } catch (e) {
      // noop
    }
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) { /* noop */ }
    }
    try {
      fs.rmSync(downloadDir, { recursive: true, force: true });
    } catch (e) { /* noop */ }
    client.release();
  }
}

// --- Handler ---

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = await getDB();
  try {
    const { options, credentials } = req.body;

    // Validate credentials synchronously before responding
    if (!credentials.id || !credentials.password) {
      client.release();
      return res.status(400).json({ message: 'ID and password are required for Isracard scraping' });
    }

    const cardSuffixes = options.cardSuffixes || [];
    if (cardSuffixes.length === 0) {
      client.release();
      return res.status(400).json({ message: 'At least one card suffix is required for Isracard scraping' });
    }

    // Create audit entry so the client can track progress
    const triggeredBy = credentials.id || credentials.nickname || 'unknown';
    const auditId = await createAuditEntry(client, triggeredBy, 'isracard', options.startDate);

    // Release validation connection
    client.release();

    // Respond immediately — scraping runs in the background
    res.status(202).json({
      message: 'Isracard scraping started in background',
      auditId,
      vendor: 'isracard',
    });

    // Fire and forget
    runIsracardScrapeInBackground(options, credentials, auditId).catch(err => {
      console.error('Unhandled background Isracard scrape error:', err);
    });

  } catch (error) {
    console.error('Isracard handler error:', error);
    client.release();
    res.status(500).json({
      message: 'Failed to start Isracard scraping',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withAuth(handler);

