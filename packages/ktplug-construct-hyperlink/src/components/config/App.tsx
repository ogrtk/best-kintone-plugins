import { type PluginConfig, pluginConfigSchema } from "@/src/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { KintoneLikeTable } from "@ogrtk/shared/components";
import {
  KintoneFieldsRetriever,
  type SelectOption,
  restorePluginConfig,
  storePluginConfig,
} from "@ogrtk/shared/kintone-utils";
import "@ogrtk/shared/styles";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

export function App({ PLUGIN_ID }: { PLUGIN_ID: string }) {
  const fetchData = async () => {
    const app = kintone.app.getId();

    if (!app) throw new Error("appが取得できません。");
    // kintoneの項目取得ユーティリティ
    const kintoneFieldsRetriever = new KintoneFieldsRetriever();

    // pluginに保存した設定情報を取得
    const result = restorePluginConfig(PLUGIN_ID, pluginConfigSchema);
    // エラーがある場合、メッセージ表示
    const initConfig = result.data;
    const initMessages = result.success
      ? []
      : result.error.errors.map(
          (error) => ` 項目：${error.path} エラー：${error.message}`,
        );

    // スペース項目取得
    const initSpaceFields = await kintoneFieldsRetriever.getRecordSpaceFields();
    // 1行テキスト取得
    const initSingleTextFields =
      await kintoneFieldsRetriever.getSingleTextFields();

    return {
      initConfig,
      initMessages,
      initSingleTextFields,
      initSpaceFields,
    };
  };

  /** suspense query */
  const { initConfig, initMessages, initSingleTextFields, initSpaceFields } =
    useSuspenseQuery({
      queryKey: ["fetchData"],
      queryFn: fetchData,
      retry: false,
    }).data;

  // 選択肢の項目用state
  const [singleTextFields, _setSingleTextFields] =
    useState<SelectOption[]>(initSingleTextFields);
  const [spaceFields, _setSpaceFields] =
    useState<SelectOption[]>(initSpaceFields);
  const [messages, _setMessages] = useState<string[]>(initMessages);

  // react-hook-form
  const methods = useForm<PluginConfig>({
    defaultValues: initConfig,
    resolver: zodResolver(pluginConfigSchema),
  });
  const { handleSubmit } = methods;

  /**
   * フォーム内容送信処理
   * @param data
   */
  const onSubmit: SubmitHandler<PluginConfig> = (data) => {
    storePluginConfig(data, () => {
      alert("保存しました。反映のため、アプリを更新してください");
      window.location.href = `../../flow?app=${kintone.app.getId()}`;
    });
  };

  return (
    <>
      {messages?.map((message) => (
        <p key={message} className="kintoneplugin-alert">
          {message}
        </p>
      ))}

      <form onSubmit={handleSubmit(onSubmit)}>
        <KintoneLikeTable
          rhfMethods={methods}
          label="リンクの設定"
          description="リンクを配置するスペースと項目等の情報を設定してください。"
          name="configs"
          defaultValue={{
            space: "",
            fieldCode: "",
            urlPrefix: "",
            urlPostfix: "",
            linkText: "",
            style: "",
          }}
          required
          fieldMetas={[
            {
              type: "select",
              key: "space",
              label: "配置スペース",
              options: spaceFields,
              required: true,
            },
            {
              type: "singletext",
              key: "urlPrefix",
              label: "URLの前方部分",
              required: true,
            },
            {
              type: "select",
              key: "fieldCode",
              label: "フィールドコード",
              options: singleTextFields,
              required: true,
            },
            {
              type: "singletext",
              key: "urlPostfix",
              label: "URLの後方部分",
            },
            {
              type: "singletext",
              key: "linkText",
              label: "リンクテキスト",
              required: true,
            },
            {
              type: "singletext",
              key: "style",
              label: "スタイル",
            },
          ]}
        />

        <input
          className="kintoneplugin-button-normal"
          type="submit"
          title="設定を保存"
          value="設定を保存"
        />
      </form>
    </>
  );
}
