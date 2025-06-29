import { z } from "@ogrtk/shared/zod-utils";

/**
 * リンク設定のスキーマ
 */
const linkConfigSchema = z.object({
  linkFieldCode: z.string().nonempty(),
  urlPrefix: z.string().nonempty(),
  urlPartsFieldCode: z.string().nonempty(),
  urlPostfix: z.string(),
  style: z.string(),
});
/**
 * リンク設定
 */
export type LinkConfig = z.infer<typeof linkConfigSchema>;

/**
 * プラグイン設定全体のスキーマ
 */
export const pluginConfigSchema = z.object({
  linkConfigs: z.array(linkConfigSchema).nonempty(),
});
/**
 * プラグイン設定全体
 */
export type PluginConfig = z.infer<typeof pluginConfigSchema>;
