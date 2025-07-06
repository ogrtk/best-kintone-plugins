import { describe, it, expect } from "vitest";
import { pluginConfigSchema, type PluginConfig, type LinkConfig } from "@/src/types";

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
  });
});