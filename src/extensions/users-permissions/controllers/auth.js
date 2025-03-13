'use strict';

const _ = require('lodash');
const utils = require('@strapi/utils');
const { getService } = require('@strapi/plugin-users-permissions/server/utils');
const generateResetToken = require('../../../utils/generateResetToken');
const { ValidationError } = utils.errors;

// 這是覆蓋默認 auth 控制器的自定義控制器
module.exports = {
  // 只覆蓋 forgotPassword 方法，其他使用默認
  async forgotPassword(ctx) {
    const { email } = ctx.request.body;

    // 檢查 email 是否提供
    if (!email) {
      throw new ValidationError('Email is required');
    }

    // 查找用戶
    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email: email.toLowerCase() } });

    if (user) {
      // 生成自定義驗證碼 (10-15位數字)
      const resetPasswordToken = generateResetToken(12); // 這裡設置為12位，您可以設置為10-15之間
      
      // 設置 token 的過期時間 (默認為24小時)
      const resetPasswordTokenExpiration = Date.now() + 24 * 3600 * 1000;

      // 更新用戶的重設密碼 token
      await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          resetPasswordToken,
          resetPasswordTokenExpiration,
        },
      });

      // 發送重設密碼郵件
      await getService('email').sendTemplatedEmail(
        {
          to: user.email,
          from: strapi.config.get('admin.forgotPassword.from'),
          replyTo: strapi.config.get('admin.forgotPassword.replyTo'),
        },
        strapi.config.get('admin.forgotPassword.emailTemplate'),
        {
          url: `${strapi.config.get('server.url')}/reset-password?code=${resetPasswordToken}`,
          user: _.omit(user, ['password', 'resetPasswordToken', 'role']),
          token: resetPasswordToken,
        }
      );
    }

    // 無論用戶是否存在，都返回成功以防止用戶枚舉
    ctx.send({ ok: true });
  },
};