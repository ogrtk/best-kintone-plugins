(() => {
  // pluginに保存した設定情報を取得
  const LINK_CONFIGS = [
    {
      linkFieldCode: "GoogleMapsへのリンク",
      urlPrefix: "https://www.google.com/maps/place/",
      urlPartsFieldCode: "住所",
      urlPostfix: "",
      style: "color: red;",
    },
    {
      linkFieldCode: "ファイルサーバへのリンク",
      urlPrefix: "file://ebisu\\",
      urlPartsFieldCode: "案件番号",
      urlPostfix: "",
      style: "color: blue;",
    },
  ];

  /**
   * 登録・更新画面　表示時
   */
  kintone.events.on(
    ["app.record.edit.show", "app.record.create.show"],
    (event) => {
      console.log(event);

      for (const linkConfig of LINK_CONFIGS) {
        // リンク用フィールドを非表示に
        const linkField = event.record[linkConfig.linkFieldCode];
        if (!linkField) {
          const msg = `指定の項目がありません:${linkConfig.linkFieldCode}`;
          alert(msg);
          throw new Error(msg);
        }

        linkField.disabled = true; // 編集不可
        kintone.app.record.setFieldShown(linkConfig.linkFieldCode, false); // 非表示
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
        // リンクするURLを構成
        if (!event.record[linkConfig.urlPartsFieldCode]) {
          const msg = `指定の項目がありません:${linkConfig.urlPartsFieldCode}`;
          alert(msg);
          throw new Error(msg);
        }
        const fieldData = event.record[linkConfig.urlPartsFieldCode].value;

        const linkUrl = fieldData
          ? encodeURI(linkConfig.urlPrefix + fieldData + linkConfig.urlPostfix)
          : "";

        // 指定フィールドにリンクを設定
        const linkField = event.record[linkConfig.linkFieldCode];
        if (!linkField) {
          const msg = `指定の項目がありません:${linkConfig.linkFieldCode}`;
          alert(msg);
          throw new Error(msg);
        }
        linkField.value = linkUrl; // 項目の値として設定
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
      // 指定フィールドにリンクを設定
      const linkField = event.record[linkConfig.linkFieldCode];
      const linkEl = kintone.app.record.getFieldElement(
        linkConfig.linkFieldCode,
      );
      if (!linkField || !linkEl) {
        const msg = `指定の項目がありません:${linkConfig.linkFieldCode}`;
        alert(msg);
        throw new Error(msg);
      }
      setLinkElement(linkEl, linkConfig.style, linkField.value);
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
      // 指定項目の要素の配列を取得
      const linkEls = kintone.app.getFieldElements(linkConfig.linkFieldCode);
      if (!linkEls || linkEls.length === 0) {
        const msg = `指定の項目がありません:${linkConfig.linkFieldCode}`;
        console.warn(msg);
        continue;
      }
      // 行ごとにデータを確認し、対応する要素にリンクを設定
      for (const [idx, record] of event.records.entries()) {
        const linkField = record[linkConfig.linkFieldCode];
        if (linkField.value) {
          const linkEl = linkEls[idx];
          setLinkElement(linkEl, linkConfig.style, linkField.value);
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
      // for (const record of event.records) {
      const linkField = event.record[linkConfig.linkFieldCode];
      if (linkField) {
        linkField.disabled = true; // 編集不可
      }
      // }
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
})(kintone.$PLUGIN_ID);
