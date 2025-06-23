import {
  type KintoneEvent,
  restorePluginConfig,
} from "@ogrtk/shared/kintone-utils";
import { pluginConfigSchema } from "./types";

((PLUGIN_ID) => {
  // pluginに保存した設定情報を取得
  const result = restorePluginConfig(PLUGIN_ID, pluginConfigSchema);
  if (!result.success) {
    const msg = `プラグインの設定にエラーがあります:${result.error}`;
    alert(msg);
    throw new Error(msg);
  }
  const configs = result.data?.configs;

  // 処理対象のイベントを用意
  // 画面表示（登録・更新・照会）、データ変更時（登録・更新）
  const targetEvents = configs
    .map((config) => `app.record.create.change.${config.fieldCode}`)
    .concat(
      configs.map((config) => `app.record.edit.change.${config.fieldCode}`),
    )
    .concat([
      "app.record.edit.show",
      "app.record.create.show",
      "app.record.detail.show",
    ]);

  /**
   * イベント処理
   */
  kintone.events.on(targetEvents, (event: KintoneEvent) => {
    for (const config of configs) {
      // 指定フィールドの値を取得
      if (!event.record[config.fieldCode]) {
        const msg = `指定の項目がありません:${config.fieldCode}`;
        alert(msg);
        throw new Error(msg);
      }
      const fieldData = event.record[config.fieldCode].value;
      // 指定のスペースを取得
      const el = kintone.app.record.getSpaceElement(config.space);
      if (!el) {
        const msg = `リンク設置用のスペースが取得できません:${config.space}`;
        alert(msg);
        throw new Error(msg);
      }

      // リンクを作成
      el.innerHTML = "";
      const anchorEl = document.createElement("a");
      el.appendChild(anchorEl);
      anchorEl.href = encodeURI(
        config.urlPrefix + fieldData + config.urlPostfix,
      );
      anchorEl.innerText = config.linkText;
      if (config.style) anchorEl.style.cssText = config.style;
      anchorEl.target = "_blank";
    }
    return event;
  });
})(kintone.$PLUGIN_ID);
