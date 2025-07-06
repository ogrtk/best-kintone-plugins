import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorFallback } from "@/src/ErrorFallback";

describe("ErrorFallback", () => {
  it("エラーメッセージが表示される", () => {
    const mockError = new Error("テストエラーメッセージ");
    const mockResetErrorBoundary = vi.fn();

    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    // エラーメッセージが表示されることを確認
    expect(screen.getByText("エラーが発生しました:")).toBeTruthy();
    expect(screen.getByText("テストエラーメッセージ")).toBeTruthy();
  });

  it("再試行ボタンが表示される", () => {
    const mockError = new Error("テストエラー");
    const mockResetErrorBoundary = vi.fn();

    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    // 再試行ボタンが表示されることを確認
    const retryButton = screen.getByText("再試行");
    expect(retryButton).toBeTruthy();
    expect(retryButton).toHaveAttribute("type", "button");
  });

  it("再試行ボタンをクリックするとresetErrorBoundaryが呼ばれる", () => {
    const mockError = new Error("テストエラー");
    const mockResetErrorBoundary = vi.fn();

    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    // 再試行ボタンをクリック
    const retryButton = screen.getByText("再試行");
    fireEvent.click(retryButton);

    // resetErrorBoundaryが呼ばれることを確認
    expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it("role属性が正しく設定される", () => {
    const mockError = new Error("テストエラー");
    const mockResetErrorBoundary = vi.fn();

    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    // role="alert"が設定されることを確認
    const alertDiv = screen.getByRole("alert");
    expect(alertDiv).toBeTruthy();
  });

  it("複数行のエラーメッセージが正しく表示される", () => {
    const mockError = new Error("行1\n行2\n行3");
    const mockResetErrorBoundary = vi.fn();

    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    // preタグでエラーメッセージが表示されることを確認（改行を含むテキストを正しく検索）
    const preElement = screen.getByText((content, element) => {
      return element?.tagName === "PRE" && content.includes("行1") && content.includes("行2") && content.includes("行3");
    });
    expect(preElement.tagName).toBe("PRE");
  });

  it("空のエラーメッセージでも正常に動作する", () => {
    const mockError = new Error("");
    const mockResetErrorBoundary = vi.fn();

    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );

    // 基本的な要素が表示されることを確認
    expect(screen.getByText("エラーが発生しました:")).toBeTruthy();
    expect(screen.getByText("再試行")).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});