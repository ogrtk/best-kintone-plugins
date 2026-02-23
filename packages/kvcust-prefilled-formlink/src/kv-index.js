(() => {
  /***************************************
   * 設定項目　ここから
   ***************************************/
  // FrombridgeのURL
  const FORM_URL =
    "https://6c1e671f.form.kintoneapp.com/public/44eb68cf0fc247e5a22ee604b8892b659a1b4f9f4c2a28e782586dbd6cffb6b6";

  // 項目のマッピング設定
  //  viewItem: kViewerのフィールドコード
  //  paramName: URLパラメータとして設定する項目名
  // ※項目のマッピングを使用しない場合、undefinedとして定義する
  // const MAPPINGS = undefined;
  const MAPPINGS = [
    { viewItem: "案件名", paramName: "pAnName" },
    { viewItem: "案件番号", paramName: "pAnNo" },
    { viewItem: "案件番号", paramName: "pAnNo" },
  ];

  // テーブル項目のマッピング設定
  //  paramName: URLパラメータとして設定する項目名
  //  mappings: テーブルのマッピング設定（複数テーブルに係る設定の配列）
  //    viewItem: kViewer上のテーブルのフィールドコード
  //    paramTable: URLパラメータ中の対応するテーブル名
  //    columnMappings: 各列のマッピング設定
  //      viewColumn: kViewer上のテーブル列のフィールドコード
  //      paramColumn: URLパラメータ中の対応するテーブル列名
  // ※テーブル項目のマッピングを使用しない場合、undefinedとして定義する
  // const TABLE_MAPPINGS = undefined;
  const TABLE_MAPPINGS = {
    paramName: "pTables",
    mappings: [
      {
        viewItem: "質疑",
        paramTable: "pQuestions",
        columnMappings: [
          { viewColumn: "質問", paramColumn: "pQuestion" },
          { viewColumn: "備考", paramColumn: "pMemo" },
        ],
      },
      {
        viewItem: "質疑2",
        paramTable: "pQuestions2",
        columnMappings: [
          { viewColumn: "質問2", paramColumn: "pQuestion2" },
          { viewColumn: "備考2", paramColumn: "pMemo2" },
        ],
      },
    ],
  };

  // リンク設置用スペースのフィールドコード
  const SPACE_FOR_LINK = "spaceField";

  // リンクの表示テキスト
  const LINK_TEXT = "質疑フォームへ";

  // リンクを自タブで開く"_self" or 新しいタブで開く "_blank"
  const LINK_TARGET = "_blank";

  // リンクの表示スタイル
  const LINK_STYLE =
    "text-decoration: underline; color: royalblue; font-size: 1.5rem;";

  /***************************************
   * 設定項目　ここまで
   ***************************************/

  /**
   * 設定の妥当性をチェック
   */
  function validateConfig() {
    const errors = [];

    // FORM_URLのチェック
    if (!FORM_URL || typeof FORM_URL !== "string") {
      errors.push("FORM_URL: URLが設定されていないか文字列ではありません");
    } else {
      try {
        new URL(FORM_URL);
      } catch {
        errors.push("FORM_URL: 有効なURLではありません");
      }
    }

    // MAPPINGSのチェック
    if (MAPPINGS) {
      if (!Array.isArray(MAPPINGS)) {
        errors.push("MAPPINGSは配列である必要があります");
      } else {
        for (const [index, mapping] of MAPPINGS.entries()) {
          if (!mapping.viewItem) {
            errors.push(`MAPPINGS[${index}]: viewItemが設定されていません`);
          }
          if (!mapping.paramName) {
            errors.push(`MAPPINGS[${index}]: paramNameが設定されていません`);
          }
        }
      }
    }

    // TABLE_MAPPINGSのチェック
    if (TABLE_MAPPINGS) {
      if (!TABLE_MAPPINGS.paramName) {
        errors.push("TABLE_MAPPINGS.paramNameが設定されていません");
      }
      if (!TABLE_MAPPINGS.mappings || !Array.isArray(TABLE_MAPPINGS.mappings)) {
        errors.push("TABLE_MAPPINGS.mappingsは配列である必要があります");
      } else {
        for (const [index, tableMapping] of TABLE_MAPPINGS.mappings.entries()) {
          if (!tableMapping.viewItem) {
            errors.push(
              `TABLE_MAPPINGS.mappings[${index}]: viewItemが設定されていません`,
            );
          }
          if (!tableMapping.paramTable) {
            errors.push(
              `TABLE_MAPPINGS.mappings[${index}]: paramTableが設定されていません`,
            );
          }
          if (
            !tableMapping.columnMappings ||
            !Array.isArray(tableMapping.columnMappings)
          ) {
            errors.push(
              `TABLE_MAPPINGS.mappings[${index}]: columnMappingsは配列である必要があります`,
            );
          } else {
            for (const [
              colIndex,
              columnMapping,
            ] of tableMapping.columnMappings.entries()) {
              if (!columnMapping.viewColumn) {
                errors.push(
                  `TABLE_MAPPINGS.mappings[${index}].columnMappings[${colIndex}]: viewColumnが設定されていません`,
                );
              }
              if (!columnMapping.paramColumn) {
                errors.push(
                  `TABLE_MAPPINGS.mappings[${index}].columnMappings[${colIndex}]: paramColumnが設定されていません`,
                );
              }
            }
          }
        }
      }
    }

    // SPACE_FOR_LINKのチェック
    if (!SPACE_FOR_LINK || typeof SPACE_FOR_LINK !== "string") {
      errors.push(
        "SPACE_FOR_LINK: フィールドコードが設定されていないか文字列ではありません",
      );
    }

    // LINK_TEXTのチェック
    if (!LINK_TEXT || typeof LINK_TEXT !== "string") {
      errors.push(
        "LINK_TEXT: リンクテキストが設定されていないか文字列ではありません",
      );
    }

    // LINK_TARGETのチェック
    if (!LINK_TARGET || typeof LINK_TARGET !== "string") {
      errors.push(
        "LINK_TARGET: リンクターゲットが設定されていないか文字列ではありません",
      );
    } else if (LINK_TARGET !== "_self" && LINK_TARGET !== "_blank") {
      errors.push('LINK_TARGET: "_self"または"_blank"である必要があります');
    }

    // LINK_STYLEのチェック
    if (!LINK_STYLE || typeof LINK_STYLE !== "string") {
      errors.push(
        "LINK_STYLE: リンクスタイルが設定されていないか文字列ではありません",
      );
    }

    return errors;
  }

  // 設定のチェック（スクリプト読み込み時に実行）
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    console.error("設定エラーが見つかりました:");
    for (const error of configErrors) {
      console.error(`  - ${error}`);
      alert(`設定エラーが見つかりました。${error}`);
    }
  }

  /**
   * 詳細画面表示時の処理
   */
  kviewer.events.on("record.show", (context) => {
    // 設定エラーがあれば処理を中断
    if (configErrors.length > 0) {
      return;
    }
    // 入力済みフォーム用のリンク作成
    const linkUrl = constructPrefilledFormlink(
      context.record.kintoneRecord,
      FORM_URL,
      MAPPINGS,
      TABLE_MAPPINGS,
    );
    // リンク配置用要素を取得
    const spaceField = context.getFieldElement(SPACE_FOR_LINK);
    // リンクを配置
    placeLink(spaceField, linkUrl, LINK_TEXT, LINK_TARGET, LINK_STYLE);
  });

  /**
   * 入力済みフォーム用のリンク作成
   */
  function constructPrefilledFormlink(
    kintoneRecord,
    formUrl,
    mappings,
    tableMappings,
  ) {
    const params = new URLSearchParams();
    if (mappings) {
      for (const mapping of mappings) {
        params.append(mapping.paramName, kintoneRecord[mapping.viewItem].value);
      }
    }

    if (tableMappings) {
      const paramTableDatas = [];

      for (const tableMapping of tableMappings.mappings) {
        const paramTableData = { [tableMapping.paramTable]: [] };
        const tableData = kintoneRecord[tableMapping.viewItem];
        for (const rowData of tableData.value) {
          const paramTableRowData = {};
          for (const columnMapping of tableMapping.columnMappings) {
            paramTableRowData[columnMapping.paramColumn] =
              rowData.value[columnMapping.viewColumn].value;
          }
          paramTableData[tableMapping.paramTable].push(paramTableRowData);
        }
        paramTableDatas.push(paramTableData);
      }
      params.append(tableMappings.paramName, JSON.stringify(paramTableDatas));
    }

    return `${formUrl}?${params.toString()}`;
  }

  /**
   * リンクの設置
   */
  function placeLink(spaceElement, linkUrl, linkText, linkTarget, linkStyle) {
    const alertMsg =
      "\n※ご利用のブラウザによって、フォーム画面でデータを引用表示できない可能性があります。";
    const linkEl = document.createElement("a");
    linkEl.href = linkUrl;
    // URLが8000文字を超える場合、警告表示
    linkEl.text = linkText + (linkUrl.length > 80000 ? alertMsg : "");
    linkEl.target = linkTarget;
    linkEl.style = linkStyle;
    spaceElement.appendChild(linkEl);
  }
})();
