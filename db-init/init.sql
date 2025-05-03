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

CREATE TABLE IF NOT EXISTS income (
	id SERIAL PRIMARY KEY,
	income_type VARCHAR(100) NOT NULL,
	amount FLOAT NOT NULL,
	date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_credentials (
	id SERIAL PRIMARY KEY,
    id_number VARCHAR(100),
	username VARCHAR(100),
	vendor VARCHAR(100) NOT NULL,
    password VARCHAR(100),
    card6_digits VARCHAR(100),
    nickname VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (id_number, username, vendor)
);
