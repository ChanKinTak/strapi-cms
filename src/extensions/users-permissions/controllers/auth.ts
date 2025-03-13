import _ from 'lodash';
import utils from '@strapi/utils';
import { getService } from '@strapi/plugin-users-permissions/server/utils';
import generateResetToken from '../../../utils/generateResetToken';

// 不需要導入 Strapi 類型，它在全局範圍內可用
// 避免導入不存在的類型
const { ValidationError } = utils.errors;

interface RequestBody {
  email: string;
}

interface User {
  id: number;
  email: string;
  resetPasswordToken: string | null;
  resetPasswordTokenExpiration: Date | null;
  [key: string]: any;
}

/**
 * 自定義 Auth 控制器，覆蓋默認密碼重置行為
 */
export default {
  /**
   * 發送密碼重置電子郵件
   * @param ctx Koa 上下文
   */
  async forgotPassword(ctx: any): Promise<void> {
    const { email } = ctx.request.body as RequestBody;

    // 檢查 email 是否提供
    if (!email) {
      throw new ValidationError('Email is required');
    }

    // 查找用戶
    const user: User | null = await strapi.query('plugin::users-permissions.user').findOne({ 
      where: { email: email.toLowerCase() } 
    });

    if (user) {
      // 生成自定義驗證碼 (10-15位數字)
      const resetPasswordToken: string = generateResetToken(12); // 這裡設置為12位，您可以設置為10-15之間
      
      // 設置 token 的過期時間 (默認為24小時)
      const resetPasswordTokenExpiration: number = Date.now() + 24 * 3600 * 1000;

      // 更新用戶的重設密碼 token
      await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          resetPasswordToken,
          resetPasswordTokenExpiration,
        },
      });

      // 直接使用 Strapi 提供的用戶權限插件的郵件服務
      // @ts-ignore - 忽略 TypeScript 類型檢查錯誤
      const userPermissionService = strapi.plugins['users-permissions'];
      const emailService = userPermissionService.services.email;
      
      // 發送重設密碼郵件
      await emailService.sendTemplatedEmail(
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
