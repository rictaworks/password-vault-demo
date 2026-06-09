# Claude Safety Rules

## 削除系コマンドの禁止（重要）

以下のルールはこのワークスペース内のすべての会話で絶対に守られる：

- Claude はファイルまたはディレクトリを削除するコマンドを一切生成してはならない。
  例：rm, rm -rf, rm *, rmdir, unlink, cache --delete,
      lftp mirror --delete, rsync --delete, git clean -df, find -delete 等。

- 削除が必要な場合でも、Claude は削除コマンドを提案せず、
  「手動で削除してください」といった説明に留めること。

- 削除の推奨・削除操作の自動判断も禁止。

- ssh / lftp / デプロイ系スクリプトを生成する場合でも、
  削除コマンドの生成は禁止。

これらはすべての会話・コード生成に適用される。

---

# Password Vault Demo — プロジェクト設定

## 概要

| 項目 | 内容 |
|------|------|
| アプリ名 | Password Vault Demo |
| プラットフォーム | React Native + Expo (iOS / Android) |
| 動作確認端末 | OPPO A3 5G（Android・側面指紋センサー） |
| DB | SQLite（expo-sqlite） |
| 暗号化 | AES-256-GCM |
| キー保管 | expo-secure-store |
| 外部通信 | 完全なし（オフライン動作） |
| テスト | Jest + @testing-library/react-native |
| 仕様書 | [SPEC/](./SPEC/) |
| 開発環境 | [ENV/DEVELOPMENT.md](./ENV/DEVELOPMENT.md) |
| 本番環境 | [ENV/PRODUCTION.md](./ENV/PRODUCTION.md) |

## ブランチルール

- **main ブランチでの直接作業・直接 push は禁止**
- `src/*` 配下の変更は必ず PR を作成すること
- `src/*` 以外（CLAUDE.md, README.md, ENV/, SPEC/, TASKS/ 等）は main への push を許可
- PR には非エンジニア向けユーザーテスト手順を丁寧に記載すること

## TDD ワークフロー（厳守）

```
plan → red test → coding → green test
```

1. **Plan**: 実装内容を設計・仕様確認
2. **Red**: 失敗するテストを先に書く（Jest）
3. **Coding**: テストを通す最小限の実装
4. **Green**: すべてのテストが pass することを確認
5. **commit 前に security review を実施**（`.claude/OWASP10.md` 参照）

## テスト方針（TM.md 参照）

- フレームワーク: **Jest** + `@testing-library/react-native`
- E2E/UI 確認: **Playwright**（React Native の場合は expo-web 経由）
- テストファイル配置: `test/` ディレクトリ（PR 対応は `test/pr***/`）
- 単体テスト・結合テスト・受け入れテストを段階的に整備
- TM.md に記載されたテスト手法に準拠

## コード規約

- **フォールバック禁止**: 例外処理を必ず明示的に書くこと
- **グローバル変数禁止**: セキュリティ上の理由。クラスまたは関数スコープに限定
- **制御構文・条件構文以外はクラスまたは関数に書くこと**
- **ハードコード禁止**: 文字列リテラルは設定ファイル（`src/config/`）またはi18nに分離
- **ハードコードチェックテストを書くこと**
- **ネイティブの `alert()` / `confirm()` / `prompt()` 使用禁止**（プロジェクト全体）
- **絵文字禁止**（コード・コミットメッセージ・ドキュメント全般）
- デフォルトアイコンは **FontAwesome**（`@expo/vector-icons`）を使用
- **デバッグトレース可能なコードを書くこと**（ログ・エラーの追跡性を担保）
- JST・UTF-8 を標準とする

## 多言語対応

- **当初から多言語対応**: 日本語・英語・フランス語・中国語・ロシア語・スペイン語・アラビア語
- 文字列は i18n ファイル（`src/i18n/`）に分離
- **管理者向け画面は日本語のみ**

## 環境分岐

- 環境判定を必ず実装する（`development` / `production` / `test`）
- **開発環境では認証済み状態に分岐すること**（テスト可能にするため）
- 環境変数は `.env` を参照（`.env` はコミットしない）

## Hermes エンジン対応（重要）

React Native の本番ビルドは Hermes JS エンジンで動作する。以下の制約を必ず守ること：

- **`@noble/ciphers/webcrypto` の `randomBytes` 使用禁止** → `expo-crypto.getRandomBytes()` を使うこと
- **`crypto.subtle`（WebCrypto API）使用禁止** → `@noble/hashes/pbkdf2` 等の純粋JS実装を使うこと
- `crypto.getRandomValues` は Expo SDK 52 / React Native 0.76 では利用可能だが、`expo-crypto` 経由が確実

## セキュリティ

- commit 前に **security review** を必ず実施
- 参照: `.claude/OWASP10.md`（OWASP Top 10）
- AES-256-GCM 暗号化、Android Keystore / iOS Secure Enclave でキー管理
- 全 SQL クエリに `session_id` を必須条件として付与
- 認証失敗 3 回でアプリバックグラウンド退避
- クリップボードコピー後 30 秒で自動クリア
- `.claude/QC10.md`（品質管理10項目）・`.claude/CC.md`（コンプライアンス）も参照

## ディレクトリ構造

```
password-vault-demo/
├── app/                    # Expo Router 画面（src/* 扱い）
├── src/                    # ソースコード（PR 必須）
│   ├── services/           # SessionManager, AuthService, CryptoService, ResetScheduler
│   ├── repositories/       # CredentialRepository
│   ├── utils/              # PasswordEvaluator, HoneypotValidator
│   ├── db/                 # SQLite スキーマ定義
│   ├── config/             # 文字列リテラル・設定
│   └── i18n/               # 多言語対応ファイル
├── test/                   # テストファイル（test/pr***/）
├── assets/                 # 静的アセット・AI生成画像
├── app-ui/                 # デザインモック（配置時は従うこと）
├── TASKS/                  # タスク管理
├── DEBUG/                  # バグ報告
├── CLIENT/                 # クライアント要望
├── WORK/                   # 作業報告
├── DELETE/                 # ゴミ箱（手動で削除する際の一時置き場）
├── ENV/                    # 環境設定ドキュメント
│   ├── DEVELOPMENT.md
│   └── PRODUCTION.md
├── SPEC/                   # 仕様書・リバースエンジニアリング図
├── .claude/                # Claude 設定・参照ファイル
│   ├── agents/             # サブエージェント定義
│   ├── TM.md               # テストメソッド
│   ├── QC10.md             # 品質管理10項目
│   ├── OWASP10.md          # セキュリティチェック
│   ├── CC.md               # コンプライアンスチェック
│   ├── CRAP.md             # デザイン4か条
│   └── development-principles.md
└── .env                    # 環境変数（コミット禁止）
```

## 参照ドキュメント

| ファイル | 用途 |
|---------|------|
| `.claude/TM.md` | テストメソッド・フレームワーク |
| `.claude/QC10.md` | 品質管理チェックリスト10項目 |
| `.claude/OWASP10.md` | セキュリティ（OWASP Top 10） |
| `.claude/CC.md` | コンプライアンスチェック |
| `.claude/CRAP.md` | デザイン原則（Contrast/Repetition/Alignment/Proximity） |
| `.claude/development-principles.md` | 開発原則（YAGNI/KISS/DRY/SOLID） |
| `SPEC/` | 仕様書・ER図・DFD・シーケンス図・クラス図・状態遷移図・ユースケース図 |

## エージェント一覧

| エージェント | ファイル | 役割 |
|------------|---------|------|
| director | `.claude/agents/director.md` | 全体統括・意思決定 |
| project-manager | `.claude/agents/project-manager.md` | タスク管理・進捗管理 |
| designer | `.claude/agents/designer.md` | UI/UXデザイン（CRAP原則準拠） |
| debugger | `.claude/agents/debugger.md` | バグ調査・修正 |
| tester | `.claude/agents/tester.md` | テスト作成・実行 |
| deployer | `.claude/agents/deployer.md` | ビルド・配布 |
| writer | `.claude/agents/writer.md` | プロのライティング・ドキュメント作成 |
| pr-checker | `.claude/agents/pr-checker.md` | PR日本語化・ユーザーテスト記載 |
