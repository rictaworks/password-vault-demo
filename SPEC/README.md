# SPEC（仕様書ディレクトリ）

| ファイル | 内容 |
|---------|------|
| [../password-vault-demo-spec.md](../password-vault-demo-spec.md) | メイン設計仕様書（ER図・DFD・シーケンス図・クラス図・状態遷移図・ユースケース図） |
| [api.md](./api.md) | 内部サービス API 仕様 |

## 図解ツール

シーケンス図・ER図等の更新には Mermaid を使用すること。

```bash
# Mermaid CLI インストール
npm install -g @mermaid-js/mermaid-cli

# PNG 出力
mmdc -i diagram.mmd -o diagram.png

# SVG 出力
mmdc -i diagram.mmd -o diagram.svg
```

## 更新ルール

- 実装が仕様書と乖離した場合は、仕様書も同じ PR で更新すること
- ER図・シーケンス図はコード変更に追従すること
- 図解は Mermaid 形式（`.mmd`）で管理し、出力画像は `assets/` に配置すること
