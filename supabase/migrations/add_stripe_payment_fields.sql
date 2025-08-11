-- Add Stripe payment fields to clients table (for trial payments)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS trial_payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS trial_stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS trial_payment_amount INTEGER DEFAULT 6000,
ADD COLUMN IF NOT EXISTS trial_paid_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for trial payment fields
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer ON clients(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_clients_trial_payment_status ON clients(trial_payment_status);
CREATE INDEX IF NOT EXISTS idx_clients_trial_stripe_session ON clients(trial_stripe_session_id);

-- Add trial payment transactions table
CREATE TABLE IF NOT EXISTS trial_payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    stripe_checkout_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    amount INTEGER NOT NULL DEFAULT 6000,
    currency VARCHAR(3) DEFAULT 'JPY',
    status VARCHAR(50) NOT NULL,
    payment_method_type VARCHAR(50),
    payment_method_brand VARCHAR(50),
    payment_method_last4 VARCHAR(4),
    failure_code VARCHAR(100),
    failure_message TEXT,
    stripe_fee INTEGER,
    net_amount INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for trial payment transactions
CREATE INDEX IF NOT EXISTS idx_trial_payment_transactions_client ON trial_payment_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_trial_payment_transactions_stripe_session ON trial_payment_transactions(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_trial_payment_transactions_stripe_intent ON trial_payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_trial_payment_transactions_status ON trial_payment_transactions(status);

-- Enable RLS for trial payment transactions
ALTER TABLE trial_payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for trial payment transactions
CREATE POLICY "Admin can view trial_payment_transactions" ON trial_payment_transactions
    FOR ALL USING (auth.jwt() ->> 'email' IN (
        SELECT email FROM auth.users WHERE id IN (
            SELECT user_id FROM admin_users
        )
    ));

-- Add Stripe payment fields to continuation_applications table
ALTER TABLE continuation_applications 
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount INTEGER,
ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(3) DEFAULT 'JPY',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_continuation_applications_stripe_checkout 
    ON continuation_applications(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_continuation_applications_payment_status 
    ON continuation_applications(payment_status);
CREATE INDEX IF NOT EXISTS idx_continuation_applications_stripe_customer 
    ON continuation_applications(stripe_customer_id);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    continuation_application_id UUID REFERENCES continuation_applications(id) ON DELETE CASCADE,
    stripe_checkout_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    status VARCHAR(50) NOT NULL,
    payment_method_type VARCHAR(50),
    payment_method_brand VARCHAR(50),
    payment_method_last4 VARCHAR(4),
    failure_code VARCHAR(100),
    failure_message TEXT,
    stripe_fee INTEGER,
    net_amount INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_application ON payment_transactions(continuation_application_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_session ON payment_transactions(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_intent ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Create stripe_customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for stripe_customers
CREATE INDEX IF NOT EXISTS idx_stripe_customers_client ON stripe_customers(client_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

-- Enable Row Level Security
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin only access)
CREATE POLICY "Admin can view payment_transactions" ON payment_transactions
    FOR ALL USING (auth.jwt() ->> 'email' IN (
        SELECT email FROM auth.users WHERE id IN (
            SELECT user_id FROM admin_users
        )
    ));

CREATE POLICY "Admin can view stripe_customers" ON stripe_customers
    FOR ALL USING (auth.jwt() ->> 'email' IN (
        SELECT email FROM auth.users WHERE id IN (
            SELECT user_id FROM admin_users
        )
    ));

-- Update continuation_applications RLS policy to include payment fields
DROP POLICY IF EXISTS "Admin can view continuation_applications" ON continuation_applications;
CREATE POLICY "Admin can view continuation_applications" ON continuation_applications
    FOR ALL USING (auth.jwt() ->> 'email' IN (
        SELECT email FROM auth.users WHERE id IN (
            SELECT user_id FROM admin_users
        )
    ));