// src/extensions/users-permissions/strapi-server.ts
const strapiServer = {
    register(context) {
        const { strapi } = context;
        strapi.plugin('users-permissions').controller('auth').forgotPassword = async (ctx) => {
            const { email } = ctx.request.body;
            try {
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
                await strapi.plugin('email').service('email').send({
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
                ctx.send({ ok: true, message: '驗證碼已發送至您的信箱' });
            }
            catch (err) {
                ctx.throw(500, err);
            }
        };
    },
    bootstrap() { },
};
module.exports = strapiServer;
