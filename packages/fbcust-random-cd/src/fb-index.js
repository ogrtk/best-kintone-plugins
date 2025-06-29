(() => {
  /***************************************
   * 設定項目　ここから
   ***************************************/
  const TARGET_FIELD_CD = "targetFieldCd";

  /***************************************
   * 設定項目　ここまで
   ***************************************/
  /**
   * フォーム表示時にランダムなコード値を生成
   */
  formBridge.events.on("form.show", (context) => {
    const uuid = self.crypto.randomUUID();
    context.setFieldValue(TARGET_FIELD_CD, uuid);
  });
})();
