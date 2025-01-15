// src/extensions/users-permissions/strapi-server.ts

interface ForgotPasswordRequestBody {
  email: string;
}

interface ResetPasswordRequestBody {
  code: string;
  password: string;
  confirmPassword: string;
}

interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

module.exports = (plugin: any) => {
  // 覆蓋原有的 forgotPassword controller
  plugin.controllers.auth.forgotPassword = async (ctx: any) => {
    try {
      const params = ctx.request.body as ForgotPasswordRequestBody;

      // 檢查參數
      if (!params.email) {
        throw new Error('請提供 email');
      }

      // 生成 4 位數驗證碼
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      // 格式化 email 內容
      const emailTemplate: EmailTemplate = {
        subject: '重設密碼驗證碼',
        text: `您的重設密碼驗證碼是：${code}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">重設密碼驗證碼</h2>
            <p style="font-size: 16px; color: #666;">
              您的驗證碼是：<strong style="color: #000; font-size: 24px;">${code}</strong>
            </p>
            <p style="color: #666;">此驗證碼將在24小時後失效。</p>
          </div>
        `,
      };

      // 更新用戶
      const user = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: { email: params.email } });

      if (!user) {
        throw new Error('此 email 不存在');
      }

      await strapi
        .query('plugin::users-permissions.user')
        .update({
          where: { id: user.id },
          data: {
            resetPasswordToken: code,
            resetPasswordTokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
          },
        });

      // 發送郵件
      await strapi
        .plugin('email')
        .service('email')
        .send({
          to: params.email,
          ...emailTemplate,
        });

      ctx.send({ ok: true });
    } catch (error) {
      ctx.throw(400, error instanceof Error ? error.message : '未知錯誤');
    }
  };

  // 完整替換原有的resetPassword方法
  plugin.controllers.auth.resetPassword = async (ctx: any) => {
    try {
      const { code, password, confirmPassword } = ctx.request.body as ResetPasswordRequestBody;

      if (!code || !password || !confirmPassword) {
        throw new Error('請提供所有必要資訊');
      }

      if (password !== confirmPassword) {
        throw new Error('密碼不匹配');
      }

      const user = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ 
          where: { 
            resetPasswordToken: code,
            resetPasswordTokenExpiry: {
              $gt: Date.now(),
            },
          } 
        });

      if (!user) {
        throw new Error('驗證碼無效或已過期');
      }

      // 更新密碼
      await strapi
        .query('plugin::users-permissions.user')
        .update({
          where: { id: user.id },
          data: {
            password: await strapi.service('admin::auth').hashPassword(password),
            resetPasswordToken: null,
            resetPasswordTokenExpiry: null,
          },
        });

      ctx.send({ ok: true });
    } catch (error) {
      ctx.throw(400, error instanceof Error ? error.message : '未知錯誤');
    }
  };

  return plugin;
};