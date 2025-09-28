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
   *       type: "field" | "table" | "fixed", // 値の取得方法
   *       fieldCd: "フィールドコード",       // type="field"|"table"の場合
   *       value: "固定値"                    // type="fixed"の場合
   *     }
   *   },
   *   style: "CSSスタイル"                   // リンクに適用するスタイル（省略可）
   * }
   *
   * ■ 動作パターン：
   * - type="field": 通常のフィールドにリンクを設定
   * - type="table": テーブル項目（各行）にリンクを設定
   * - replacements で URL 内の ${変数} を実際の値に置換
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
      linkField: { type: "field", fieldCd: "GoogleMapsへのリンク" },
      baseUrl: "https://www.google.com/${path}${address}",
      replacements: {
        path: { type: "fixed", value: "maps/place/" }, // 固定値を設定
        address: { type: "field", fieldCd: "住所" }, // 他フィールドの値を取得
      },
      style: "color: red;", // リンクを赤色で表示
    },
    // 設定例2: 通常フィールドにファイルサーバリンクを設定
    {
      linkField: { type: "field", fieldCd: "ファイルサーバへのリンク" },
      baseUrl: "file://ebisu\\${ankenno}",
      replacements: {
        ankenno: { type: "field", fieldCd: "案件番号" }, // 案件番号フィールドの値を取得
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
        city: { type: "field", fieldCd: "明細リンク固定値" }, // メインレコードのフィールド
        address: { type: "table", fieldCd: "明細住所" }, // テーブル行のフィールド
      },
      style: "color: green;", // リンクを緑色で表示
    },
  ];
  /***************************************
   * 設定項目　ここまで
   ***************************************/
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
   * 登録・更新・一覧画面　保存時
   */
  kintone.events.on(
    [
      "app.record.create.submit",
      "app.record.edit.submit",
      "app.record.index.edit.submit",
    ],
    (event) => {
      console.log(event);

      // リンク設置用項目にURLを生成・設定
      for (const linkConfig of LINK_CONFIGS) {
        switch (linkConfig.linkField.type) {
          case "field": {
            // フィールドタイプの場合：置換文字列を構築してリンクURLを生成
            const replacementStrings = buildReplacementStrings(
              linkConfig.replacements,
              event.record,
            );
            const linkUrl = encodeURI(
              replaceString(linkConfig.baseUrl, replacementStrings),
            );
            const linkField = validateField(
              event.record,
              linkConfig.linkField.fieldCd,
              "linkConfig.linkField.fieldCd",
            );
            linkField.value = linkUrl;
            break;
          }
          case "table": {
            // テーブルタイプの場合：各行に対してリンクURLを生成
            const tableData = validateTable(
              event.record,
              linkConfig.linkField.tableCd,
            );
            for (const tableRecord of tableData.value) {
              // テーブル行とメインレコードの両方を使用して置換文字列を構築
              const replacementStrings = buildReplacementStrings(
                linkConfig.replacements,
                event.record,
                tableRecord,
              );
              const linkUrl = encodeURI(
                replaceString(linkConfig.baseUrl, replacementStrings),
              );
              const linkField = validateField(
                tableRecord.value,
                linkConfig.linkField.fieldCd,
                `テーブル:${linkConfig.linkField.tableCd}`,
              );
              linkField.value = linkUrl;
            }
            break;
          }
          default:
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
  kintone.events.on(["app.record.detail.show"], (event) => {
    console.log(event);

    // 詳細画面でリンク要素にクリックイベントとスタイルを設定
    for (const linkConfig of LINK_CONFIGS) {
      switch (linkConfig.linkField.type) {
        case "field": {
          // フィールドタイプの場合：DOM要素を取得してリンク設定
          const linkField = validateField(
            event.record,
            linkConfig.linkField.fieldCd,
            "linkConfig.linkField.fieldCd",
          );
          const linkEl = kintone.app.record.getFieldElement(
            linkConfig.linkField.fieldCd,
          );
          if (!linkEl) {
            handleError(
              `指定の項目の要素が取得できません:${linkConfig.linkField.fieldCd}`,
            );
          }
          setLinkElement(linkEl, linkConfig.style, linkField.value);
          break;
        }
        case "table": {
          // テーブルの場合、何もしない
          break;
        }
        default:
          handleError(
            `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`,
          );
      }
    }
    return event;
  });

  /**
   * 一覧画面　表示時
   */
  kintone.events.on(["app.record.index.show"], (event) => {
    console.log(event);

    // 一覧表示以外は処理しない
    if (event.viewType !== "list") return;

    // 一覧画面の各行にリンク設定を適用
    for (const linkConfig of LINK_CONFIGS) {
      switch (linkConfig.linkField.type) {
        case "field": {
          // フィールドタイプの場合：一覧の各行のDOM要素を取得
          const linkEls = kintone.app.getFieldElements(
            linkConfig.linkField.fieldCd,
          );
          if (!linkEls || linkEls.length === 0) {
            console.warn(
              `指定の項目がありません:${linkConfig.linkField.fieldCd}`,
            );
            continue;
          }
          // 各レコードに対応するDOM要素にリンク設定
          for (const [idx, record] of event.records.entries()) {
            const linkField = record[linkConfig.linkField.fieldCd];
            if (linkField.value) {
              const linkEl = linkEls[idx];
              setLinkElement(linkEl, linkConfig.style, linkField.value);
            }
          }
          break;
        }
        case "table": {
          // テーブルの場合、何もしない
          break;
        }
        default:
          handleError(
            `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`,
          );
      }
    }
    return event;
  });

  /**
   * 一覧画面　編集開始時
   */
  kintone.events.on(["app.record.index.edit.show"], (event) => {
    console.log(event);

    // 一覧編集開始時：リンクフィールドを編集不可に設定
    for (const linkConfig of LINK_CONFIGS) {
      switch (linkConfig.linkField.type) {
        case "field": {
          const linkField = event.record[linkConfig.linkField.fieldCd];
          if (linkField) {
            linkField.disabled = true;
          }
          break;
        }
        case "table": {
          // テーブルの場合、何もしない
          break;
        }
        default:
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
   * フィールドの存在チェック
   */
  function validateField(record, fieldCd, errorComment = null) {
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
   * テーブルの存在チェック
   */
  function validateTable(record, tableCd) {
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
          // メインレコードのフィールドから値を取得
          const field = validateField(
            record,
            replacement.fieldCd,
            `replacements.${key}`,
          );
          replacementStrings[key] = field.value;
          break;
        }
        case "table": {
          // テーブル行のフィールドから値を取得
          if (!tableRecord) {
            handleError("テーブルレコードが指定されていません。");
          }
          const field = validateField(
            tableRecord.value,
            replacement.fieldCd,
            `replacements.${key}（テーブル内）`,
          );
          replacementStrings[key] = field.value;
          break;
        }
        case "fixed":
          // 固定値を設定
          replacementStrings[key] = replacement.value;
          break;
        default:
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
        const linkField = validateField(
          record,
          linkConfig.linkField.fieldCd,
          "linkConfig.linkField.fieldCd",
        );
        linkField.disabled = true;
        break;
      }
      case "table": {
        // テーブルタイプの場合：テーブル内の全行のリンクフィールドを編集不可に設定
        const tableData = validateTable(record, linkConfig.linkField.tableCd);
        for (const tableRecord of tableData.value) {
          const linkField = validateField(
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
      return variables[key.trim()] || match;
    });
  }
})();
