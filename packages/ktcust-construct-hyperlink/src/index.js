(() => {
  /***************************************
   * 設定項目　ここから
   ***************************************/

  /**
   * リンク設定
   * 配列内の各オブジェクトが1つのリンク設定を表します。
   *
   * ■ 設定オブジェクトの構造：
   * {
   *   linkField: {
   *     type: "field" | "table",             // リンクを設置するフィールドタイプ
   *     fieldCd: "フィールドコード",         // リンクを設置するフィールドのコード
   *     tableCd: "テーブルコード"            // type="table"の場合のテーブルコード
   *   },
   *   baseUrl: "URLテンプレート",            // ${変数名}でプレースホルダーを指定
   *   replacements: {                        // プレースホルダーの置換設定
   *     変数名: {
   *       type: "field" | "table",           // 値の取得方法
   *       fieldCd: "フィールドコード",       // フィールドコード
   *       skipIfEmpty: true | false          // この項目が空の場合リンク設置をスキップ（省略可、デフォルト:false）
   *     }
   *   },
   *   style: "CSSスタイル"                   // リンクに適用するスタイル（省略可）
   * }
   *
   * ■ 動作パターン：
   * - type="field": 通常のフィールドにリンクを設定
   * - type="table": テーブル項目（各行）にリンクを設定
   * - replacements で URL 内の ${変数} を実際の値に置換
   * - skipIfEmpty=true の項目が空の場合、リンク設置をスキップ
   * - skipIfEmpty=false または未指定の項目が空の場合、空文字で置換してリンク設置
   * ※テーブル項目にリンクを設定時、プレースホルダーの置換設定でテーブルの項目を指定する場合は、同じテーブルの項目のみ指定可能
   *
   * ■ 注意：
   * アプリ内テーブルについては、
   *   https://, http://
   * のみリンク表示可能（kintone標準の挙動としてURLリンクになります）
   * ※ 2025年9月現在、kintone APIがテーブル内の要素取得に非対応のためリンク要素設置を未実装
   */
  const LINK_CONFIGS = [
    // 設定例1: 通常フィールドにGoogle Mapsリンクを設定
    {
      linkField: { type: "field", fieldCd: "GoogleMapsへのリンク" }, // GoogleMapsへのリンク項目にURLを設定する
      baseUrl: "https://www.google.com/maps/place/${address}", // ${address}部分には、replacementsのaddresで指定する値が差し込まれる
      replacements: {
        address: {
          type: "field",
          fieldCd: "住所",
          skipIfEmpty: true, // 住所が空の場合はリンクを設定しない
        },
      },
      style: "color: red;", // リンクを赤色で表示
    },
    // 設定例2: 通常フィールドにファイルサーバリンクを設定
    {
      linkField: { type: "field", fieldCd: "ファイルサーバへのリンク" },
      baseUrl: "file://ebisu\\ankendir\\${ankenno}",
      replacements: {
        ankenno: {
          type: "field",
          fieldCd: "案件番号",
          skipIfEmpty: true, // 案件番号が空の場合はリンクを設定しない
        },
      },
      style: "color: blue;", // リンクを青色で表示
    },
    // 設定例3: テーブル内フィールドにGoogle Mapsリンクを設定
    {
      linkField: {
        type: "table",
        tableCd: "テーブル", // テーブルのコード
        fieldCd: "明細Googleマップへのリンク", // テーブル内のリンク設置フィールド
      },
      baseUrl: "https://www.google.com/maps/place/${city}${address}",
      replacements: {
        city: {
          type: "field",
          fieldCd: "明細リンク固定値",
          skipIfEmpty: true, // 空でも空文字で置換
        },
        address: {
          type: "table",
          fieldCd: "明細住所",
          skipIfEmpty: false, // 明細住所が空の場合はリンクを設定しない
        },
      },
      style: "color: green;", // リンクを緑色で表示
    },
  ];
  /***************************************
   * 設定項目　ここまで
   ***************************************/

  /**
   * 設定の妥当性チェック
   */
  function validateConfig() {
    if (!Array.isArray(LINK_CONFIGS)) {
      throw new Error("LINK_CONFIGSは配列である必要があります。");
    }

    let configIndex = 0;
    for (const config of LINK_CONFIGS) {
      const prefix = `LINK_CONFIGS[${configIndex}]`;

      // linkFieldのチェック
      if (!config.linkField) {
        throw new Error(`${prefix}.linkFieldが設定されていません。`);
      }
      if (!config.linkField.type) {
        throw new Error(`${prefix}.linkField.typeが設定されていません。`);
      }
      if (
        config.linkField.type !== "field" &&
        config.linkField.type !== "table"
      ) {
        throw new Error(
          `${prefix}.linkField.typeは"field"または"table"である必要があります。`,
        );
      }
      if (!config.linkField.fieldCd) {
        throw new Error(`${prefix}.linkField.fieldCdが設定されていません。`);
      }
      if (config.linkField.type === "table" && !config.linkField.tableCd) {
        throw new Error(
          `${prefix}.linkField.tableCdが設定されていません（type="table"の場合は必須）。`,
        );
      }

      // baseUrlのチェック
      if (!config.baseUrl) {
        throw new Error(`${prefix}.baseUrlが設定されていません。`);
      }
      if (typeof config.baseUrl !== "string") {
        throw new Error(`${prefix}.baseUrlは文字列である必要があります。`);
      }

      // replacementsのチェック
      if (!config.replacements) {
        throw new Error(`${prefix}.replacementsが設定されていません。`);
      }
      if (
        typeof config.replacements !== "object" ||
        Array.isArray(config.replacements)
      ) {
        throw new Error(
          `${prefix}.replacementsはオブジェクトである必要があります。`,
        );
      }

      // 各replacementのチェック
      for (const key in config.replacements) {
        const replacement = config.replacements[key];
        const repPrefix = `${prefix}.replacements.${key}`;

        if (!replacement.type) {
          throw new Error(`${repPrefix}.typeが設定されていません。`);
        }
        if (replacement.type !== "field" && replacement.type !== "table") {
          throw new Error(
            `${repPrefix}.typeは"field"または"table"である必要があります。`,
          );
        }
        if (!replacement.fieldCd) {
          throw new Error(`${repPrefix}.fieldCdが設定されていません。`);
        }
        if (
          replacement.skipIfEmpty !== undefined &&
          typeof replacement.skipIfEmpty !== "boolean"
        ) {
          throw new Error(
            `${repPrefix}.skipIfEmptyはboolean型である必要があります。`,
          );
        }
      }

      // styleのチェック（オプション）
      if (config.style !== undefined && typeof config.style !== "string") {
        throw new Error(`${prefix}.styleは文字列である必要があります。`);
      }

      configIndex++;
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
   * 登録・更新画面　表示時
   */
  kintone.events.on(
    ["app.record.edit.show", "app.record.create.show"],
    (event) => {
      console.log(event);

      // リンク設置用項目を編集不可に
      for (const linkConfig of LINK_CONFIGS) {
        disableLinkFields(event.record, linkConfig);
      }
      return event;
    },
  );

  /**
   * テーブル　明細行追加時
   */
  // 設定で指定されたテーブルすべてを対象にイベントリスナを設定
  for (const linkConfig of LINK_CONFIGS) {
    if (linkConfig.linkField.type === "table") {
      const tableCd = linkConfig.linkField.tableCd;
      kintone.events.on(
        [
          `app.record.edit.change.${tableCd}`,
          `app.record.create.change.${tableCd}`,
        ],
        (event) => {
          console.log(event);
          // テーブル内各行のリンクフィールドを編集不可に設定
          disableLinkFields(event.record, linkConfig);
          return event;
        },
      );
    }
  }

  /**
   * 登録・更新・一覧画面　保存時
   */
  kintone.events.on(
    [
      "app.record.create.submit",
      "app.record.edit.submit",
      "app.record.index.edit.submit",
    ],
    // リンク設置用項目にURLを生成・設定
    (event) => {
      console.log(event);

      // 設定を一つずつ処理
      for (const linkConfig of LINK_CONFIGS) {
        switch (linkConfig.linkField.type) {
          case "field": {
            //
            // フィールドタイプの場合：置換文字列を構築してリンクURLを生成
            //
            const replacementStrings = buildReplacementStrings(
              linkConfig.replacements,
              event.record,
            );
            // skipIfEmpty項目が空の場合はスキップ
            if (replacementStrings === null) {
              break;
            }
            // URL用の文字列とするためBASE64エンコード
            const linkUrl = encodeURI(
              replaceString(linkConfig.baseUrl, replacementStrings),
            );
            // URL設定の対象フィールドを取得
            const linkField = getFieldData(
              event.record,
              linkConfig.linkField.fieldCd,
              "linkConfig.linkField.fieldCd",
            );
            // 構成したURL文字列を設定
            linkField.value = linkUrl;
            break;
          }
          case "table": {
            //
            // テーブルタイプの場合：各行に対してリンクURLを生成
            //
            // 設定対象のテーブルの情報を取得
            const tableData = getTableData(
              event.record,
              linkConfig.linkField.tableCd,
            );
            // テーブルの各行を処理
            for (const tableRecord of tableData.value) {
              // テーブル行とメインレコードの両方を使用して置換文字列を構築
              const replacementStrings = buildReplacementStrings(
                linkConfig.replacements,
                event.record,
                tableRecord,
              );
              // URL設定対象項目を取得
              const linkField = getFieldData(
                tableRecord.value,
                linkConfig.linkField.fieldCd,
                `テーブル:${linkConfig.linkField.tableCd}`,
              );

              if (replacementStrings === null) {
                // 置換文字が設定されておらず、URLの設定を行わない場合はクリア
                linkField.value = "";
              } else {
                // URLの文字列とするため、Base64エンコード
                const linkUrl = encodeURI(
                  replaceString(linkConfig.baseUrl, replacementStrings),
                );
                // URLを設定
                linkField.value = linkUrl;
              }
            }
            break;
          }
          default:
            //
            // それ以外が設定された場合はエラーとする
            //
            handleError(
              `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`,
            );
        }
      }
      return event;
    },
  );

  /**
   * 詳細画面　表示時
   */
  kintone.events.on(
    ["app.record.detail.show"],
    // 詳細画面でリンク要素にクリックイベントとスタイルを設定
    (event) => {
      console.log(event);

      // 設定を一つずつ処理
      for (const linkConfig of LINK_CONFIGS) {
        switch (linkConfig.linkField.type) {
          case "field": {
            //
            // フィールドタイプの場合：DOM要素を取得してリンク設定
            //

            // 項目のデータを取得
            const linkField = getFieldData(
              event.record,
              linkConfig.linkField.fieldCd,
              "linkConfig.linkField.fieldCd",
            );
            // 項目のHTML要素を取得
            const linkEl = kintone.app.record.getFieldElement(
              linkConfig.linkField.fieldCd,
            );
            if (!linkEl) {
              handleError(
                `指定の項目の要素が取得できません:${linkConfig.linkField.fieldCd}`,
              );
            }
            // 取得したHTML要素をリンクとして設定
            setLinkElement(linkEl, linkConfig.style, linkField.value);
            break;
          }
          case "table": {
            //
            // テーブルの場合は何もしない(冒頭の説明参照)
            //
            break;
          }
          default:
            //
            // それ以外が設定された場合はエラーとする
            //
            handleError(
              `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`,
            );
        }
      }
      return event;
    },
  );

  /**
   * 一覧画面　表示時
   */
  kintone.events.on(
    ["app.record.index.show"],
    // 一覧画面の各行にリンク設定を適用
    (event) => {
      console.log(event);

      // 一覧表示以外は処理しない
      if (event.viewType !== "list") return;

      // 設定を一つずつ処理
      for (const linkConfig of LINK_CONFIGS) {
        switch (linkConfig.linkField.type) {
          case "field": {
            //
            // フィールドタイプの場合：一覧の各行のHTML要素を取得
            //

            // HTML要素を取得(一覧の列。各行の項目が含まれる)
            const linkEls = kintone.app.getFieldElements(
              linkConfig.linkField.fieldCd,
            );
            // 一覧に対象の項目がない場合は警告を表示してスキップ
            // （kintoneの一覧に、対象項目を表示しない設定とされている可能性もあるため）
            if (!linkEls || linkEls.length === 0) {
              console.warn(
                `指定の項目がありません:${linkConfig.linkField.fieldCd}`,
              );
              continue;
            }
            // 各レコードに対応するHTML要素にリンク設定
            for (const [idx, record] of event.records.entries()) {
              // 対象の項目を取得
              const linkField = getFieldData(
                record,
                linkConfig.linkField.fieldCd,
                "linkConfig.linkField.fieldCd",
              );
              // URLが設定されている場合、リンクとして設定する
              if (linkField.value) {
                const linkEl = linkEls[idx];
                setLinkElement(linkEl, linkConfig.style, linkField.value);
              }
            }
            break;
          }
          case "table": {
            //
            // テーブルの場合、何もしない
            //
            break;
          }
          default:
            //
            // それ以外が設定された場合はエラーとする
            //
            handleError(
              `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`,
            );
        }
      }
      return event;
    },
  );

  /**
   * 一覧画面　編集開始時
   */
  kintone.events.on(["app.record.index.edit.show"], (event) => {
    console.log(event);

    // 一覧編集開始時：リンクフィールドを編集不可に設定
    for (const linkConfig of LINK_CONFIGS) {
      switch (linkConfig.linkField.type) {
        case "field": {
          //
          // フィールドタイプの場合
          //
          const linkField = event.record[linkConfig.linkField.fieldCd];
          if (linkField) {
            linkField.disabled = true;
          }
          break;
        }
        case "table": {
          //
          // テーブルの場合、何もしない
          //
          break;
        }
        default:
          //
          // それ以外が設定された場合はエラーとする
          //
          handleError(
            `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`,
          );
      }
    }
    return event;
  });

  /**
   * エラーハンドリング
   */
  function handleError(message) {
    alert(message);
    throw new Error(message);
  }

  /**
   * フィールドのデータ取得
   */
  function getFieldData(record, fieldCd, errorComment = null) {
    // フィールドコードの必須チェック
    if (!fieldCd) {
      handleError(`フィールドコードが指定されていません。${errorComment}`);
    }

    // レコード内でのフィールド存在チェック
    const field = record[fieldCd];
    if (!field) {
      handleError(`指定の項目がありません:${fieldCd}。${errorComment}`);
    }
    return field;
  }

  /**
   * テーブルのデータ取得
   */
  function getTableData(record, tableCd) {
    // テーブルコードの必須チェック
    if (!tableCd) {
      handleError("linkConfig.linkField.tableCdが設定されていません。");
    }

    // テーブルの存在チェックとタイプ確認
    const tableData = record[tableCd];
    if (!tableData || tableData.type !== "SUBTABLE") {
      handleError(`テーブル"${tableCd}"がアプリに定義されていません。`);
    }
    return tableData;
  }

  /**
   * リプレースメント文字列の構築
   * @param {Object} replacements - 置換設定オブジェクト
   * @param {Object} record - メインレコード
   * @param {Object} tableRecord - テーブルレコード（オプション）
   * @returns {Object|null} - 置換文字列オブジェクト、またはskipIfEmpty項目が空の場合はnull
   */
  function buildReplacementStrings(replacements, record, tableRecord = null) {
    // リプレースメント文字列のオブジェクトを用意
    const replacementStrings = {};

    // 各置換パラメータの値を取得してオブジェクトを構築
    const keys = Object.keys(replacements);
    for (const key of keys) {
      const replacement = replacements[key];
      switch (replacement.type) {
        case "field": {
          //
          // フィールドタイプの場合
          //

          // メインレコードのフィールドから値を取得
          const field = getFieldData(
            record,
            replacement.fieldCd,
            `replacements.${key}`,
          );
          // skipIfEmptyがtrueで値が空の場合はnullを返す
          if (replacement.skipIfEmpty && !field.value) {
            return null;
          }
          replacementStrings[key] = field.value || "";
          break;
        }
        case "table": {
          //
          // テーブルタイプの場合
          //

          // テーブル行のフィールドから値を取得
          if (!tableRecord) {
            handleError("テーブルレコードが指定されていません。");
          }
          const field = getFieldData(
            tableRecord.value,
            replacement.fieldCd,
            `replacements.${key}（テーブル内）`,
          );
          // skipIfEmptyがtrueで値が空の場合はnullを返す
          if (replacement.skipIfEmpty && !field.value) {
            return null;
          }
          replacementStrings[key] = field.value || "";
          break;
        }
        default:
          //
          // それ以外が設定された場合はエラーとする
          //
          handleError(
            `設定が不正です: replacements.${key}.type が ${replacement.type}`,
          );
      }
    }

    return replacementStrings;
  }

  /**
   * リンクフィールドを無効化
   */
  function disableLinkFields(record, linkConfig) {
    switch (linkConfig.linkField.type) {
      case "field": {
        // フィールドタイプの場合：該当フィールドを編集不可に設定
        const linkField = getFieldData(
          record,
          linkConfig.linkField.fieldCd,
          "linkConfig.linkField.fieldCd",
        );
        linkField.disabled = true;
        break;
      }
      case "table": {
        // テーブルタイプの場合：テーブル内の全行のリンクフィールドを編集不可に設定
        const tableData = getTableData(record, linkConfig.linkField.tableCd);
        for (const tableRecord of tableData.value) {
          const linkField = getFieldData(
            tableRecord.value,
            linkConfig.linkField.fieldCd,
            `テーブル ${linkConfig.linkField.tableCd}`,
          );
          linkField.disabled = true;
        }
        break;
      }
      default:
        handleError(
          `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`,
        );
    }
  }

  /**
   * １行テキスト項目内で、実際に文字を配置している要素を取得
   * （ここにスタイルを設定する）
   */
  function findStylingElement(baseEl) {
    const span = baseEl.querySelector("span");
    if (!span) return null;

    const anchor = span.querySelector("a");
    return anchor ?? span;
  }

  /**
   * 要素をリンクとして設定
   */
  function setLinkElement(linkEl, styleCssText, linkParamValue) {
    if (linkParamValue) {
      // CSSスタイルの適用
      if (styleCssText) {
        const stylingEl = findStylingElement(linkEl);
        if (stylingEl) stylingEl.style.cssText = styleCssText;
      }
      // クリックイベント：新しいタブでリンクを開く
      linkEl.addEventListener("click", () => {
        window.open(linkParamValue, "_blank");
      });
      // マウスオーバー時：カーソルをポインターに変更
      linkEl.addEventListener("mouseover", () => {
        linkEl.style.cursor = "pointer";
      });
    }
  }

  /**
   * 文字列の差込処理
   */
  function replaceString(template, variables) {
    // テンプレート文字列内の${key}形式のプレースホルダーを実際の値で置換
    return template.replace(/\$\{([^}]+)\}/g, (match, key) => {
      const trimmedKey = key.trim();
      // キーが存在する場合は値を返す（空文字含む）、存在しない場合はmatchを返す
      return trimmedKey in variables ? variables[trimmedKey] : match;
    });
  }
})();
