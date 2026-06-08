# API 仕様書

このアプリは完全オフライン動作のため HTTP エンドポイントはありません。
内部サービスクラスのインターフェース仕様を管理します。

詳細な設計図（ER図・DFD・シーケンス図・クラス図・状態遷移図・ユースケース図）は
[../password-vault-demo-spec.md](../password-vault-demo-spec.md) を参照してください。

---

## 型定義

```typescript
type AuthPurpose = 'unlock' | 'add' | 'view' | 'delete'
type AuthResult  = 'success' | 'failure' | 'unavailable'
type Strength    = 'weak' | 'medium' | 'strong' | 'excellent'
type Category    = 'ウェブ' | 'アプリ' | '金融' | 'SNS' | 'その他'

interface NewEntry {
  serviceName: string
  username?: string
  password: string
  memo?: string
  category: Category
}

interface EntryRow {
  id: number
  sessionId: string
  serviceName: string
  usernameEnc: string | null
  passwordEnc: string
  memoEnc: string | null
  category: Category
  strength: Strength
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface Patch {
  serviceName?: string
  username?: string
  password?: string
  memo?: string
  category?: Category
}

interface GenOptions {
  length: number
  upper: boolean
  lower: boolean
  digits: boolean
  symbols: boolean
}

interface StrengthResult {
  strength: Strength
  score: number
  feedback: string[]
}
```

---

## SessionManager

`src/services/SessionManager.ts`

| メソッド | 戻り値 | 説明 |
|---------|--------|------|
| `initialize()` | `Promise<string>` | session_id を取得または UUID v4 で新規生成し expo-secure-store に保存する |
| `getSessionId()` | `string` | メモリ上の session_id を返す（未初期化時はエラー） |
| `clear()` | `void` | メモリ上のセッション参照をクリアする（expo-secure-store の値は保持） |

---

## AuthService

`src/services/AuthService.ts`

| メソッド | 戻り値 | 説明 |
|---------|--------|------|
| `biometricAuth(purpose)` | `Promise<AuthResult>` | 指紋・顔認証を実行する。失敗 3 回でアプリをバックグラウンド退避 |
| `masterPasswordAuth(input)` | `Promise<AuthResult>` | Argon2 ベースのマスターパスワード認証を実行する |
| `isAuthenticated()` | `boolean` | メモリ上の auth_flag を返す |
| `resetTimer()` | `void` | 5 分自動ロックタイマーをリセットする |
| `checkTimeout()` | `boolean` | タイムアウトしていれば true を返しロックする |
| `lock()` | `void` | auth_flag を false にして Vault をロックする |
| `onAppBackground()` | `void` | AppState の background イベントで即座に lock() を呼ぶ |

---

## CryptoService

`src/services/CryptoService.ts`

| メソッド | 戻り値 | 説明 |
|---------|--------|------|
| `getOrCreateKey()` | `Promise<CryptoKey>` | expo-secure-store から AES-256-GCM キーを取得、なければ生成・保存する |
| `encrypt(plain)` | `Promise<string>` | プレーンテキストを AES-256-GCM で暗号化し Base64 文字列で返す |
| `decrypt(cipher)` | `Promise<string>` | Base64 暗号文を復号してプレーンテキストを返す |

---

## CredentialRepository

`src/repositories/CredentialRepository.ts`

| メソッド | 戻り値 | 説明 |
|---------|--------|------|
| `create(entry, sid)` | `Promise<number>` | エントリを暗号化して INSERT し、生成された id を返す |
| `list(sid, q?, cat?)` | `Promise<EntryRow[]>` | session_id が一致する有効なエントリ一覧を返す（論理削除除外） |
| `get(id, sid)` | `Promise<EntryRow>` | session_id が一致する特定エントリを返す |
| `update(id, sid, patch)` | `Promise<void>` | session_id が一致するエントリを更新する |
| `softDelete(id, sid)` | `Promise<void>` | deleted_at を記録して論理削除する |

---

## PasswordEvaluator

`src/utils/PasswordEvaluator.ts`

| メソッド | 戻り値 | 説明 |
|---------|--------|------|
| `evaluate(pw)` | `StrengthResult` | パスワードを弱/中/強/最強の 4 段階で評価する |
| `generate(opts)` | `string` | CSPRNG ベースのランダムパスワードを生成する |

---

## HoneypotValidator

`src/utils/HoneypotValidator.ts`

| メソッド | 戻り値 | 説明 |
|---------|--------|------|
| `validate(form)` | `boolean` | ハニーポットフィールドが空であれば true（Bot でない）を返す |

---

## ResetScheduler

`src/services/ResetScheduler.ts`

| メソッド | 戻り値 | 説明 |
|---------|--------|------|
| `start(db)` | `void` | 次回 JST 03:00 までの ms を計算してタイマーをセットする |
| `runReset()` | `Promise<void>` | credentials・sessions を DELETE し reset_log に記録する |
| `msUntilNextReset()` | `number` (private) | 次回リセットまでのミリ秒数を返す |
