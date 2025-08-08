-- セッションテーブルにsession_numberフィールドを追加
ALTER TABLE sessions 
ADD COLUMN session_number INTEGER;

-- 既存セッションの番号を更新（クライアントごとに日付順で番号付け）
WITH numbered_sessions AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY scheduled_date ASC, created_at ASC
    ) as session_num
  FROM sessions
  WHERE status IN ('completed', 'scheduled')
)
UPDATE sessions 
SET session_number = numbered_sessions.session_num
FROM numbered_sessions 
WHERE sessions.id = numbered_sessions.id;