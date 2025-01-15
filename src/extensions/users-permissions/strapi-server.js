// src/extensions/users-permissions/strapi-server.js

module.exports = (plugin) => {
  // 生成指定長度的驗證碼
  const generateVerificationCode = (length = 4) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min)).toString();
  };

  // 覆蓋原有的 forgotPassword controller
  plugin.controllers.auth.forgotPassword = async (ctx) => {
    const { email } = ctx.request.body;

    try {
      // 用指定的長度生成驗證碼（這裡設為4位數）
      const code = generateVerificationCode(4);

      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email }
      });

      if (!user) {
        return ctx.send({ ok: false, message: '此信箱未註冊' });
      }

      await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          resetPasswordToken: code,
          resetPasswordTokenExpiry: Date.now() + 24 * 60 * 60 * 1000 // 24小時
        }
      });

      // 發送郵件
      await strapi.plugin('email').service('email').send({
        to: email,
        subject: '重設密碼驗證碼',
        text: `您的重設密碼驗證碼是：${code}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">重設密碼驗證碼</h2>
            <p style="font-size: 16px; color: #666;">
              您的驗證碼是：<strong style="color: #000; font-size: 24px;">${code}</strong>
            </p>
            <p style="color: #666;">此驗證碼將在24小時後失效，請儘快使用。</p>
          </div>
        `
      });

      ctx.send({ ok: true, message: '驗證碼已發送到您的信箱' });
    } catch (err) {
      ctx.throw(500, '發送驗證碼時發生錯誤');
    }
  };

  return plugin;
};