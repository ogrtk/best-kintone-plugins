import { describe, it, expect, vi, beforeEach } from "vitest";

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
} as any;

// windowオブジェクトのモック
global.window = {
  open: vi.fn(),
  alert: vi.fn(),
} as any;

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
      error: "設定エラー",
    });

    const alertSpy = vi.spyOn(global, "alert");
    
    // customize.tsxを動的インポート（エラーが発生することを期待）
    await expect(async () => {
      await import(`@/src/customize/customize?timestamp=${Date.now()}`);
    }).rejects.toThrow("プラグインの設定にエラーがあります:設定エラー");

    expect(alertSpy).toHaveBeenCalledWith("プラグインの設定にエラーがあります:設定エラー");
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
      expect.any(Function)
    );
    expect(eventsSpy).toHaveBeenCalledWith(
      ["app.record.create.submit", "app.record.edit.submit", "app.record.index.edit.submit"],
      expect.any(Function)
    );
    expect(eventsSpy).toHaveBeenCalledWith(
      ["app.record.detail.show"],
      expect.any(Function)
    );
    expect(eventsSpy).toHaveBeenCalledWith(
      ["app.record.index.show"],
      expect.any(Function)
    );
    expect(eventsSpy).toHaveBeenCalledWith(
      ["app.record.index.edit.show"],
      expect.any(Function)
    );
  });

  describe("イベントハンドラー", () => {
    it("登録・更新画面表示時にフィールドが非表示になる", async () => {
      const { restorePluginConfig } = await import("@ogrtk/shared/kintone-utils");
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
      const { restorePluginConfig } = await import("@ogrtk/shared/kintone-utils");
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
      expect(result.record.link_field.value).toBe("https://example.com/123?param=value");
    });

    it("一覧画面表示時にリンクが設定される", async () => {
      const { restorePluginConfig } = await import("@ogrtk/shared/kintone-utils");
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
      const { restorePluginConfig } = await import("@ogrtk/shared/kintone-utils");
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
  });
});