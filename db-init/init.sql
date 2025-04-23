-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
	id SERIAL PRIMARY KEY,
	date DATE NOT NULL,
	name VARCHAR(100) NOT NULL,
	price FLOAT NOT NULL,
	category VARCHAR(50),
	type VARCHAR(20) NOT NULL,
	identifier VARCHAR(50),
	processed_date DATE,
	original_amount FLOAT,
	original_currency VARCHAR(3),
	charged_currency VARCHAR(3),
	memo TEXT,
	status VARCHAR(20) NOT NULL,
	installments_number INTEGER,
	installments_total INTEGER,
	UNIQUE(date, name, price)
);

CREATE TABLE IF NOT EXISTS income (
	id SERIAL PRIMARY KEY,
	income_type VARCHAR(100) NOT NULL,
	amount FLOAT NOT NULL,
	date DATE NOT NULL
);
