import {
  type LinkConfig,
  type PluginConfig,
  pluginConfigSchema,
} from "@/src/types";
import { describe, expect, it } from "vitest";

describe("型定義", () => {
  describe("pluginConfigSchema", () => {
    it("有効な設定を検証する", () => {
      const validConfig: PluginConfig = {
        linkConfigs: [
          {
            linkFieldCode: "link_field",
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field",
            urlPostfix: "?param=value",
            style: "color: blue;",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("空のurlPostfixを許可する", () => {
      const validConfig: PluginConfig = {
        linkConfigs: [
          {
            linkFieldCode: "link_field",
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field",
            urlPostfix: "",
            style: "",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("空のstyleを許可する", () => {
      const validConfig: PluginConfig = {
        linkConfigs: [
          {
            linkFieldCode: "link_field",
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field",
            urlPostfix: "?param=value",
            style: "",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("空のlinkFieldCodeを拒否する", () => {
      const invalidConfig = {
        linkConfigs: [
          {
            linkFieldCode: "",
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field",
            urlPostfix: "?param=value",
            style: "color: blue;",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("空のurlPrefixを拒否する", () => {
      const invalidConfig = {
        linkConfigs: [
          {
            linkFieldCode: "link_field",
            urlPrefix: "",
            urlPartsFieldCode: "id_field",
            urlPostfix: "?param=value",
            style: "color: blue;",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("空のurlPartsFieldCodeを拒否する", () => {
      const invalidConfig = {
        linkConfigs: [
          {
            linkFieldCode: "link_field",
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "",
            urlPostfix: "?param=value",
            style: "color: blue;",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("空のlinkConfigs配列を拒否する", () => {
      const invalidConfig = {
        linkConfigs: [],
      };

      const result = pluginConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("複数のリンク設定を検証する", () => {
      const validConfig: PluginConfig = {
        linkConfigs: [
          {
            linkFieldCode: "link_field_1",
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field_1",
            urlPostfix: "?param=value1",
            style: "color: blue;",
          },
          {
            linkFieldCode: "link_field_2",
            urlPrefix: "https://another.com/",
            urlPartsFieldCode: "id_field_2",
            urlPostfix: "",
            style: "color: red;",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("必須フィールドが欠けている設定を拒否する", () => {
      const invalidConfig = {
        linkConfigs: [
          {
            linkFieldCode: "link_field",
            urlPrefix: "https://example.com/",
            // urlPartsFieldCodeが欠けている
            urlPostfix: "?param=value",
            style: "color: blue;",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("無効なデータ型の設定を拒否する", () => {
      const invalidConfig = {
        linkConfigs: [
          {
            linkFieldCode: 123, // 文字列である必要がある
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field",
            urlPostfix: "?param=value",
            style: "color: blue;",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("linkConfigSchemaの個別のプロパティをテストする", () => {
      // 各プロパティの型チェック
      const validLinkConfig = {
        linkFieldCode: "valid_link_field",
        urlPrefix: "https://valid.com/",
        urlPartsFieldCode: "valid_parts_field",
        urlPostfix: "?valid=param",
        style: "color: red;",
      };

      // 直接linkConfigSchemaをテスト
      const result = pluginConfigSchema.safeParse({
        linkConfigs: [validLinkConfig],
      });
      expect(result.success).toBe(true);
    });

    it("urlPostfixが省略された場合は無効", () => {
      const configWithUndefinedPostfix = {
        linkConfigs: [
          {
            linkFieldCode: "link_field",
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field",
            // urlPostfixを省略
            style: "color: blue;",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(configWithUndefinedPostfix);
      expect(result.success).toBe(false);
    });

    it("styleが省略された場合は無効", () => {
      const configWithUndefinedStyle = {
        linkConfigs: [
          {
            linkFieldCode: "link_field",
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field",
            urlPostfix: "?param=value",
            // styleを省略
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(configWithUndefinedStyle);
      expect(result.success).toBe(false);
    });

    it("nullの値を拒否する", () => {
      const configWithNull = {
        linkConfigs: [
          {
            linkFieldCode: null,
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field",
            urlPostfix: "?param=value",
            style: "color: blue;",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(configWithNull);
      expect(result.success).toBe(false);
    });

    it("undefinedの値を拒否する", () => {
      const configWithUndefined = {
        linkConfigs: [
          {
            linkFieldCode: undefined,
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field",
            urlPostfix: "?param=value",
            style: "color: blue;",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(configWithUndefined);
      expect(result.success).toBe(false);
    });

    it("追加のプロパティがあっても有効", () => {
      const configWithExtraProperty = {
        linkConfigs: [
          {
            linkFieldCode: "link_field",
            urlPrefix: "https://example.com/",
            urlPartsFieldCode: "id_field",
            urlPostfix: "?param=value",
            style: "color: blue;",
            extraProperty: "この値は無視される",
          },
        ],
        extraTopLevelProperty: "この値も無視される",
      };

      const result = pluginConfigSchema.safeParse(configWithExtraProperty);
      expect(result.success).toBe(true);
    });

    it("非常に長い文字列でも有効", () => {
      const longString = "a".repeat(10000);
      const configWithLongStrings = {
        linkConfigs: [
          {
            linkFieldCode: longString,
            urlPrefix: longString,
            urlPartsFieldCode: longString,
            urlPostfix: longString,
            style: longString,
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(configWithLongStrings);
      expect(result.success).toBe(true);
    });

    it("特殊文字を含む文字列でも有効", () => {
      const configWithSpecialChars = {
        linkConfigs: [
          {
            linkFieldCode: "フィールド_field-123",
            urlPrefix: "https://テスト.example.com/",
            urlPartsFieldCode: "部品_parts-456",
            urlPostfix: "?パラメータ=値&test=特殊文字",
            style: "color: #ff0000; /* コメント */",
          },
        ],
      };

      const result = pluginConfigSchema.safeParse(configWithSpecialChars);
      expect(result.success).toBe(true);
    });

    it("linkConfigsがnullの場合を拒否する", () => {
      const configWithNullLinkConfigs = {
        linkConfigs: null,
      };

      const result = pluginConfigSchema.safeParse(configWithNullLinkConfigs);
      expect(result.success).toBe(false);
    });

    it("完全に空のオブジェクトを拒否する", () => {
      const emptyConfig = {};

      const result = pluginConfigSchema.safeParse(emptyConfig);
      expect(result.success).toBe(false);
    });

    it("TypeScriptの型推論が正しく動作する", () => {
      // これは実行時テストではなく、型の推論をテストする
      const validConfig: PluginConfig = {
        linkConfigs: [
          {
            linkFieldCode: "test",
            urlPrefix: "https://test.com/",
            urlPartsFieldCode: "parts",
            urlPostfix: "",
            style: "",
          },
        ],
      };

      // LinkConfig型の推論をテスト
      const linkConfig: LinkConfig = validConfig.linkConfigs[0];

      expect(typeof linkConfig.linkFieldCode).toBe("string");
      expect(typeof linkConfig.urlPrefix).toBe("string");
      expect(typeof linkConfig.urlPartsFieldCode).toBe("string");
      expect(typeof linkConfig.urlPostfix).toBe("string");
      expect(typeof linkConfig.style).toBe("string");
    });
  });
});
