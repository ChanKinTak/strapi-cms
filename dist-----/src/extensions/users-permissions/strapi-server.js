"use strict";
// src/extensions/users-permissions/strapi-server.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    register({ strapi }) {
        const extensionService = strapi.plugin('users-permissions').service('auth');
        // 擴展現有的 forgotPassword 方法
        Object.assign(extensionService, {
            async forgotPassword({ email }) {
                // 生成數字驗證碼
                const code = Math.floor(1000 + Math.random() * 9000).toString();
                const user = await strapi.db.query('plugin::users-permissions.user')
                    .findOne({ where: { email } });
                if (!user) {
                    throw new Error('此信箱未註冊');
                }
                // 更新用戶資料
                await strapi.db.query('plugin::users-permissions.user').update({
                    where: { id: user.id },
                    data: {
                        resetPasswordToken: code,
                        resetPasswordTokenExpiry: Date.now() + 24 * 60 * 60 * 1000
                    }
                });
                // 發送郵件
                await strapi.plugins.email.services.email.send({
                    to: email,
                    subject: '重設密碼驗證碼',
                    html: `
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">重設密碼驗證碼</h2>
                <p style="font-size: 16px; color: #666;">
                  您的重設密碼驗證碼是：<strong style="color: #000; font-size: 24px;">${code}</strong>
                </p>
                <p style="color: #666;">此驗證碼將在24小時後失效，請儘快使用。</p>
              </div>
            `
                });
                return { ok: true };
            }
        });
        // 修改控制器
        strapi.plugin('users-permissions').controller('auth').forgotPassword = async (ctx) => {
            const { email } = ctx.request.body;
            try {
                await extensionService.forgotPassword({ email });
                ctx.send({ ok: true, message: '驗證碼已發送至您的信箱' });
            }
            catch (err) {
                ctx.throw(500, err);
            }
        };
    },
    bootstrap() { }
};
