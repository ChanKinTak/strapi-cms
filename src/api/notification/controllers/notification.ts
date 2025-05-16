/**
 * notification controller
 */

import { factories } from '@strapi/strapi'

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
  
  // 重写 find 方法 - 处理所有通知的查询
  async find(ctx) {
    try {
      // 使用类型断言处理ctx.query
      const query = ctx.query as Record<string, any>;
      
      // 获取用户ID
      let userId = null;
      try {
        if (query?.populate?.notification_reads?.filters?.user?.id?.$eq) {
          userId = query.populate.notification_reads.filters.user.id.$eq;
          
          if (typeof userId === 'string') {
            userId = parseInt(String(userId), 10);
          }
          console.log('Using userId for filtering:', userId);
        }
      } catch (e) {
        console.error('Error extracting userId:', e);
      }
      
      // 检查是否有ID过滤器
      const hasIdFilter = query?.filters?.id?.$eq;
      
      // 如果有ID过滤器，手动获取单个通知
      if (hasIdFilter) {
        console.log(`Detected ID filter: ${hasIdFilter}, getting single notification`);
        
        // 使用db.query而不是entityService，确保能使用where条件
        const notification = await strapi.db.query('api::notification.notification').findOne({
          where: { 
            id: hasIdFilter,
            publishedAt: { $notNull: true }  // 必须是已发布的通知
          },
          populate: ['users']
        });
        
        if (!notification) {
          return ctx.notFound('Notification not found or not published');
        }
        
        // 转换为前端友好格式 - 返回扁平结构，不使用attributes包裹
        return {
          data: [{
            id: notification.id,
            documentId: notification.documentId || null,
            isGlobal: notification.isGlobal === true,
            title: notification.title || '',
            message: notification.message || '',
            type: notification.type || null,
            startDate: notification.startDate || null,
            publishedAt: notification.publishedAt,
            users: (notification.users || []).map((user: any) => ({
              id: user.id,
              username: user.username || '',
              email: user.email || ''
            }))
          }]
        };
      }
      
      // 为所有通知的常规查询 - 使用db.query而不是entityService
      console.log('查询已发布的通知');
      const notifications = await strapi.db.query('api::notification.notification').findMany({
        where: {
          publishedAt: { $notNull: true }  // 只获取已发布的通知
        },
        orderBy: [{ startDate: 'desc' }],
        populate: ['users']
      });
      
      console.log(`获取到 ${notifications.length} 条已发布的通知`);
      
      // 检查publishedAt字段
      notifications.forEach((notification, index) => {
        console.log(`通知 ${index + 1} (ID: ${notification.id}): publishedAt = ${notification.publishedAt}`);
      });
      
      // 转换为前端友好格式
      const formattedNotifications = notifications.map(notification => {
        // 确保所有字段存在且格式正确
        return {
          id: notification.id,
          documentId: notification.documentId || null,
          isGlobal: notification.isGlobal === true,
          title: notification.title || '',
          message: notification.message || '',
          type: notification.type || null,
          startDate: notification.startDate || null,
          publishedAt: notification.publishedAt,
          users: (notification.users || []).map((user: any) => ({
            id: user.id,
            username: user.username || '',
            email: user.email || ''
          }))
        };
      });
      
      // 应用过滤逻辑
      const filteredNotifications = formattedNotifications.filter(item => {
        // 全局通知对所有人可见
        if (item.isGlobal === true) {
          return true;
        }
        
        // 如果没有用户ID，只返回全局通知
        if (!userId) {
          return false;
        }
        
        // 检查用户是否在通知的users列表中
        const users = item.users || [];
        
        return users.some(user => {
          let userIdFromList = user.id;
          if (typeof userIdFromList === 'string') {
            userIdFromList = parseInt(userIdFromList, 10);
          }
          return userIdFromList === userId;
        });
      });
      
      // 返回结果
      return {
        data: filteredNotifications,
        meta: { 
          pagination: { 
            page: 1, 
            pageSize: filteredNotifications.length, 
            pageCount: 1, 
            total: filteredNotifications.length 
          } 
        }
      };
    } catch (error) {
      console.error('Error in notification find controller:', error);
      return { data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } };
    }
  },
  
  // 重写 findOne 方法 - 处理特定ID的查询（用于路由 /notifications/:id）
  async findOne(ctx, next) {
    try {
      // 获取要查询的通知ID
      const { id } = ctx.params;
      
      if (!id) {
        return ctx.badRequest('Missing notification ID');
      }
      
      console.log(`Looking for notification with ID: ${id}`);
      
      // 使用db.query而不是entityService
      const notification = await strapi.db.query('api::notification.notification').findOne({
        where: { 
          id: id,
          publishedAt: { $notNull: true }  // 必须是已发布的通知
        },
        populate: ['users']
      });
      
      if (!notification) {
        return ctx.notFound('Notification not found or not published');
      }
      
      // 打印publishedAt字段值以便调试
      console.log(`通知 ${id} 的 publishedAt 值: ${notification.publishedAt}`);
      
      // 转换为前端友好格式 - 返回扁平结构，不使用attributes包裹
      return {
        data: {
          id: notification.id,
          documentId: notification.documentId || null,
          isGlobal: notification.isGlobal === true,
          title: notification.title || '',
          message: notification.message || '',
          type: notification.type || null,
          startDate: notification.startDate || null,
          publishedAt: notification.publishedAt,
          users: (notification.users || []).map((user: any) => ({
            id: user.id,
            username: user.username || '',
            email: user.email || ''
          }))
        }
      };
    } catch (error) {
      console.error('Error in notification findOne controller:', error);
      return ctx.badRequest('Cannot retrieve the requested notification');
    }
  }
}));