/**
 * notification controller
 */

import { factories } from '@strapi/strapi'

//export default factories.createCoreController('api::notification.notification');


export default factories.createCoreController('api::notification.notification', ({ strapi }) => ({
  async getUnreadCount(ctx) {
    try {
      const { user } = ctx.state;
      
      if (!user?.id) {
        return ctx.unauthorized('Please login first');
      }

      // 修改查詢條件，只獲取已發布的通知
      const today = new Date();
      today.setHours(0, 0, 0, 0); //
      const notifications = await strapi.db.query('api::notification.notification').findMany({
        where: {
          $and: [
            {
              publishedAt: { $notNull: true }  // 只查詢已發布的
            },
            {
              startDate: { $lte: today }
            },
            {
              $or: [
                { isGlobal: true }
              ]
            }
          ]
        },
        populate: {
          notification_reads: {
            where: {
              user: user.id
            }
          }
        }
      });

      const unreadCount = notifications.filter(notification => {
        const reads = notification.notification_reads || [];
        return reads.length === 0;
      }).length;

      return {
        data: {
          unreadCount,
          total: notifications.length,
          details: notifications.map(n => ({
            id: n.id,
            isRead: (n.notification_reads?.length || 0) > 0,
            publishedAt: n.publishedAt
          }))
        }
      };

    } catch (error) {
      console.error('Detailed error:', error);
      return ctx.badRequest('Failed to get unread count');
    }
  },
  async find(ctx) {
    // 将上下文查询参数与默认排序合并
    ctx.query = {
      ...ctx.query,
      sort: { startDate: 'desc' }
    };

    // 调用默认实现
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  }
}));