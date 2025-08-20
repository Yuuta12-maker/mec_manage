# デバッグページ制御の例

## 現在の実装（本番無効）
```typescript
if (process.env.NODE_ENV === 'production') {
  return <div>404 - Page Not Found</div>
}
```

## オプション1: 環境変数で制御
```typescript
// .env.local に追加
NEXT_PUBLIC_DEBUG_ENABLED=true

// コード修正
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEBUG_ENABLED !== 'true') {
  return <div>404 - Page Not Found</div>
}
```

## オプション2: 特定条件で制御
```typescript
// 開発者のみアクセス可能
const isDebugAllowed = process.env.NODE_ENV !== 'production' || 
                      process.env.DEBUG_SECRET_KEY === 'your-secret-key'

if (!isDebugAllowed) {
  return <div>404 - Page Not Found</div>
}
```

## オプション3: 完全に元に戻す
```typescript
// この行をコメントアウトまたは削除
/*
if (process.env.NODE_ENV === 'production') {
  return <div>404 - Page Not Found</div>
}
*/
```