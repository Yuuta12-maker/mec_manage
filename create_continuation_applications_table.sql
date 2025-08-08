-- 継続申し込み用テーブルを作成
CREATE TABLE continuation_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  trial_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  
  -- 申し込み内容
  program_type VARCHAR(50) DEFAULT '6sessions', -- '6sessions', 'custom' など
  preferred_start_date DATE,
  payment_method VARCHAR(50), -- 'bank_transfer', 'credit_card', 'installment' など
  
  -- 追加情報
  goals TEXT, -- 継続の目標・期待すること
  schedule_preference TEXT, -- 希望スケジュール
  special_requests TEXT, -- 特別な要望
  
  -- ステータス管理
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  admin_notes TEXT, -- 管理者メモ
  
  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID -- 承認者のID（将来の管理者機能用）
);

-- インデックス作成
CREATE INDEX idx_continuation_applications_client_id ON continuation_applications(client_id);
CREATE INDEX idx_continuation_applications_status ON continuation_applications(status);
CREATE INDEX idx_continuation_applications_created_at ON continuation_applications(created_at);

-- RLS（Row Level Security）設定
ALTER TABLE continuation_applications ENABLE ROW LEVEL SECURITY;

-- ポリシー作成（認証済みユーザーのみアクセス可能）
CREATE POLICY "Enable read access for authenticated users" ON continuation_applications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON continuation_applications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON continuation_applications
  FOR UPDATE USING (auth.role() = 'authenticated');