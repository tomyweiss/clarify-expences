import crypto from 'crypto';

export async function insertTransaction(txn, client, companyId, isBank, accountNumber) {
  const uniqueId = `${txn.identifier}-${companyId}-${txn.processedDate}-${txn.description}`;
  const hash = crypto.createHash('sha1');
  hash.update(uniqueId);
  txn.identifier = hash.digest('hex');

  // For installment transactions, use per-installment amount and billing date
  const hasInstallments = txn.installments?.total && txn.installments.total > 1;
  if (hasInstallments) {
    // Only divide amount if not already per-installment (e.g. Isracard xlsx already provides charged amount)
    if (!txn.installmentAmountPreAdjusted) {
      txn.originalAmount = txn.originalAmount / txn.installments.total;
    }
    if (txn.processedDate) {
      txn.date = txn.processedDate;
    }
    txn.description = `${txn.description} (${txn.installments.number}/${txn.installments.total})`;
  }

  let amount = txn.originalAmount;
  let category = txn.category;
  if (!isBank){
    amount = txn.originalAmount * -1;
  }else{
    category = "Bank";
  }

  try {
    await client.query(
      `INSERT INTO transactions (
        identifier,
        vendor,
        date,
        name,
        price,
        category,
        type,
        processed_date,
        original_amount,
        original_currency,
        charged_currency,
        memo,
        status,
        installments_number,
        installments_total,
        account_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (identifier, vendor) DO NOTHING`,
      [
        txn.identifier,
        companyId,
        new Date(txn.date),
        txn.description,
        amount,
        category || 'N/A',
        txn.type,
        txn.processedDate,
        txn.originalAmount,
        txn.originalCurrency,
        txn.chargedCurrency,
        txn.memo,
        txn.status,
        txn.installments?.number,
        txn.installments?.total,
        accountNumber
      ]
    );
  } catch (error) {
    console.error("Error inserting transaction:", error);
    throw error;
  }
}

export async function applyCategorizationRules(client) {
  try {
    const rulesResult = await client.query(`
      SELECT id, name_pattern, target_category
      FROM categorization_rules
      WHERE is_active = true
      ORDER BY id
    `);

    const rules = rulesResult.rows;
    let totalUpdated = 0;

    for (const rule of rules) {
      const pattern = `%${rule.name_pattern}%`;
      const updateResult = await client.query(`
        UPDATE transactions
        SET category = $2
        WHERE LOWER(name) LIKE LOWER($1)
        AND category != $2
        AND category IS NOT NULL
        AND category != 'Bank'
        AND category != 'Income'
      `, [pattern, rule.target_category]);

      totalUpdated += updateResult.rowCount;
    }

    console.log(`Applied ${rules.length} rules to ${totalUpdated} transactions`);
    return { rulesApplied: rules.length, transactionsUpdated: totalUpdated };
  } catch (error) {
    console.error('Error applying categorization rules:', error);
    throw error;
  }
}

export function getChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const platform = process.platform;
  if (platform === 'linux') {
    return '/usr/bin/chromium';
  } else if (platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  return undefined;
}

export function getLaunchArgs() {
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--window-size=1920,1080',
  ];
}

export function isHeadless(options) {
  if (options && typeof options.showBrowser !== 'undefined') {
    return !options.showBrowser;
  }
  return process.env.SCRAPE_HEADLESS !== 'false';
}

export async function createScrapeEvent(client, vendor, startDate, triggeredBy) {
  try {
    const result = await client.query(
      `INSERT INTO scrape_events (vendor, start_date, triggered_by, status) 
       VALUES ($1, $2, $3, 'started') 
       RETURNING id`,
      [vendor, new Date(startDate), triggeredBy || 'System']
    );
    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating scrape event:', error);
    return null;
  }
}

export async function updateScrapeEvent(client, eventId, status, message) {
  if (!eventId) return;
  try {
    await client.query(
      `UPDATE scrape_events 
       SET status = $1, message = $2 
       WHERE id = $3`,
      [status, message, eventId]
    );
  } catch (error) {
    console.error('Error updating scrape event:', error);
  }
}
