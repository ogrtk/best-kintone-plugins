(() => {
  // ========================================
  // 設定: CSV出力対象項目と順序
  // ========================================
  const CSV_CONFIG = {
    // 出力する項目のフィールドコードを順番に指定
    // 通常フィールドとサブテーブルのフィールドを含む
    fields: [
      "案件名",
      "日付",
      "質疑.質問",
      // 例: '顧客名', '受注日', 'テーブル_1.商品名', 'テーブル_1.数量', 'テーブル_1.単価'
      // 実際の使用時は、利用のkViewerビューに合った適切なフィールドコードに変更してください
    ],

    // エンコーディング設定
    encoding: {
      // BOM (Byte Order Mark) を付加するか
      // true: BOM付きUTF-8（Excelで文字化けしない）
      // false: BOMなしUTF-8（一般的なテキストエディタ向け）
      includeBOM: true,

      // 改行コード
      // "\r\n": Windows (CRLF) - Excelなど
      // "\n": Unix/Linux/Mac (LF)
      // "\r": 古いMac (CR)
      lineBreak: "\r\n",
    },
  };

  // ========================================
  // 設定: スタイル・UI
  // ========================================
  const STYLE_CONFIG = {
    // kv-record-menuのスタイル設定
    recordMenu: {
      minHeight: "auto",
      paddingTop: "8px",
      paddingBottom: "8px",
    },

    // CSVダウンロードボタンのスタイル設定
    downloadButton: {
      className: "flex items-center flex-row gap-2 rounded-full p-2",
      text: "CSVダウンロード",
      textDownloading: "ダウンロード中...",
      style: {
        display: "inline-flex",
        alignItems: "center",
        flexDirection: "row",
        gap: "8px",
        borderRadius: "9999px",
        padding: "8px",
        cursor: "pointer",
        border: "none",
        backgroundColor: "transparent",
        transition: "background-color 0.2s",
      },
      opacityDownloading: "0.6",
      opacityNormal: "1",
    },

    // ダウンロードボタンホバー時の背景色
    downloadButtonHover: {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
    },

    // テキストラベルのスタイル設定
    textLabel: {
      className: "text-xs font-bold",
      style: {
        fontSize: "12px",
        fontWeight: "bold",
      },
    },

    // アイコンのスタイル設定
    icon: {
      className: "rounded-full p-0",
      svg: `<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
        <path fill="none" d="M0 0h24v24H0V0z"></path>
        <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"></path>
      </svg>`,
    },

    // ボタンコンテナのスタイル
    buttonContainer: {
      paddingLeft: "32px",
      paddingRight: "32px",
      paddingTop: "8px",
      paddingBottom: "8px",
      textAlign: "right",
    },
  };

  // ========================================
  // 設定の妥当性チェック
  // ========================================
  /**
   * 設定の妥当性をチェック
   * @returns {string[]} エラーメッセージの配列
   */
  function validateConfig() {
    const errors = [];

    // CSV_CONFIG.fields のチェック
    if (!CSV_CONFIG.fields || !Array.isArray(CSV_CONFIG.fields)) {
      errors.push(
        "CSV_CONFIG.fields: フィールド配列が設定されていないか配列ではありません",
      );
    } else if (CSV_CONFIG.fields.length === 0) {
      errors.push(
        "CSV_CONFIG.fields: 出力するフィールドが1つも設定されていません。出力対象のフィールドコードを指定してください",
      );
    }

    // CSV_CONFIG.encoding.includeBOM のチェック
    if (typeof CSV_CONFIG.encoding?.includeBOM !== "boolean") {
      errors.push(
        "CSV_CONFIG.encoding.includeBOM: boolean値ではありません (true または false を指定してください)",
      );
    }

    // CSV_CONFIG.encoding.lineBreak のチェック
    if (!CSV_CONFIG.encoding?.lineBreak) {
      errors.push(
        "CSV_CONFIG.encoding.lineBreak: 改行コードが設定されていません",
      );
    } else if (typeof CSV_CONFIG.encoding.lineBreak !== "string") {
      errors.push(
        'CSV_CONFIG.encoding.lineBreak: 文字列ではありません ("\\r\\n", "\\n", "\\r" のいずれかを指定してください)',
      );
    } else if (!["\r\n", "\n", "\r"].includes(CSV_CONFIG.encoding.lineBreak)) {
      errors.push(
        'CSV_CONFIG.encoding.lineBreak: 無効な改行コードです ("\\r\\n", "\\n", "\\r" のいずれかを指定してください)',
      );
    }

    return errors;
  }

  // 設定のチェック（スクリプト読み込み時に実行）
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    console.error("=== CSV出力カスタマイズ: 設定エラー ===");
    for (const error of configErrors) {
      console.error(`  - ${error}`);
    }
    alert(
      `CSV出力カスタマイズの設定にエラーがあります:\n\n${configErrors.join("\n")}\n\n詳細はコンソールを確認してください。`,
    );
    throw new Error("CSV出力カスタマイズの設定が正しくありません");
  }

  // ========================================
  // スタイルシートの追加
  // ========================================
  (() => {
    const style = document.createElement("style");
    style.textContent = `
    #kviewer_csv_download_button:hover {
      background-color: ${STYLE_CONFIG.downloadButtonHover.backgroundColor} !important;
    }
  `;
    document.head.appendChild(style);
  })();

  /**
   * グローバル定義
   */
  // 処理中のcontext退避用（ボタン押下時に利用する）
  let currentContext = null;
  // BOM
  const UTF8BOM = new Uint8Array([0xef, 0xbb, 0xbf]);

  /**
   * 一覧表示時の処理
   */
  kviewer.events.on("records.show", (context) => {
    // contextを保存して後で使用
    currentContext = context;
    // 初期化
    initializeCSVDownload();
  });

  /**
   * ダウンロード処理の初期化
   * @returns
   */
  function initializeCSVDownload() {
    // リストビューかどうかを確認（kv-listの存在で判定）
    const listView = document.querySelector(".kv-list");
    if (!listView) {
      // リストビュー以外では処理しない
      console.log("Not a list view, skipping CSV download button");
      return;
    }

    // 既にボタンが存在する場合は追加しない
    if (document.getElementById("kviewer_csv_download_button")) {
      return;
    }

    // kv-record-menuを取得
    const recordMenu = document.querySelector(".kv-record-menu");
    // 見つからない場合は処理中断
    if (!recordMenu) {
      console.log("kv-record-menu not found, skipping CSV download button");
      return;
    }
    // kv-record-menuのスタイルを設定から適用
    Object.assign(recordMenu.style, STYLE_CONFIG.recordMenu);

    // CSVダウンロードボタンを作成
    const button = document.createElement("button");
    button.id = "kviewer_csv_download_button";
    button.type = "button";
    // スタイルを設定から適用
    button.className = STYLE_CONFIG.downloadButton.className;
    Object.assign(button.style, STYLE_CONFIG.downloadButton.style);

    // ダウンロードアイコンSVGを作成
    const iconSpan = document.createElement("span");
    iconSpan.className = STYLE_CONFIG.icon.className;
    iconSpan.innerHTML = STYLE_CONFIG.icon.svg;

    // テキストラベルを作成
    const textSpan = document.createElement("span");
    textSpan.className = STYLE_CONFIG.textLabel.className;
    textSpan.textContent = STYLE_CONFIG.downloadButton.text;
    Object.assign(textSpan.style, STYLE_CONFIG.textLabel.style);

    // ボタンに要素を追加
    button.appendChild(iconSpan);
    button.appendChild(textSpan);

    // kv-record-menuの次の要素としてボタンを配置（ひとつ下の行）
    // ボタンをコンテナで囲む
    const buttonContainer = document.createElement("div");
    Object.assign(buttonContainer.style, STYLE_CONFIG.buttonContainer);
    buttonContainer.appendChild(button);

    // kv-record-menuの次の兄弟要素として挿入
    if (recordMenu.nextSibling) {
      recordMenu.parentNode.insertBefore(
        buttonContainer,
        recordMenu.nextSibling,
      );
    } else {
      recordMenu.parentNode.appendChild(buttonContainer);
    }

    // ボタンクリック時の処理
    button.addEventListener("click", async () => {
      try {
        // context.recordsからレコードを取得
        const records = getDisplayedRecords();

        if (!records || records.length === 0) {
          alert("ダウンロードするレコードがありません");
          return;
        }

        // ダウンロード前の確認ダイアログ
        const confirmed = confirm(
          `画面上に表示されている ${records.length} 件のレコードをCSVファイルとしてダウンロードします。\n\nよろしいですか？`,
        );

        if (!confirmed) {
          return;
        }

        button.disabled = true;
        textSpan.textContent = STYLE_CONFIG.downloadButton.textDownloading;
        button.style.opacity = STYLE_CONFIG.downloadButton.opacityDownloading;

        // CSVデータを生成
        const csv = generateCSV(records);

        // ファイル名を生成（タイムスタンプ付き: YYYYMMDD-HHMMSS）
        const now = new Date();
        const year = now.getFullYear();
        const month = `0${now.getMonth() + 1}`.slice(-2);
        const day = `0${now.getDate()}`.slice(-2);
        const hours = `0${now.getHours()}`.slice(-2);
        const minutes = `0${now.getMinutes()}`.slice(-2);
        const seconds = `0${now.getSeconds()}`.slice(-2);
        const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;
        const filename = `kviewer_export_${timestamp}.csv`;

        // CSVファイルとしてダウンロード
        await downloadCSV(csv, filename);
      } catch (error) {
        console.error("CSVダウンロードエラー:", error);
        alert(`CSVダウンロード中にエラーが発生しました: ${error.message}`);
      } finally {
        button.disabled = false;
        textSpan.textContent = STYLE_CONFIG.downloadButton.text;
        button.style.opacity = STYLE_CONFIG.downloadButton.opacityNormal;
      }
    });
  }

  /**
   * context.recordsから表示されているレコードを取得する関数
   * @returns
   */
  function getDisplayedRecords() {
    if (!currentContext || !currentContext.records) {
      throw new Error("レコードデータが利用できません");
    }

    // context.recordsをそのまま返す
    return currentContext.records;
  }

  // CSV文字列を生成する関数（サブテーブル対応）
  function generateCSV(records) {
    if (records.length === 0) return "";

    // 設定からフィールド一覧を取得（グローバルでチェック済み）
    const targetFields = CSV_CONFIG.fields;

    // ヘッダー行を作成（"*開始行"列を先頭に追加）
    const headers = ["*開始行", ...targetFields];

    // データ行を作成
    const dataRows = [];

    for (const record of records) {
      // サブテーブルフィールドとそのデータを抽出
      const tableData = extractTableData(record, targetFields);

      // サブテーブルの最大行数を取得（最低1行は出力）
      const maxRows = Math.max(
        1,
        ...Object.values(tableData).map((t) => t.length),
      );

      // サブテーブルの行数分だけレコードを出力
      for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const row = [];

        // 開始行マーク（最初の行のみ*を設定）
        row.push(rowIndex === 0 ? "*" : "");

        // 各フィールドの値を取得
        for (const fieldCode of targetFields) {
          let value = "";

          if (fieldCode.includes(".")) {
            // サブテーブルのフィールド（例: "テーブル_1.商品名"）
            const [tableCode, subFieldCode] = fieldCode.split(".");
            if (tableData[tableCode]?.[rowIndex]) {
              value = getFieldValue(
                tableData[tableCode][rowIndex][subFieldCode],
              );
            }
          } else {
            // 通常フィールド（全行で同じ値を繰り返す）
            value = getFieldValue(record.kintoneRecord[fieldCode]);
          }

          row.push(value);
        }

        dataRows.push(row);
      }
    }

    // ヘッダーとデータを結合し、CSV形式のテキストデータを作る
    const csvContent = [
      // ヘッダの各項目をエスケープし、カンマで結合
      headers
        .map((h) => escapeCSV(h))
        .join(","),
      // 各データ行の各項目をエスケープし、カンマで結合
      ...dataRows.map((row) => row.map((cell) => escapeCSV(cell)).join(",")),
    ].join(CSV_CONFIG.encoding.lineBreak);

    return csvContent;
  }

  /**
   * サブテーブルデータを抽出
   */
  function extractTableData(record, targetFields) {
    const tableData = {};

    // 対象フィールドからサブテーブルを特定
    const tableFields = new Set();
    for (const fieldCode of targetFields) {
      if (fieldCode.includes(".")) {
        const [tableCode] = fieldCode.split(".");
        tableFields.add(tableCode);
      }
    }

    // 各サブテーブルのデータを抽出
    for (const tableCode of tableFields) {
      if (
        record.kintoneRecord?.[tableCode] &&
        record.kintoneRecord[tableCode].type === "SUBTABLE"
      ) {
        const tableValue = record.kintoneRecord[tableCode].value || [];
        tableData[tableCode] = tableValue.map((row) => row.value || {});
      }
    }

    return tableData;
  }

  /**
   * フィールド値を文字列として取得
   * @param {*} field
   * @returns
   */
  function getFieldValue(field) {
    if (!field) return "";

    // kintoneのフィールドオブジェクトの場合
    if (field.value !== undefined) {
      const value = field.value;

      // 配列の場合（チェックボックス、複数選択など）
      if (Array.isArray(value)) {
        return value.join("; ");
      }

      // オブジェクトの場合（ユーザー選択、組織選択など）
      if (typeof value === "object" && value !== null) {
        if (value.name) return value.name;
        if (value.code) return value.code;
        return JSON.stringify(value);
      }

      return String(value);
    }

    // プリミティブ値の場合
    if (typeof field === "string" || typeof field === "number") {
      return String(field);
    }

    return "";
  }

  /**
   * CSV用のエスケープ処理
   * @param {*} value
   * @returns
   */
  function escapeCSV(value) {
    // カンマ、ダブルクォート、改行が含まれている場合はダブルクォートで囲む
    if (
      value.includes(",") ||
      value.includes('"') ||
      value.includes("\n") ||
      value.includes("\r")
    ) {
      // ダブルクォートを2つにエスケープ
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * File System Access API を使用したダウンロード（前回フォルダを記憶）
   * @param {*} csvContent
   * @param {*} filename
   */
  async function downloadWithFileSystemAPI(csvContent, filename) {
    // ファイル保存ダイアログを表示（idで前回のフォルダを記憶）
    const handle = await window.showSaveFilePicker({
      id: "kviewer-csv-export", // この ID で前回のフォルダを記憶
      suggestedName: filename,
      types: [
        {
          description: "CSV Files",
          accept: { "text/csv": [".csv"] },
        },
      ],
    });

    // ファイルに書き込み
    const writable = await handle.createWritable();

    // BOM設定に応じて書き込み
    if (CSV_CONFIG.encoding.includeBOM) {
      await writable.write(UTF8BOM);
    }

    await writable.write(csvContent);
    await writable.close();
  }

  /**
   * 従来のダウンロード方式（Blob + download属性）
   * @param {*} csvContent
   * @param {*} filename
   */
  function downloadWithBlobURL(csvContent, filename) {
    // BOM設定に応じてBlobを作成
    let blobParts;
    if (CSV_CONFIG.encoding.includeBOM) {
      blobParts = [UTF8BOM, csvContent];
    } else {
      blobParts = [csvContent];
    }

    const blob = new Blob(blobParts, {
      type: "text/csv;charset=utf-8;",
    });

    // ダウンロード用のリンクを作成
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.display = "none";

    // リンクをクリックしてダウンロード
    document.body.appendChild(link);
    link.click();

    // クリーンアップ
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * CSVファイルをダウンロード
   * @param {*} csvContent
   * @param {*} filename
   * @returns
   */
  async function downloadCSV(csvContent, filename) {
    // File System Access API をサポートしているか確認
    if ("showSaveFilePicker" in window) {
      try {
        await downloadWithFileSystemAPI(csvContent, filename);
        return; // 成功
      } catch (err) {
        // ユーザーがキャンセルした場合
        if (err.name === "AbortError") {
          console.log("ダウンロードがキャンセルされました");
          return;
        }
        // その他のエラーはフォールバックへ
        console.warn("File System Access API failed, falling back:", err);
      }
    }

    // フォールバック: 従来の Blob + download 方式
    downloadWithBlobURL(csvContent, filename);
  }
})();
