/**
 * 最終更新日時の取得・表示（リファクタリング版）
 * kViewerの外部公開APIを利用して、最新の更新日時を表示します。
 */

(() => {
  /***************************************
   * 設定項目
   ***************************************/
  const CONFIG = {
    API_URL:
      "https://d5326d33.viewer.kintoneapp.com/public/api/records/e3d0d60813f3c2d79cd26d92aaa8bcae87921fe90509a9e75b9ec7c7dbddf2e3/1",
    LASTUPDATE_CHECK_FIELD: "更新日時",
    ELEMENT_TO_PLACE: "lastupdate-space",
    LABEL_TEXT: "最終更新日時",
    NO_UPDATE_TEXT: "----年--月--日 --:--",
    DISPLAY_STYLE: "color: gray; font-size: 1.0rem; text-align: right;",
    DATE_ONLY: false,
  };
  /***************************************
   * 設定項目ここまで
   ***************************************/

  /**
   * 設定の妥当性をチェック
   */
  function validateConfig() {
    const errors = [];

    if (!CONFIG.API_URL || typeof CONFIG.API_URL !== "string") {
      errors.push("CONFIG.API_URL: URLが設定されていないか文字列ではありません");
    } else {
      try {
        new URL(CONFIG.API_URL);
      } catch {
        errors.push("CONFIG.API_URL: 有効なURLではありません");
      }
    }

    if (
      !CONFIG.LASTUPDATE_CHECK_FIELD ||
      typeof CONFIG.LASTUPDATE_CHECK_FIELD !== "string"
    ) {
      errors.push(
        "CONFIG.LASTUPDATE_CHECK_FIELD: フィールドコードが設定されていないか文字列ではありません",
      );
    }

    if (
      !CONFIG.ELEMENT_TO_PLACE ||
      typeof CONFIG.ELEMENT_TO_PLACE !== "string"
    ) {
      errors.push(
        "CONFIG.ELEMENT_TO_PLACE: 要素IDが設定されていないか文字列ではありません",
      );
    }

    if (!CONFIG.LABEL_TEXT || typeof CONFIG.LABEL_TEXT !== "string") {
      errors.push(
        "CONFIG.LABEL_TEXT: ラベルテキストが設定されていないか文字列ではありません",
      );
    }

    if (!CONFIG.NO_UPDATE_TEXT || typeof CONFIG.NO_UPDATE_TEXT !== "string") {
      errors.push(
        "CONFIG.NO_UPDATE_TEXT: 未更新時のテキストが設定されていないか文字列ではありません",
      );
    }

    if (!CONFIG.DISPLAY_STYLE || typeof CONFIG.DISPLAY_STYLE !== "string") {
      errors.push(
        "CONFIG.DISPLAY_STYLE: 表示スタイルが設定されていないか文字列ではありません",
      );
    }

    if (typeof CONFIG.DATE_ONLY !== "boolean") {
      errors.push("CONFIG.DATE_ONLY: boolean値ではありません");
    }

    return errors;
  }

  // 設定のチェック（スクリプト読み込み時に実行）
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    console.error("設定エラーが見つかりました:");
    for (const error of configErrors) {
      console.error(`  - ${error}`);
    }
    alert("設定エラーが見つかりました。詳細はコンソールを確認してください。");
  }

  /**
   * 一覧画面表示時のイベントハンドラ
   */
  kviewer.events.on("records.show", async () => {
    // 設定エラーがあれば処理を中断
    if (configErrors.length > 0) {
      return;
    }
    try {
      const lastUpdate = await fetchLatestUpdate();
      renderLastUpdate(lastUpdate);
    } catch (error) {
      console.error(error);
    }
  });

  /**
   * 最新の更新日時を取得
   * @returns {Promise<string>} ISO形式文字列 or 空文字列
   */
  async function fetchLatestUpdate() {
    const response = await fetch(CONFIG.API_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const msg = `外部公開APIの実行に失敗しました: ${response.status}`;
      alert(msg);
      throw new Error(msg);
    }

    const data = await response.json();
    const records = data?.records ?? [];

    if (records.length === 0) return "";

    const fieldValue = records[0][CONFIG.LASTUPDATE_CHECK_FIELD]?.value;
    if (!fieldValue) {
      const msg = `項目 ${CONFIG.LASTUPDATE_CHECK_FIELD} が見つかりません`;
      alert(msg);
      throw new Error(msg);
    }

    return fieldValue;
  }

  /**
   * 取得した日時を画面に表示
   * @param {string} isoDate ISO8601形式文字列
   */
  function renderLastUpdate(isoDate) {
    const el = document.getElementById(CONFIG.ELEMENT_TO_PLACE);
    if (!el) {
      alert(`要素 ${CONFIG.ELEMENT_TO_PLACE} が存在しません`);
      return;
    }

    const text = isoDate
      ? `${CONFIG.LABEL_TEXT} : ${formatDate(new Date(isoDate))}`
      : `${CONFIG.LABEL_TEXT} : ${CONFIG.NO_UPDATE_TEXT}`;

    el.innerText = text;
    el.style = CONFIG.DISPLAY_STYLE;
  }

  /**
   * 日付フォーマット
   * @param {Date} date
   * @returns {string}
   */
  function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    if (CONFIG.DATE_ONLY) {
      return `${yyyy}年${mm}月${dd}日`;
    }

    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}年${mm}月${dd}日 ${hh}:${min}`;
  }
})();
