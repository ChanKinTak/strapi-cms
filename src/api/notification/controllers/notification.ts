/**
 * notification controller
 */

import { factories } from '@strapi/strapi'

//export default factories.createCoreController('api::notification.notification');




export default factories.createCoreController('api::notification.notification', ({ strapi }) => ({
  async createNotificationRead(ctx) {
    const { user, notification } = ctx.request.body; // 从请求中获取 Notification 的主键 ID

    // 确认 Notification 是否存在
    const notificationinfo = await strapi.entityService.findOne('api::notification.notification', notification);

    if (!notificationinfo) {
      return ctx.badRequest('Notification not found');
    }

    // 创建 Notification Reads 记录
    const notificationRead = await strapi.entityService.create('api::notification-read.notification-read', {
      data: {
        user: user,
        notification: notification, // 直接使用主键 ID
      },
    });

    ctx.body = { data: notificationRead };
  },
}));

