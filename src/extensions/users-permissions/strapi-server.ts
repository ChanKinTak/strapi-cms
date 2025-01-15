import crypto from "crypto";
import _ from "lodash";
import utils, { yup, validateYupSchema } from "@strapi/utils";

const forgotPasswordSchema = yup
  .object({
    email: yup.string().email().required(),
  })
  .noUnknown();

module.exports = (plugin: any) => {
  plugin.controllers.auth.forgotPassword = async (ctx: any) => {
    const { email } = await validateYupSchema(forgotPasswordSchema)(
      ctx.request.body
    );

    const pluginStore = strapi.store({
      type: "plugin",
      name: "users-permissions",
    });

    // Find the user
    const user = await strapi
      .query("plugin::users-permissions.user")
      .findOne({ where: { email: email.toLowerCase() } });

    if (!user || user.blocked) {
      return ctx.send({ ok: true });
    }

    // 生成 6 位數驗證碼
    const resetPasswordToken = crypto.randomInt(100000, 999999).toString();

    // 自定義郵件內容
    const emailToSend = {
      to: user.email,
      subject: '重設密碼驗證碼',
      text: `您的驗證碼是：${resetPasswordToken}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">重設密碼驗證碼</h2>
          <p style="font-size: 16px; color: #666;">
            您的驗證碼是：<strong style="color: #000; font-size: 24px;">${resetPasswordToken}</strong>
          </p>
          <p style="color: #666;">此驗證碼將在24小時後失效。</p>
        </div>
      `
    };

    // 更新用戶的重設密碼 token
    await strapi
      .plugin("users-permissions")
      .service("user")
      .edit(user.id, { 
        resetPasswordToken,
        resetPasswordTokenExpiry: Date.now() + 24 * 60 * 60 * 1000
      });

    // 發送郵件
    await strapi.plugin("email").service("email").send(emailToSend);

    ctx.send({ ok: true });
  };

  return plugin;
};