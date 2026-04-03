-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
	identifier VARCHAR(50) NOT NULL,
	vendor VARCHAR(50) NOT NULL,
	date DATE NOT NULL,
	name VARCHAR(100) NOT NULL,
	price FLOAT NOT NULL,
	category VARCHAR(50),
	type VARCHAR(20) NOT NULL,
	processed_date DATE,
	original_amount FLOAT,
	original_currency VARCHAR(3),
	charged_currency VARCHAR(3),
	memo TEXT,
	status VARCHAR(20) NOT NULL,
	installments_number INTEGER,
	installments_total INTEGER,
	PRIMARY KEY (identifier, vendor)
);

CREATE TABLE IF NOT EXISTS vendor_credentials (
	id SERIAL PRIMARY KEY,
    id_number VARCHAR(100),
	username VARCHAR(100),
	vendor VARCHAR(100) NOT NULL,
    password VARCHAR(100),
    card6_digits VARCHAR(100),
    card_suffixes VARCHAR(200),
    nickname VARCHAR(100),
	bank_account_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (id_number, username, vendor)
);

-- Add categorization rules table
CREATE TABLE IF NOT EXISTS categorization_rules (
    id SERIAL PRIMARY KEY,
    name_pattern VARCHAR(200) NOT NULL,
    target_category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name_pattern, target_category)
);

-- Add index for better performance when matching rules
CREATE INDEX IF NOT EXISTS idx_categorization_rules_pattern ON categorization_rules(name_pattern);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_active ON categorization_rules(is_active);

-- Audit table to track scrape events
CREATE TABLE IF NOT EXISTS scrape_events (
    id SERIAL PRIMARY KEY,
    triggered_by VARCHAR(100),
    vendor VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'started',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scrape_events_created_at ON scrape_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_events_vendor ON scrape_events(vendor);

-- Savings table
CREATE TABLE IF NOT EXISTS savings (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- פיקדון, קופת גמל להשקעה, קרן השתלמות
    amount FLOAT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ILS',
    date_created DATE NOT NULL,
    institution VARCHAR(100) NOT NULL,
    risk_level VARCHAR(50),
    notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update last_updated
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_savings_last_updated
    BEFORE UPDATE ON savings
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

-- Recurrent transactions table
CREATE TABLE IF NOT EXISTS recurrent_transactions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    amount FLOAT NOT NULL,
    category VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    type VARCHAR(20) NOT NULL DEFAULT 'expense',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
