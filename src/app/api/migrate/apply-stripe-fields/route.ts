import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST() {
  try {
    console.log('Applying Stripe payment fields migration...');
    
    // Read the migration file content
    const migrationSQL = `
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
    `;

    // Execute the migration SQL statements one by one
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.startsWith('--')) continue; // Skip comments
      
      const { error } = await supabaseAdmin.rpc('sql', { query: statement });
      if (error) {
        console.error('Error executing statement:', statement);
        console.error('Error:', error);
        return NextResponse.json({ 
          success: false, 
          error: `Error executing SQL: ${error.message}`,
          statement 
        }, { status: 500 });
      }
    }
    
    console.log('Migration applied successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Stripe payment fields migration applied successfully' 
    });
    
  } catch (error) {
    console.error('Error applying migration:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}