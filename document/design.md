# 設計書

## システム構成
- **フロントエンド**: ユーザー入力・履歴表示・AI出力表示
- **バックエンド**: OpenAI API呼び出し、履歴管理、プロンプト管理
- **環境変数**: `.env`でAPI Key・モデル設定

## 主な処理フロー
1. ユーザーが各プロンプトに入力
2. 入力・履歴をサーバーに送信
3. サーバーがOpenAI APIにプロンプト・履歴を送信
4. AI出力を受信し、履歴とともに保存
5. フロントエンドに出力・履歴を返却

## データ構造例
- `history`: [{step, userInput, aiOutput, timestamp}]
- `prompt`: {id, template, description}

## 拡張ポイント
- prompt11〜13は将来拡張用
- プロンプト内容は`仮説キャンバスprompts.md`を参照
