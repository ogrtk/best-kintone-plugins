# Kintoneプラグイン - リンク自動生成プラグイン

このプラグインは、Kintoneの特定の1行テキスト項目の値をもとに、別の1行テキスト項目にリンクを自動生成・設定するプラグインです。プラグイン設定画面では、どの項目を対象とするか、リンクの構成要素、スタイルを設定できます。

## 📦 機能概要

- 指定されたフィールドの値をもとに、リンクURLを構成
- 構成されたリンクを、指定フィールドに設定
- 一覧・詳細・編集画面でリンクを表示し、クリックで外部サイトを開く
- スタイル（CSS）を指定可能
- 編集・保存時にはリンク値を自動更新

## 🖥️ 設定画面（React + react-hook-form）

- `react-hook-form` + `zod` によるバリデーション付きフォーム
- kintoneの1行テキスト項目を `KintoneFieldsRetriever` により動的に取得
- 設定は `storePluginConfig` で保存、 `restorePluginConfig` で読み込み
- UIは `@ogrtk/shared/components` の `KintoneLikeTable` を使用

### 設定できる項目

| 項目                 | 説明                                |
|----------------------|-------------------------------------|
| リンク配置用フィールド | リンクを表示する1行テキスト項目     |
| URLの前方部分         | リンクのプレフィックス（例: `https://`）|
| URL構成用フィールド   | リンクに使用する値を持つ項目         |
| URLの後方部分         | サフィックス（例: `.html` など）     |
| スタイル              | `cssText` 形式で指定（例: `color:red;`）|

## 🧩 カスタマイズ処理（kintone.events.on）

### イベント対応

| イベント名 | 内容                                 |
|------------|--------------------------------------|
| `app.record.create.show` / `edit.show` | リンク用項目を非表示・編集不可に設定 |
| `app.record.create.submit` / `edit.submit` / `index.edit.submit` | 保存時にリンクを構成し設定        |
| `app.record.detail.show` | 詳細画面でリンクを表示・スタイル適用 |
| `app.record.index.show` | 一覧画面でリンクを設定               |
| `app.record.index.edit.show` | 一覧編集時にリンク項目を編集不可に設定 |

### その他の処理

- `findStylingElement`: リンク対象要素内の `span` や `a` を取得し、スタイル適用
- `setLinkElement`: リンクのクリック挙動、マウスオーバー時のカーソル変更を実装

## 📁 ディレクトリ構成（抜粋）

src/
├── App.tsx # React 設定画面
├── types.ts # PluginConfigとzodスキーマ
├── index.ts # カスタマイズ処理本体
├── ...（shared utils, stylesなど）


## 🛠 開発ツール

- React 19
- react-hook-form
- Zod
- @tanstack/react-query
- kintone JavaScript API
- sharedパッケージで共通ロジックを分離管理

## ✅ 今後の改善ポイント（例）

- スタイルのプリセット化
- 対応フィールドタイプの拡張（例: リッチエディタなど）
- 設定のバリデーション強化

---

## 🔗 使用方法

1. プラグインをKintoneにインストール
2. 設定画面で対象のフィールドやリンク構成を指定
3. アプリを更新して反映

---

## 📝 ライセンス

本プラグインのコードは内部利用を想定しています。外部公開を行う場合はライセンスの明示と利用規約をご確認ください。
