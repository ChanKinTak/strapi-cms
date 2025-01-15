// src/extensions/users-permissions/strapi-server.js

const generateCode = (length = 6) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min)).toString();
  };
  
  module.exports = (plugin) => {
    const sanitizeUser = (user) => {
      const { password, resetPasswordToken, confirmationToken, ...sanitizedUser } = user;
      return sanitizedUser;
    };
  
    // 覆蓋原有的 forgotPassword controller
    plugin.controllers.auth.forgotPassword = async (ctx) => {
      const { email } = ctx.request.body;
  
      try {
        // 生成 6 位數驗證碼 (可以修改 generateCode 的參數來改變長度)
        const code = generateCode(6);
  
        const user = await strapi.query('plugin::users-permissions.user').findOne({
          where: { email }
        });
  
        if (!user) {
          throw new Error('此信箱未註冊');
        }
  
        await strapi.query('plugin::users-permissions.user').update({
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
              <h2>重設密碼驗證碼</h2>
              <p>您的驗證碼是：<strong>${code}</strong></p>
              <p>此驗證碼將在 24 小時後失效</p>
            </div>
          `
        });
  
        ctx.send({ ok: true, message: '驗證碼已發送至您的信箱' });
      } catch (err) {
        ctx.throw(500, err);
      }
    };
  
    return plugin;
  };