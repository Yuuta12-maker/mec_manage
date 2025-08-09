-- メール送信履歴用テーブルを作成
CREATE TABLE email_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 関連情報
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- メール内容
  email_type VARCHAR(100) NOT NULL, -- 'application', 'booking', 'session_update', 'next_session_promotion' など
  subject TEXT NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  
  -- 送信状況
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_email_history_session_id ON email_history(session_id);
CREATE INDEX idx_email_history_client_id ON email_history(client_id);
CREATE INDEX idx_email_history_email_type ON email_history(email_type);
CREATE INDEX idx_email_history_status ON email_history(status);
CREATE INDEX idx_email_history_created_at ON email_history(created_at);
CREATE INDEX idx_email_history_sent_at ON email_history(sent_at);

-- RLS（Row Level Security）設定
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- ポリシー作成（認証済みユーザーのみアクセス可能）
CREATE POLICY "Enable read access for authenticated users" ON email_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON email_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON email_history
  FOR UPDATE USING (auth.role() = 'authenticated');

-- サービスロールによる全アクセス許可（メール送信処理用）
CREATE POLICY "Enable all access for service role" ON email_history
  FOR ALL USING (auth.role() = 'service_role');