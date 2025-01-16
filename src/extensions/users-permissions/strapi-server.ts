import { randomBytes } from 'crypto';
import { factories } from '@strapi/strapi';

export default (plugin: any) => {
  plugin.controllers.auth.forgotPassword = async (ctx: any) => {
    const { email } = ctx.request.body;

    if (!email) {
      return ctx.badRequest('Email address is required');
    }

    // 查詢用戶
    const user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email },
    });

    if (!user) {
      return ctx.badRequest('User not found');
    }

    // 自定義重設密碼 token 長度
    const tokenLength = 32; // 你可以將長度調整為所需的值
    const resetPasswordToken = randomBytes(tokenLength).toString('hex');

    // 更新用戶數據庫中的 token 和有效期
    await strapi.query('plugin::users-permissions.user').update({
      where: { email },
      data: {
        resetPasswordToken,
        resetPasswordTokenExpiry: Date.now() + 3600000, // Token 有效期為 1 小時
      },
    });

    // 發送 email 的邏輯
    try {
      await strapi.plugins['email'].services.email.send({
        to: user.email,
        subject: 'Reset your password',
        text: `Your reset password token is: ${resetPasswordToken}`,
      });
      ctx.send({ message: 'Reset password instructions sent to your email' });
    } catch (err) {
      strapi.log.error('Failed to send reset password email', err);
      ctx.internalServerError('Unable to send email. Please try again later.');
    }
  };

  return plugin;
};
