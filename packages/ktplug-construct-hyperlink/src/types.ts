import { z } from "@ogrtk/shared/zod-utils";

/**
 * プラグインの設定情報スキーマ
 */
export const pluginConfigSchema = z.object({
  configs: z
    .array(
      z.object({
        space: z.string().nonempty(),
        urlPrefix: z.string().nonempty(),
        fieldCode: z.string().nonempty(),
        urlPostfix: z.string(),
        linkText: z.string().nonempty(),
        style: z.string(),
      }),
    )
    .nonempty(),
});
/**
 * プラグインの設定情報
 */
export type PluginConfig = z.infer<typeof pluginConfigSchema>;
