-- セッションテーブルにGoogle Meetリンクカラムを追加
ALTER TABLE sessions ADD COLUMN meet_link TEXT;

-- 既存のセッションデータを確認（オプション）
-- SELECT id, client_id, scheduled_date, type, status, meet_link FROM sessions;