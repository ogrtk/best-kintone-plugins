import { App } from "@/src/config/components/App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

// KintoneLikeTableのモック
vi.mock("@ogrtk/shared/components", () => ({
  KintoneLikeTable: ({
    label,
    description,
    name,
  }: { label: string; description: string; name: string }) => (
    <div data-testid="kintone-like-table">
      <div data-testid="table-label">{label}</div>
      <div data-testid="table-description">{description}</div>
      <div data-testid="table-name">{name}</div>
    </div>
  ),
}));

// kintone-utilsのモック
vi.mock("@ogrtk/shared/kintone-utils", () => ({
  KintoneFieldsRetriever: vi.fn().mockImplementation(() => ({
    getSingleTextFields: vi.fn().mockResolvedValue([
      { value: "field1", label: "Field 1" },
      { value: "field2", label: "Field 2" },
    ]),
  })),
  restorePluginConfig: vi.fn().mockReturnValue({
    success: true,
    data: {
      linkConfigs: [
        {
          linkFieldCode: "link_field",
          urlPrefix: "https://example.com/",
          urlPartsFieldCode: "id_field",
          urlPostfix: "",
          style: "",
        },
      ],
    },
  }),
  storePluginConfig: vi.fn().mockImplementation((data, callback) => {
    callback();
  }),
}));

// kintoneオブジェクトのモック
global.kintone = {
  app: {
    getId: vi.fn(() => 1),
  } as unknown as typeof kintone.app,
} as unknown as typeof kintone;

// window.location.hrefのモック
Object.defineProperty(window, "location", {
  value: {
    href: "",
  },
  writable: true,
});

// alertのモック
global.alert = vi.fn();

describe("App コンポーネント", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  it("正常にレンダリングされる", async () => {
    renderWithQueryClient(<App PLUGIN_ID="test-plugin-id" />);

    await waitFor(() => {
      expect(screen.getByTestId("kintone-like-table")).toBeTruthy();
    });

    expect(screen.getByTestId("table-label")).toHaveTextContent("リンクの設定");
    expect(screen.getByTestId("table-description")).toHaveTextContent(
      "リンクを配置するスペースと項目等の情報を設定してください。",
    );
    expect(screen.getByTestId("table-name")).toHaveTextContent("linkConfigs");
  });

  it("保存ボタンがレンダリングされる", async () => {
    renderWithQueryClient(<App PLUGIN_ID="test-plugin-id" />);

    await waitFor(() => {
      const saveButton = screen.getByDisplayValue("設定を保存");
      expect(saveButton).toBeTruthy();
      expect(saveButton).toHaveAttribute("type", "submit");
    });
  });

  it("フォーム送信時にstorePluginConfigが呼ばれる", async () => {
    const { storePluginConfig } = await import("@ogrtk/shared/kintone-utils");

    renderWithQueryClient(<App PLUGIN_ID="test-plugin-id" />);

    await waitFor(() => {
      const saveButton = screen.getByDisplayValue("設定を保存");
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(storePluginConfig).toHaveBeenCalled();
    });
  });

  it("設定保存成功時にアラートが表示される", async () => {
    renderWithQueryClient(<App PLUGIN_ID="test-plugin-id" />);

    await waitFor(() => {
      const saveButton = screen.getByDisplayValue("設定を保存");
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        "保存しました。反映のため、アプリを更新してください",
      );
    });
  });

  it("設定保存成功時にリダイレクトされる", async () => {
    renderWithQueryClient(<App PLUGIN_ID="test-plugin-id" />);

    await waitFor(() => {
      const saveButton = screen.getByDisplayValue("設定を保存");
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(window.location.href).toBe("../../flow?app=1");
    });
  });

  it("設定エラーがある場合、エラーメッセージが表示される", async () => {
    // エラーのある設定を返すモック
    const { restorePluginConfig } = await import("@ogrtk/shared/kintone-utils");
    vi.mocked(restorePluginConfig).mockReturnValue({
      success: false,
      error: new ZodError([
        {
          code: "invalid_type",
          expected: "array",
          received: "undefined",
          path: ["linkConfigs"],
          message: "必須項目です",
        },
      ]),
    });

    renderWithQueryClient(<App PLUGIN_ID="test-plugin-id" />);

    await waitFor(() => {
      const errorMessage = screen.getByText((content, element) => {
        return content.includes("項目：linkConfigs エラー：必須項目です");
      });
      expect(errorMessage).toBeTruthy();
      expect(errorMessage).toHaveClass("kintoneplugin-alert");
    });
  });
});
