# Password Vault Demo

指紋認証でロック解除するローカルパスワード金庫のデモアプリ。

**プラットフォーム**: React Native + Expo (iOS / Android)
**動作確認端末**: OPPO A3 5G（Android・側面指紋センサー）

---

## 自動ログイン

このアプリはユーザー登録・ログイン機能を持ちません。

| 項目 | 内容 |
|------|------|
| 認証方式 | 指紋認証（expo-local-authentication）またはマスターパスワード |
| セッションID | 初回起動時に UUID v4 を自動生成・expo-secure-store に永続保持 |
| 開発環境 | `NODE_ENV=development` のとき認証済み状態で起動（テスト用） |
| 外部認証 | なし（完全オフライン動作） |

---

## ページ一覧（Expo Router スクリーン）

| ページ名 | ルート | ファイル |
|---------|--------|---------|
| [ロック画面](./app/index.tsx) | `/` | `app/index.tsx` |
| [Vault 一覧](./app/vault/index.tsx) | `/vault/` | `app/vault/index.tsx` |
| [エントリ追加](./app/vault/add.tsx) | `/vault/add` | `app/vault/add.tsx` |
| [エントリ詳細・編集](./app/vault/[id].tsx) | `/vault/[id]` | `app/vault/[id].tsx` |
| [パスワード生成](./app/vault/generate.tsx) | `/vault/generate` | `app/vault/generate.tsx` |

---

## API 一覧（内部サービス API）

このアプリは完全オフライン動作のため HTTP エンドポイントはありません。
内部サービスクラスのインターフェースを API として管理します。

詳細仕様: [SPEC/api.md](./SPEC/api.md)

### SessionManager

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| initialize | `initialize(): Promise<string>` | セッション ID を取得または生成する |
| getSessionId | `getSessionId(): string` | 現在のセッション ID を返す |
| clear | `clear(): void` | メモリ上のセッションをクリアする |

### AuthService

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| biometricAuth | `biometricAuth(purpose: AuthPurpose): Promise<AuthResult>` | 指紋・顔認証を実行する |
| masterPasswordAuth | `masterPasswordAuth(input: string): Promise<AuthResult>` | マスターパスワード認証を実行する |
| isAuthenticated | `isAuthenticated(): boolean` | 認証済み状態かを返す |
| resetTimer | `resetTimer(): void` | 自動ロックタイマーをリセットする |
| lock | `lock(): void` | Vault を即座にロックする |
| onAppBackground | `onAppBackground(): void` | バックグラウンド移行時にロックを実行する |

### CryptoService

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| getOrCreateKey | `getOrCreateKey(): Promise<CryptoKey>` | 暗号化キーを取得または生成する |
| encrypt | `encrypt(plain: string): Promise<string>` | AES-256-GCM で暗号化する |
| decrypt | `decrypt(cipher: string): Promise<string>` | AES-256-GCM で復号する |

### CredentialRepository

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| create | `create(entry: NewEntry, sid: string): Promise<number>` | エントリを追加する |
| list | `list(sid: string, q?: string, cat?: string): Promise<EntryRow[]>` | 一覧を取得する |
| get | `get(id: number, sid: string): Promise<EntryRow>` | エントリを 1 件取得する |
| update | `update(id: number, sid: string, patch: Patch): Promise<void>` | エントリを更新する |
| softDelete | `softDelete(id: number, sid: string): Promise<void>` | 論理削除する |

### PasswordEvaluator

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| evaluate | `evaluate(pw: string): StrengthResult` | パスワード強度を評価する（weak/medium/strong/excellent） |
| generate | `generate(opts: GenOptions): string` | CSPRNG ベースのパスワードを生成する |

### ResetScheduler

| メソッド | シグネチャ | 説明 |
|---------|-----------|------|
| start | `start(db: SQLiteDatabase): void` | JST 03:00 日次リセットスケジューラを起動する |
| runReset | `runReset(): Promise<void>` | DBリセットを手動実行する |

---

## セットアップ

```bash
# 依存パッケージインストール
npm install

# 開発サーバー起動
npx expo start

# Android 実機起動
npx expo start --android

# iOS シミュレーター起動
npx expo start --ios

# テスト実行
npm test
```

---

## デモ版制約事項

- マスタデータ件数: ビルトインカテゴリ 5 件（ウェブ / アプリ / 金融 / SNS / その他）
- DB 毎日自動リセット: JST 03:00 に全データ削除（セッション ID・暗号化キーは保持）
- 外部 API 完全禁止: オフライン動作のみ
- 顔認証は動作確認対象外（OPPO A3 5G 指紋認証のみ確認）

---

## ドキュメント

| ドキュメント | リンク |
|------------|--------|
| 設計仕様書 | [password-vault-demo-spec.md](./password-vault-demo-spec.md) |
| SPEC 一覧 | [SPEC/](./SPEC/) |
| 開発環境 | [ENV/DEVELOPMENT.md](./ENV/DEVELOPMENT.md) |
| 本番環境 | [ENV/PRODUCTION.md](./ENV/PRODUCTION.md) |
| タスク | [TASKS/](./TASKS/) |
| バグ報告 | [DEBUG/](./DEBUG/) |
| 作業報告 | [WORK/](./WORK/) |
