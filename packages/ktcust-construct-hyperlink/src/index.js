(() => {
  /***************************************
   * 設定項目　ここから
   ***************************************/
  // アプリ内テーブルについては、kintoneAPIで要素取得ができないため、
  // https://, http:// 以外のURLを指定しても、リンク表示ができません
  // ※https://, http://　については、kintoneの挙動としてURLリンクになります。

  const LINK_CONFIGS = [
    {
      linkField: { type: "field", fieldCd: "GoogleMapsへのリンク" },
      baseUrl: "https://www.google.com/${path}${address}",
      replacements: {
        path: { type: "fixed", value: "maps/place/" },
        address: { type: "field", fieldCd: "住所" },
      },
      style: "color: red;",
    },
    {
      linkField: { type: "field", fieldCd: "ファイルサーバへのリンク" },
      baseUrl: "file://ebisu\\${ankenno}",
      replacements: {
        ankenno: { type: "field", fieldCd: "案件番号" },
      },
      style: "color: blue;",
    },
    {
      linkField: {
        type: "table",
        tableCd: "テーブル",
        fieldCd: "明細Googleマップへのリンク",
      },
      baseUrl: "https://www.google.com/maps/place/${city}${address}",
      replacements: {
        city: { type: "field", fieldCd: "明細リンク固定値" },
        address: { type: "table", fieldCd: "明細住所" },
      },
      style: "color: green;",
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

      for (const linkConfig of LINK_CONFIGS) {
        switch (linkConfig.linkField.type) {
          case "field": {
            // リンク用フィールドを編集不可に
            const linkField = event.record[linkConfig.linkField.fieldCd];
            if (!linkField) {
              const msg = `指定の項目がありません:${linkConfig.linkField.fieldCd}`;
              alert(msg);
              throw new Error(msg);
            }

            linkField.disabled = true;
            break;
          }
          case "table": {
            // テーブル内のリンク用フィールドを編集不可に
            const tableCd = linkConfig.linkField.tableCd;
            if (!tableCd) {
              const msg = "linkConfig.linkField.tableCdが設定されていません。";
              alert(msg);
              throw new Error(msg);
            }
            const fieldCd = linkConfig.linkField.fieldCd;
            if (!fieldCd) {
              const msg = "linkConfig.linkField.fieldCdが設定されていません。";
              alert(msg);
              throw new Error(msg);
            }
            const tableData = event.record[linkConfig.linkField.tableCd];
            if (!tableData || tableData.type !== "SUBTABLE") {
              const msg = `テーブル"${linkConfig.linkField.tableCd}"がアプリに定義されていません。`;
              alert(msg);
              throw new Error(msg);
            }
            // テーブルの各行を設定
            for (const tableRecord of tableData.value) {
              const linkField = tableRecord.value[linkConfig.linkField.fieldCd];
              if (!linkField) {
                const msg = `テーブル"${linkConfig.linkField.tableCd}"に項目"${linkConfig.linkField.fieldCd}"が定義されていません。`;
                alert(msg);
                throw new Error(msg);
              }
              linkField.disabled = true; // 編集不可
            }
            break;
          }
          default: {
            const msg = `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`;
            alert(msg);
            throw new Error(msg);
          }
        }
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

      for (const linkConfig of LINK_CONFIGS) {
        // typeに応じてリンクの文字列構成・設定
        switch (linkConfig.linkField.type) {
          case "field": {
            // 文字パラメータを用意
            const keys = Object.keys(linkConfig.replacements);
            const replacementStrings = {};
            for (const key of keys) {
              switch (linkConfig.replacements[key].type) {
                case "field": {
                  const field =
                    event.record[linkConfig.replacements[key].fieldCd];
                  if (!field) {
                    const msg = `指定の項目がありません:${linkConfig.replacements[key].fieldCd}`;
                    alert(msg);
                    throw new Error(msg);
                  }
                  replacementStrings[key] = field.value;
                  break;
                }
                case "fixed":
                  replacementStrings[key] = linkConfig.replacements[key].value;
                  break;

                default: {
                  const errMsg = `設定が不正です: replacements.${key}.type が ${linkConfig.replacements[key].type}`;
                  alert(errMsg);
                  throw new Error(errMsg);
                }
              }
            }

            // リンクのURLを構成
            const linkUrl = encodeURI(
              replaceString(linkConfig.baseUrl, replacementStrings),
            );

            // 指定フィールドにリンクを設定
            const linkField = event.record[linkConfig.linkField.fieldCd];
            if (!linkField) {
              const msg = `指定の項目がありません:${linkConfig.linkField.fieldCd}`;
              alert(msg);
              throw new Error(msg);
            }
            linkField.value = linkUrl; // 項目の値として設定
            break;
          }
          case "table": {
            // tableの場合
            const tableCd = linkConfig.linkField.tableCd;
            if (!tableCd) {
              const msg = "linkConfig.linkField.tableCdが設定されていません。";
              alert(msg);
              throw new Error(msg);
            }
            const fieldCd = linkConfig.linkField.fieldCd;
            if (!fieldCd) {
              const msg = "linkConfig.linkField.fieldCdが設定されていません。";
              alert(msg);
              throw new Error(msg);
            }
            const tableData = event.record[linkConfig.linkField.tableCd];
            if (!tableData || tableData.type !== "SUBTABLE") {
              const msg = `テーブル"${linkConfig.linkField.tableCd}"がアプリに定義されていません。`;
              alert(msg);
              throw new Error(msg);
            }

            // テーブルの各行を設定
            for (const tableRecord of tableData.value) {
              // 文字パラメータを用意
              const keys = Object.keys(linkConfig.replacements);
              const replacementStrings = {};
              for (const key of keys) {
                switch (linkConfig.replacements[key].type) {
                  case "table": {
                    const field =
                      tableRecord.value[linkConfig.replacements[key].fieldCd];
                    if (!field) {
                      const msg = `指定の項目がありません:${linkConfig.replacements[key].fieldCd}`;
                      alert(msg);
                      throw new Error(msg);
                    }
                    replacementStrings[key] = field.value;
                    break;
                  }
                  case "field": {
                    const field =
                      event.record[linkConfig.replacements[key].fieldCd];
                    if (!field) {
                      const msg = `指定の項目がありません:${linkConfig.replacements[key].fieldCd}`;
                      alert(msg);
                      throw new Error(msg);
                    }
                    replacementStrings[key] = field.value;
                    break;
                  }
                  case "fixed":
                    replacementStrings[key] =
                      linkConfig.replacements[key].value;
                    break;

                  default: {
                    const errMsg = `設定が不正です: replacements.${key}.type が ${linkConfig.replacements[key].type}`;
                    alert(errMsg);
                    throw new Error(errMsg);
                  }
                }
              }

              // リンクのURLを構成
              const linkUrl = encodeURI(
                replaceString(linkConfig.baseUrl, replacementStrings),
              );

              // 指定フィールドにリンクを設定
              const linkField = tableRecord.value[linkConfig.linkField.fieldCd];
              if (!linkField) {
                const msg = `テーブル"${linkConfig.linkField.tableCd}"に項目"${linkConfig.linkField.fieldCd}"が定義されていません。`;
                alert(msg);
                throw new Error(msg);
              }
              linkField.value = linkUrl; // 項目の値として設定
            }
            break;
          }
          default: {
            const msg = `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`;
            alert(msg);
            throw new Error(msg);
          }
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

    for (const linkConfig of LINK_CONFIGS) {
      switch (linkConfig.linkField.type) {
        case "field": {
          // 指定フィールドにリンクを設定
          const linkField = event.record[linkConfig.linkField.fieldCd];
          const linkEl = kintone.app.record.getFieldElement(
            linkConfig.linkField.fieldCd,
          );
          if (!linkField || !linkEl) {
            const msg = `指定の項目がありません:${linkConfig.linkField.fieldCd}`;
            alert(msg);
            throw new Error(msg);
          }
          setLinkElement(linkEl, linkConfig.style, linkField.value);
          break;
        }
        case "table": {
          // テーブルの場合、何もしない
          break;
        }
        default: {
          const msg = `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`;
          alert(msg);
          throw new Error(msg);
        }
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

    for (const linkConfig of LINK_CONFIGS) {
      switch (linkConfig.linkField.type) {
        case "field": {
          // 指定項目の要素の配列を取得
          const linkEls = kintone.app.getFieldElements(
            linkConfig.linkField.fieldCd,
          );
          if (!linkEls || linkEls.length === 0) {
            const msg = `指定の項目がありません:${linkConfig.linkField.fieldCd}`;
            console.warn(msg);
            continue;
          }
          // 行ごとにデータを確認し、対応する要素にリンクを設定
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
        default: {
          const msg = `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`;
          alert(msg);
          throw new Error(msg);
        }
      }
    }
    return event;
  });

  /**
   * 一覧画面　編集開始時
   */
  kintone.events.on(["app.record.index.edit.show"], (event) => {
    console.log(event);

    // リンク設定用要素を編集不可に設定
    for (const linkConfig of LINK_CONFIGS) {
      switch (linkConfig.linkField.type) {
        case "field": {
          const linkField = event.record[linkConfig.linkField];
          if (linkField) {
            linkField.disabled = true; // 編集不可
          }
          break;
        }
        case "table": {
          // テーブルの場合、何もしない
          break;
        }
        default: {
          const msg = `linkConfig.linkField.typeの設定が不正です:${linkConfig.linkField.type}`;
          alert(msg);
          throw new Error(msg);
        }
      }
    }
    return event;
  });

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
      // スタイル設定
      if (styleCssText) {
        const stylingEl = findStylingElement(linkEl);
        if (stylingEl) stylingEl.style.cssText = styleCssText;
      }
      // リンクを設定
      linkEl.addEventListener("click", () => {
        window.open(linkParamValue, "_blank");
      });
      // マウスオーバー時のアイコン設定
      linkEl.addEventListener("mouseover", () => {
        linkEl.style.cursor = "pointer";
      });
    }
  }

  /**
   * 文字列の差込処理
   */
  function replaceString(template, variables) {
    return template.replace(/\$\{([^}]+)\}/g, (match, key) => {
      return variables[key.trim()] || match;
    });
  }
})();
