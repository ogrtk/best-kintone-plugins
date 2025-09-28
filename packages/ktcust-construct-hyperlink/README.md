# kintone ハイパーリンク構築カスタマイズ

kintoneアプリのフィールドに動的にハイパーリンクを設定するJavaScriptカスタマイズです。

## 機能

- **通常フィールド**および**テーブル内フィールド**にハイパーリンクを自動生成・設定
- **動的URL生成**: フィールド値や固定値を組み合わせてURLを構築
- **カスタムスタイル**: リンクの見た目をCSSで自由にカスタマイズ
- **クリック動作**: 新しいタブでリンクを開く

## 使用例

### 1. Google Mapsリンク
住所フィールドの値を使ってGoogle Mapsへのリンクを生成

### 2. ファイルサーバリンク
案件番号を使ってファイルサーバーの特定フォルダへのリンクを生成

### 3. テーブル内リンク
テーブルの各行で異なる住所へのGoogle Mapsリンクを生成

## 設定方法

### 基本設定

`src/index.js` の `LINK_CONFIGS` 配列を編集してリンク設定を追加・変更します。

```javascript
const LINK_CONFIGS = [
  {
    linkField: {
      type: "field",
      fieldCd: "リンクフィールドのコード"
    },
    baseUrl: "https://example.com/${param1}/${param2}",
    replacements: {
      param1: { type: "field", fieldCd: "参照フィールドコード" },
      param2: { type: "fixed", value: "固定値" }
    },
    style: "color: blue; font-weight: bold;"
  }
];
```

### 設定オブジェクトの構造

| プロパティ | 説明 | 必須 |
|-----------|------|------|
| `linkField` | リンクを設置するフィールドの情報 | ✓ |
| `linkField.type` | `"field"` または `"table"` | ✓ |
| `linkField.fieldCd` | フィールドコード | ✓ |
| `linkField.tableCd` | テーブルコード（type="table"の場合） | - |
| `baseUrl` | URLテンプレート（`${変数名}`でプレースホルダー指定） | ✓ |
| `replacements` | プレースホルダーの置換設定 | ✓ |
| `style` | CSSスタイル | - |

### リプレースメント設定

プレースホルダーの値を取得する方法を指定します：

| type | 説明 | 必要なプロパティ |
|------|------|-----------------|
| `"field"` | メインレコードのフィールド値 | `fieldCd` |
| `"table"` | テーブル行のフィールド値 | `fieldCd` |
| `"fixed"` | 固定値 | `value` |

## 設定例

### 通常フィールドの例

```javascript
{
  linkField: { type: "field", fieldCd: "GoogleMapsリンク" },
  baseUrl: "https://www.google.com/maps/place/${address}",
  replacements: {
    address: { type: "field", fieldCd: "住所" }
  },
  style: "color: red;"
}
```

### テーブルフィールドの例

```javascript
{
  linkField: {
    type: "table",
    tableCd: "明細テーブル",
    fieldCd: "マップリンク"
  },
  baseUrl: "https://www.google.com/maps/place/${city}${address}",
  replacements: {
    city: { type: "field", fieldCd: "都市名" },      // メインレコード
    address: { type: "table", fieldCd: "住所" }      // テーブル行
  },
  style: "color: green;"
}
```

## インストール方法

1. `src/index.js` の `LINK_CONFIGS` を環境に合わせて設定
2. `src/index.js` をkintoneアプリのJavaScriptカスタマイズとしてアップロード
3. アプリの設定を保存、更新

## 動作仕様

### イベント処理

- **登録・更新画面表示時**: リンクフィールドを編集不可に設定
- **保存時**: リンクURLを生成してフィールドに設定
- **詳細画面表示時**: リンクにクリックイベントとスタイルを適用
- **一覧画面表示時**: 各行のリンクにクリックイベントとスタイルを適用
- **一覧編集開始時**: リンクフィールドを編集不可に設定

### 制限事項

- **テーブル内リンク**: 現在kintone APIの制限により、テーブル内フィールドへのDOM操作は限定的
- **対応プロトコル**: `https://`, `http://` のみkintone標準でリンク表示可能
- **テーブル制約**: テーブル内のプレースホルダーは同一テーブル内のフィールドのみ参照可能

## トラブルシューティング

### よくあるエラー

| エラーメッセージ | 原因 | 解決方法 |
|-----------------|------|----------|
| `指定の項目がありません:${fieldCd}` | フィールドコードが間違っている | kintoneアプリ設定でフィールドコードを確認 |
| `テーブル"${tableCd}"がアプリに定義されていません` | テーブルコードが間違っている | kintoneアプリ設定でテーブルコードを確認 |
| `フィールドコードが指定されていません` | 設定のfieldCdが空 | LINK_CONFIGSの設定を確認 |

### デバッグ方法

1. ブラウザの開発者ツールでコンソールを確認
2. `console.log(event)` でイベント内容を確認
3. 設定オブジェクトの構造を再確認

## 更新履歴

- v1.0.0: 初回リリース

## ライセンス

このプロジェクトのライセンス情報については、プロジェクトルートのライセンスファイルを参照してください。