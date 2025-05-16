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
  
  async find(ctx) {
    try {
      // 获取用户ID
      let userId = null;
      try {
        const query = ctx.query as any;
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
      
      // 直接查询数据库，获取所有通知
      let allNotifications = await strapi.entityService.findMany('api::notification.notification', {
        sort: [{ startDate: 'desc' }],
        populate: ['users']
      }) as any[];
      
      console.log(`Found ${allNotifications.length} notifications in database`);
      
      // 检查全局通知和用户特定通知
      const globalCount = allNotifications.filter(n => n.isGlobal === true).length;
      console.log(`Global notifications: ${globalCount}`);
      
      // 详细记录每个通知的信息
      allNotifications.forEach((notification, index) => {
        console.log(`Notification ${index + 1} (ID: ${notification.id}):`);
        console.log(`- Title: ${notification.title}`);
        console.log(`- isGlobal: ${notification.isGlobal}`);
        console.log(`- Users count: ${notification.users?.length || 0}`);
        if (notification.users && notification.users.length > 0) {
          console.log(`- User IDs: ${notification.users.map(u => u.id).join(', ')}`);
        }
      });
      
      // 检查用户特定通知的逻辑问题
      if (userId) {
        const userSpecificCount = allNotifications.filter(n => {
          if (n.isGlobal === true) return false;
          return (n.users || []).some(u => parseInt(String(u.id), 10) === userId);
        }).length;
        console.log(`User-specific notifications for user ${userId}: ${userSpecificCount}`);
      }
      
      // 转换为扁平结构
      const flattenedNotifications = allNotifications.map(notification => ({
        id: notification.id,
        documentId: notification.documentId || null,
        isGlobal: notification.isGlobal || false,
        title: notification.title || '',
        message: notification.message || '',
        type: notification.type || null,
        startDate: notification.startDate || null,
        users: (notification.users || []).map((user: any) => ({
          id: user.id,
          username: user.username || '',
          email: user.email || ''
        }))
      }));
      
      // 不再使用复杂的过滤逻辑，而是使用简单直接的过滤
      // 条件1: 通知是全局的 (isGlobal === true)
      // 条件2: 通知不是全局的，但用户在users列表中
      const filteredNotifications = flattenedNotifications.filter(notification => {
        // 条件1: 通知是全局的
        if (notification.isGlobal === true) {
          return true;
        }
        
        // 条件2: 通知不是全局的，但用户在users列表中
        if (userId) {
          return notification.users.some(user => {
            const userIdNum = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
            return userIdNum === userId;
          });
        }
        
        // 如果没有用户ID且通知不是全局的，则不显示
        return false;
      });
      
      console.log(`Filtered notifications count: ${filteredNotifications.length}`);
      
      // 如果过滤后没有通知，但存在通知，返回所有可见通知
      if (filteredNotifications.length === 0 && flattenedNotifications.length > 0) {
        console.log(`没有通知可显示给用户${userId}。返回所有可见通知。`);
        
        // 最简单的备选方案：返回所有全局通知
        const onlyGlobalNotifications = flattenedNotifications.filter(n => n.isGlobal === true);
        
        // 如果有全局通知，返回全局通知；否则返回所有通知
        if (onlyGlobalNotifications.length > 0) {
          console.log(`返回 ${onlyGlobalNotifications.length} 个全局通知`);
          return {
            data: onlyGlobalNotifications,
            meta: { 
              pagination: { 
                page: 1, 
                pageSize: onlyGlobalNotifications.length, 
                pageCount: 1, 
                total: onlyGlobalNotifications.length 
              } 
            }
          };
        } else {
          console.log(`没有全局通知。返回所有通知。`);
          return {
            data: flattenedNotifications,
            meta: { 
              pagination: { 
                page: 1, 
                pageSize: flattenedNotifications.length, 
                pageCount: 1, 
                total: flattenedNotifications.length 
              } 
            }
          };
        }
      }
      
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
      console.error('Error in notification controller:', error);
      try {
        // 最简单的备选方案
        const notifications = await strapi.entityService.findMany('api::notification.notification', {
          sort: [{ startDate: 'desc' }],
          filters: { isGlobal: true }  // 只获取全局通知作为备选
        }) as any[];
        
        // 转换为所需的响应格式
        const data = notifications.map(notification => ({
          id: notification.id,
          documentId: notification.documentId || null,
          isGlobal: notification.isGlobal || false,
          title: notification.title || '',
          message: notification.message || '',
          type: notification.type || null,
          startDate: notification.startDate || null,
          users: []  // 简化用户列表
        }));
        
        return {
          data,
          meta: { pagination: { page: 1, pageSize: data.length, pageCount: 1, total: data.length } }
        };
      } catch (e) {
        console.error('Error in fallback find:', e);
        return { data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } };
      }
    }
  }
}));