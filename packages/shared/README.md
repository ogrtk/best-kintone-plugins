# 共通コンポーネント

このリポジトリには、複数のプロジェクトで利用可能な共通コンポーネントが含まれています。
`packages/` 内の共通モジュールを適切に import して利用してください。

#### 利用方法

##### `zod` を用いたバリデーションと `submit` 時の処理

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

##### `zod` 用の各種ユーティリティ

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
