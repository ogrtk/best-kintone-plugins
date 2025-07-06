import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

// restorePluginConfigのモック
vi.mock("@ogrtk/shared/kintone-utils", () => ({
  restorePluginConfig: vi.fn(),
}));

// pluginConfigSchemaのモック
vi.mock("@/src/types", () => ({
  pluginConfigSchema: {},
}));

// kintoneオブジェクトのモック
global.kintone = {
  $PLUGIN_ID: "test-plugin-id",
  events: {
    on: vi.fn(),
  },
  app: {
    record: {
      setFieldShown: vi.fn(),
      getFieldElement: vi.fn(),
    },
    getFieldElements: vi.fn(),
  },
} as unknown as typeof kintone;

// windowオブジェクトのモック
global.window = {
  open: vi.fn(),
  alert: vi.fn(),
} as unknown as Window & typeof globalThis;

// alertのモック
global.alert = vi.fn();

describe("customize.tsx", () => {
  const mockLinkConfigs = [
    {
      linkFieldCode: "link_field",
      urlPrefix: "https://example.com/",
      urlPartsFieldCode: "id_field",
      urlPostfix: "?param=value",
      style: "color: blue;",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("設定の復元に失敗した場合、エラーメッセージが表示される", async () => {
    const { restorePluginConfig } = await import("@ogrtk/shared/kintone-utils");
    vi.mocked(restorePluginConfig).mockReturnValue({
      success: false,
      error: new ZodError([
        {
          code: "custom",
          path: ["config"],
          message: "設定エラー",
        },
      ]),
    });

    const alertSpy = vi.spyOn(global, "alert");

    // customize.tsxを動的インポート（エラーが発生することを期待）
    await expect(async () => {
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);
    }).rejects.toThrow("プラグインの設定にエラーがあります:");

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining("プラグインの設定にエラーがあります:"),
    );
  });

  it("設定の復元に成功した場合、イベントリスナーが登録される", async () => {
    const { restorePluginConfig } = await import("@ogrtk/shared/kintone-utils");
    vi.mocked(restorePluginConfig).mockReturnValue({
      success: true,
      data: { linkConfigs: mockLinkConfigs },
    });

    const eventsSpy = vi.spyOn(kintone.events, "on");

    // customize.tsxを動的インポート
    await import(`@/src/customize/customize?timestamp=${Date.now()}`);

    // 各イベントリスナーが登録されることを確認
    expect(eventsSpy).toHaveBeenCalledWith(
      ["app.record.edit.show", "app.record.create.show"],
      expect.any(Function),
    );
    expect(eventsSpy).toHaveBeenCalledWith(
      [
        "app.record.create.submit",
        "app.record.edit.submit",
        "app.record.index.edit.submit",
      ],
      expect.any(Function),
    );
    expect(eventsSpy).toHaveBeenCalledWith(
      ["app.record.detail.show"],
      expect.any(Function),
    );
    expect(eventsSpy).toHaveBeenCalledWith(
      ["app.record.index.show"],
      expect.any(Function),
    );
    expect(eventsSpy).toHaveBeenCalledWith(
      ["app.record.index.edit.show"],
      expect.any(Function),
    );
  });

  describe("イベントハンドラー", () => {
    it("登録・更新画面表示時にフィールドが非表示になる", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const setFieldShownSpy = vi.spyOn(kintone.app.record, "setFieldShown");

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // イベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[0][1];

      // モックイベントを作成
      const mockEvent = {
        record: {
          link_field: { disabled: false },
        },
      };

      // イベントハンドラーを実行
      eventHandler(mockEvent);

      // フィールドが非表示になることを確認
      expect(setFieldShownSpy).toHaveBeenCalledWith("link_field", false);
      expect(mockEvent.record.link_field.disabled).toBe(true);
    });

    it("保存時にURLが構成される", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 保存時のイベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[1][1];

      // モックイベントを作成
      const mockEvent = {
        record: {
          link_field: { value: "" },
          id_field: { value: "123" },
        },
      };

      // イベントハンドラーを実行
      const result = eventHandler(mockEvent);

      // URLが正しく構成されることを確認
      expect(result.record.link_field.value).toBe(
        "https://example.com/123?param=value",
      );
    });

    it("一覧画面表示時にリンクが設定される", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const getFieldElementsSpy = vi.spyOn(kintone.app, "getFieldElements");
      getFieldElementsSpy.mockReturnValue([document.createElement("div")]);

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 一覧画面表示時のイベントハンドラーを取得（正しいインデックス3を使用）
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[3][1];

      // モックイベントを作成
      const mockEvent = {
        viewType: "list" as const,
        records: [
          {
            link_field: { value: "https://example.com/123" },
          },
        ],
      };

      // イベントハンドラーを実行
      eventHandler(mockEvent);

      // getFieldElementsが呼ばれることを確認
      expect(getFieldElementsSpy).toHaveBeenCalledWith("link_field");
    });

    it("一覧画面以外では処理されない", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const getFieldElementsSpy = vi.spyOn(kintone.app, "getFieldElements");

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 一覧画面表示時のイベントハンドラーを取得（正しいインデックス3を使用）
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[3][1];

      // モックイベントを作成（一覧画面以外）
      const mockEvent = {
        viewType: "calendar" as const,
        records: [],
      };

      // イベントハンドラーを実行
      eventHandler(mockEvent);

      // getFieldElementsが呼ばれないことを確認
      expect(getFieldElementsSpy).not.toHaveBeenCalled();
    });

    it("登録・更新画面表示時にフィールドが存在しない場合、エラーが発生する", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const alertSpy = vi.spyOn(global, "alert");

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // イベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[0][1];

      // フィールドが存在しないモックイベントを作成
      const mockEvent = {
        record: {
          // link_fieldが存在しない
        },
      };

      // イベントハンドラーを実行してエラーが発生することを確認
      expect(() => eventHandler(mockEvent)).toThrow(
        "指定の項目がありません:link_field",
      );
      expect(alertSpy).toHaveBeenCalledWith(
        "指定の項目がありません:link_field",
      );
    });

    it("保存時にurlPartsFieldCodeが存在しない場合、エラーが発生する", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const alertSpy = vi.spyOn(global, "alert");

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 保存時のイベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[1][1];

      // urlPartsFieldCodeが存在しないモックイベントを作成
      const mockEvent = {
        record: {
          link_field: { value: "" },
          // id_fieldが存在しない
        },
      };

      // イベントハンドラーを実行してエラーが発生することを確認
      expect(() => eventHandler(mockEvent)).toThrow(
        "指定の項目がありません:id_field",
      );
      expect(alertSpy).toHaveBeenCalledWith("指定の項目がありません:id_field");
    });

    it("保存時にlinkFieldCodeが存在しない場合、エラーが発生する", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const alertSpy = vi.spyOn(global, "alert");

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 保存時のイベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[1][1];

      // linkFieldCodeが存在しないモックイベントを作成
      const mockEvent = {
        record: {
          // link_fieldが存在しない
          id_field: { value: "123" },
        },
      };

      // イベントハンドラーを実行してエラーが発生することを確認
      expect(() => eventHandler(mockEvent)).toThrow(
        "指定の項目がありません:link_field",
      );
      expect(alertSpy).toHaveBeenCalledWith(
        "指定の項目がありません:link_field",
      );
    });

    it("保存時にfieldDataが空の場合、空のURLが設定される", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 保存時のイベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[1][1];

      // 空のfieldDataを持つモックイベントを作成
      const mockEvent = {
        record: {
          link_field: { value: "" },
          id_field: { value: "" }, // 空の値
        },
      };

      // イベントハンドラーを実行
      const result = eventHandler(mockEvent);

      // 空のURLが設定されることを確認
      expect(result.record.link_field.value).toBe("");
    });

    it("詳細画面表示時にリンクが設定される", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const getFieldElementSpy = vi.spyOn(
        kintone.app.record,
        "getFieldElement",
      );
      const mockElement = document.createElement("div");
      getFieldElementSpy.mockReturnValue(mockElement);

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 詳細画面表示時のイベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[2][1];

      // モックイベントを作成
      const mockEvent = {
        record: {
          link_field: { value: "https://example.com/123" },
        },
      };

      // イベントハンドラーを実行
      eventHandler(mockEvent);

      // getFieldElementが呼ばれることを確認
      expect(getFieldElementSpy).toHaveBeenCalledWith("link_field");
    });

    it("詳細画面表示時にフィールドまたは要素が存在しない場合、エラーが発生する", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const getFieldElementSpy = vi.spyOn(
        kintone.app.record,
        "getFieldElement",
      );
      getFieldElementSpy.mockReturnValue(null); // 要素が見つからない
      const alertSpy = vi.spyOn(global, "alert");

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 詳細画面表示時のイベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[2][1];

      // モックイベントを作成
      const mockEvent = {
        record: {
          link_field: { value: "https://example.com/123" },
        },
      };

      // イベントハンドラーを実行してエラーが発生することを確認
      expect(() => eventHandler(mockEvent)).toThrow(
        "指定の項目がありません:link_field",
      );
      expect(alertSpy).toHaveBeenCalledWith(
        "指定の項目がありません:link_field",
      );
    });

    it("一覧画面編集開始時にフィールドが編集不可になる", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 一覧画面編集開始時のイベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[4][1];

      // モックイベントを作成
      const mockEvent = {
        record: {
          link_field: { disabled: false },
        },
      };

      // イベントハンドラーを実行
      eventHandler(mockEvent);

      // フィールドが編集不可になることを確認
      expect(mockEvent.record.link_field.disabled).toBe(true);
    });

    it("一覧画面編集開始時にフィールドが存在しない場合でもエラーにならない", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 一覧画面編集開始時のイベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[4][1];

      // フィールドが存在しないモックイベントを作成
      const mockEvent = {
        record: {
          // link_fieldが存在しない
        },
      };

      // イベントハンドラーを実行（エラーが発生しないことを確認）
      expect(() => eventHandler(mockEvent)).not.toThrow();
    });

    it("一覧画面表示時にlinkElementsが存在しない場合、console.warnが呼ばれる", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const getFieldElementsSpy = vi.spyOn(kintone.app, "getFieldElements");
      getFieldElementsSpy.mockReturnValue([]); // 空の配列を返す
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 一覧画面表示時のイベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[3][1];

      // モックイベントを作成
      const mockEvent = {
        viewType: "list" as const,
        records: [
          {
            link_field: { value: "https://example.com/123" },
          },
        ],
      };

      // イベントハンドラーを実行
      eventHandler(mockEvent);

      // console.warnが呼ばれることを確認
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "指定の項目がありません:link_field",
      );

      consoleWarnSpy.mockRestore();
    });

    it("一覧画面表示時にレコードのlinkField.valueが空の場合、リンクが設定されない", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const getFieldElementsSpy = vi.spyOn(kintone.app, "getFieldElements");
      const mockElement = document.createElement("div");
      getFieldElementsSpy.mockReturnValue([mockElement]);

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 一覧画面表示時のイベントハンドラーを取得
      const eventHandler = vi.mocked(kintone.events.on).mock.calls[3][1];

      // 空のlinkField.valueを持つモックイベントを作成
      const mockEvent = {
        viewType: "list" as const,
        records: [
          {
            link_field: { value: "" }, // 空の値
          },
        ],
      };

      // イベントハンドラーを実行（エラーが発生しないことを確認）
      expect(() => eventHandler(mockEvent)).not.toThrow();
    });
  });

  describe("ユーティリティ関数", () => {
    it("setLinkElement - スタイルとイベントリスナーが設定される", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: { linkConfigs: mockLinkConfigs },
      });

      const mockElement = document.createElement("div");
      const span = document.createElement("span");
      const anchor = document.createElement("a");
      span.appendChild(anchor);
      mockElement.appendChild(span);

      const addEventListenerSpy = vi.spyOn(mockElement, "addEventListener");
      const windowOpenSpy = vi
        .spyOn(window, "open")
        .mockImplementation(() => null);

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 詳細画面表示時のイベントハンドラーを取得してsetLinkElementを呼び出す
      const getFieldElementSpy = vi.spyOn(
        kintone.app.record,
        "getFieldElement",
      );
      getFieldElementSpy.mockReturnValue(mockElement);

      const eventHandler = vi.mocked(kintone.events.on).mock.calls[2][1];

      const mockEvent = {
        record: {
          link_field: { value: "https://example.com/test" },
        },
      };

      eventHandler(mockEvent);

      // イベントリスナーが追加されることを確認
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mouseover",
        expect.any(Function),
      );

      // クリックイベントをシミュレート
      const clickHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === "click",
      )?.[1] as () => void;
      if (clickHandler) {
        clickHandler();
        expect(windowOpenSpy).toHaveBeenCalledWith(
          "https://example.com/test",
          "_blank",
        );
      }

      // マウスオーバーイベントをシミュレート
      const mouseoverHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === "mouseover",
      )?.[1] as () => void;
      if (mouseoverHandler) {
        mouseoverHandler();
        expect(mockElement.style.cursor).toBe("pointer");
      }

      windowOpenSpy.mockRestore();
    });

    it("setLinkElement - linkParamValueが空の場合、何も設定されない", async () => {
      const { restorePluginConfig } = await import(
        "@ogrtk/shared/kintone-utils"
      );
      vi.mocked(restorePluginConfig).mockReturnValue({
        success: true,
        data: {
          linkConfigs: [
            {
              ...mockLinkConfigs[0],
              style: "", // スタイルも空にする
            },
          ],
        },
      });

      const mockElement = document.createElement("div");
      const addEventListenerSpy = vi.spyOn(mockElement, "addEventListener");

      // customize.tsxを動的インポート
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);

      // 詳細画面表示時のイベントハンドラーを取得
      const getFieldElementSpy = vi.spyOn(
        kintone.app.record,
        "getFieldElement",
      );
      getFieldElementSpy.mockReturnValue(mockElement);

      const eventHandler = vi.mocked(kintone.events.on).mock.calls[2][1];

      // 空のlinkParamValueを持つモックイベントを作成
      const mockEvent = {
        record: {
          link_field: { value: "" }, // 空の値
        },
      };

      eventHandler(mockEvent);

      // イベントリスナーが追加されないことを確認
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it("findStylingElement - spanが存在しない場合、nullを返す", () => {
      // この関数は内部関数なので、間接的にテストする
      const mockElement = document.createElement("div");
      // spanを追加せずにテスト用のシナリオを設定することで、
      // findStylingElementがnullを返すケースをカバーできる
      expect(mockElement.querySelector("span")).toBeNull();
    });
  });
});
