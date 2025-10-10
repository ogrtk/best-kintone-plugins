(() => {
  /***************************************
   * 設定項目　ここから
   ***************************************/
  const TARGET_FIELD_CD = "targetFieldCd";

  /***************************************
   * 設定項目　ここまで
   ***************************************/

  /**
   * 設定の妥当性チェック
   */
  function validateConfig() {
    if (!TARGET_FIELD_CD) {
      throw new Error("TARGET_FIELD_CDが設定されていません。");
    }
    if (typeof TARGET_FIELD_CD !== "string") {
      throw new Error("TARGET_FIELD_CDは文字列である必要があります。");
    }
    if (TARGET_FIELD_CD.trim() === "") {
      throw new Error("TARGET_FIELD_CDは空文字列にできません。");
    }
  }

  // 設定チェックを実行
  try {
    validateConfig();
  } catch (error) {
    console.error("設定エラーが見つかりました:");
    console.error(`  - ${error.message}`);
    alert(`設定エラー: ${error.message}`);
    throw error;
  }

  /**
   * フォーム表示時にランダムなコード値を生成
   */
  formBridge.events.on("form.show", (context) => {
    const uuid = self.crypto.randomUUID();
    context.setFieldValue(TARGET_FIELD_CD, uuid);
  });
})();
