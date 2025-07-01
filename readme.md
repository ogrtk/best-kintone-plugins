# kintone用レポジトリ

このリポジトリでは、以下の kintone 向けのカスタマイズやプラグインを開発・管理しています。

## プラグイン・カスタマイズ一覧

以下の命名規則に従って、各プロジェクトを構成しています。
- `ktplug`から始まるプロジェクト名・・・kintoneのプラグイン
- `ktcust`から始まるプロジェクト名・・・kintoneのカスタマイズ
- `fbcust`から始まるプロジェクト名・・・FormBridgeのカスタマイズ
- `kvcust`から始まるプロジェクト名・・・kViewerのカスタマイズ

本リポジトリに含まれるプロジェクト一覧

| project                                                                   | 対象          | 説明                       |artifact|
| ------------------------------------------------------------------------- | ----------- | ------------------------ |----|
| [**fbcust-memorise-input**](https://github.com/ogrtk/best-kintone-plugins/tree/main/packages/fbcust-memorise-input)                       | FormBridge | 入力値をブラウザに保持         |
| [**fbcust-random-cd**](https://github.com/ogrtk/best-kintone-plugins/tree/main/packages/fbcust-random-cd)                       | FormBridge | ランダムコード値の生成         | [1.0.0](https://github.com/ogrtk/best-kintone-plugins/releases/tag/%40ogrtk%2Ffbcust-random-cd%401.0.0)
| [**ktplug-construct-hyperlink**](https://github.com/ogrtk/best-kintone-plugins/tree/main/packages/ktplug-construct-hyperlink) | kintone  | リンク自動生成 | [1.0.0](https://github.com/ogrtk/best-kintone-plugins/releases/tag/%40ogrtk%2Fktplug-construct-hyperlink%401.0.0)
| [**ktplug-felica-reader**](https://github.com/ogrtk/best-kintone-plugins/tree/main/packages/ktplug--felica-reader) | kintone  | FeliCa 読取 |
| [**ktplug-qrcode-reader**](https://github.com/ogrtk/best-kintone-plugins/tree/main/packages/ktplug-qrcode-reader)               | kintone  | QRコード読取          |
| [**kvcust-prefilled-formlink**](https://github.com/ogrtk/best-kintone-plugins/tree/main/packages/kvcust-prefilled-formlink)               | kViewer/FormBridge  | 値設定済フォームへのリンク生成          |
| [**kvcust-show-lastupdate**](https://github.com/ogrtk/best-kintone-plugins/tree/main/packages/kvcust-show-lastupdate)               | kViewer  | 最終更新日の表示          |

各プロジェクトの詳細については、それぞれの `README.md` を参照してください。

## 開発者向け情報

### 環境構築

#### 必要なツール

このリポジトリでは以下のツールを使用しています。

- [Node.js](https://nodejs.org/) (推奨バージョン: LTS)
- [pnpm](https://pnpm.io/) (パッケージマネージャー)
- [Vite](https://vitejs.dev/) (フロントエンドビルドツール)
- [Biome](https://biomejs.dev/) (コードフォーマッター & Linter)

#### 開発環境セットアップ手順

- VSCode、devcontainerを導入
- 本リポジトリをclone
- github上のnpmパッケージ参照設定
  - github上で、packageの参照権限を持つ[Personal Access Token(classic)を発行](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
  - `.devcontainer`ディレクトリ配下に`.env`を作成
    ```text
    NODE_AUTH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxx(Personal Access Tokenの値を設定)
    ```
- 開発用コンテナで起動
- kintone用シークレットの設定
  - kintone開発環境の認証情報
    - cliでpluginをアップロードするために使用
    - プロジェクトルートに`secret`ディレクトリを作成し、`.kintone.credentials`ファイルを作成
      ```text
      KINTONE_SUBDOMAIN=https://your-sub-domain.cybozu.com
      KINTONE_USERNAME=yourUserName
      KINTONE_PASSWORD=yourPassword
      ```
    - 動作確認 
      ```shell
      pnpm run --filter ktplug-construct-hyperlink band
      ```

### 共通コンポーネント

このリポジトリには、複数のプロジェクトで利用可能な共通コンポーネントが含まれています。
`packages/` 内の共通モジュールを適切に import して利用してください。

#### 利用方法

##### 1. `vite.config.ts` で共通の Vite 設定を利用

```ts
import baseConfig from "../../vite.config";

export default defineConfig({
  ...baseConfig,
  server: {
    https: baseConfig.server?.https,
  },
});
```

開発用 Web サーバを立ち上げる際、モノレポのルートに配置された証明書ファイル (certificationフォルダを作成し秘密鍵・証明書を配置してください) を `baseConfig` から取得することで、全プロジェクトで統一した HTTPS 環境を提供できます。

##### 2. `zod` を用いたバリデーションと `submit` 時の処理

このリポジトリでは、`zod` を利用してバリデーションスキーマを定義し、`react-hook-form` と組み合わせてフォームのバリデーションを行います。以下は `ktplug-qrcode-reader` での実装例です。

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KintoneLikeCheckBox } from "@ogrtk/shared-components";

const schema = z.object({
  agreement: z.literal("yes").refine(value => value === "yes", {
    message: "同意が必要です",
  }),
});

function ExampleComponent() {
  const formMethods = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: any) => {
    console.log("送信データ:", data);
  };

  return (
    <form onSubmit={formMethods.handleSubmit(onSubmit)}>
      <KintoneLikeCheckBox
        rhfMethods={formMethods}
        label="同意する"
        description="利用規約に同意してください"
        name="agreement"
        options={[{ code: "yes", label: "はい" }]}
        required
      />
      <button type="submit">送信</button>
    </form>
  );
}
```

##### 3. `zod` 用の各種ユーティリティ

このリポジトリでは、`zodUtils.ts` に `zod` スキーマを補助するユーティリティ関数を提供しています。

###### 例）unsetBoolDependentField を用いた動的バリデーション

`unsetBoolDependentField` は、特定のフィールドが `true` でない場合に、依存するフィールドの値を `undefined` にする `zod` 用の `preprocess` 関数です。

```ts
import { z } from "zod";
import { unsetBoolDependentField } from "@ogrtk/shared-components/lib/zodUtils";

const schema = z.object({
  isChecked: z.boolean(),
  dependentField: z.preprocess(
    unsetBoolDependentField([
      { conditionField: "isChecked", dependentField: "dependentField" },
    ]),
    z.string().optional()
  ),
});

const validData = schema.parse({ isChecked: false, dependentField: "削除される" });
console.log(validData); // { isChecked: false }
```

この関数を使用することで、条件に応じて不要なフィールドをバリデーション前に自動削除できます。

## ライセンス

このプロジェクトのライセンスについては、`LICENSE` ファイルを参照してください。

