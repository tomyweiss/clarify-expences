-- Migration: 001_add_categorization_rules.sql
-- Description: Add categorization rules table for automatic transaction categorization
-- Date: 2024

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

-- Add comment to table
COMMENT ON TABLE categorization_rules IS 'Stores rules for automatic categorization of transactions based on name patterns'; 