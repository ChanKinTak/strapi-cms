// src/extensions/users-permissions/strapi-server.ts

module.exports = (plugin) => {
    const sanitizeOutput = (user) => {
      const {
        password, resetPasswordToken, confirmationToken, ...sanitizedUser
      } = user;
      return sanitizedUser;
    };
  
    plugin.controllers.auth.forgotPassword = async (ctx) => {
      const { email } = ctx.request.body;
  
      try {
        // 生成 4 位數驗證碼
        const resetPasswordToken = require('crypto')
          .randomBytes(2)
          .toString('hex')
          .slice(0, 4);
  
        // 找到用戶
        const user = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { email }
        });
  
        if (!user) {
          throw new Error('Email not found');
        }
  
        // 更新用戶資料
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: {
            resetPasswordToken,
            resetPasswordTokenExpiry: Date.now() + 24 * 60 * 60 * 1000
          }
        });
  
        // 發送郵件
        try {
          await strapi.plugins['email'].services.email.send({
            to: email,
            subject: '重設密碼驗證碼',
            text: `您的驗證碼是：${resetPasswordToken}`,
            html: `您的驗證碼是：${resetPasswordToken}`
          });
        } catch (err) {
          throw new Error('Error sending email');
        }
  
        ctx.send({ ok: true });
      } catch (err) {
        ctx.throw(500, err);
      }
    };
  
    plugin.routes['content-api'].routes.push({
      method: 'POST',
      path: '/auth/forgot-password',
      handler: 'auth.forgotPassword',
      config: {
        policies: [],
        prefix: ''
      }
    });
  
    return plugin;
  };