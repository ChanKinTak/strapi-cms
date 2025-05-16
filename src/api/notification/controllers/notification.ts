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
      
      // 修改查询参数，确保获取完整数据
      let modifiedCtx = { ...ctx };
      try {
        const query = { ...ctx.query } as any;
        if (!query.populate) {
          query.populate = {};
        } else if (typeof query.populate === 'string') {
          try {
            query.populate = JSON.parse(query.populate);
          } catch (e) {
            query.populate = {};
          }
        }
        
        // 添加所有需要的关系填充
        query.populate = {
          ...query.populate,
          users: true
        };
        
        // 添加排序条件 - 按 startDate 逆序排列
        query.sort = 'startDate:desc';
        
        modifiedCtx = { ...ctx, query };
      } catch (e) {
        console.error('Error modifying query:', e);
      }
      
      // 调用原始查询
      const originalResult = await super.find(modifiedCtx);
      
      // 如果原始数据为空，直接返回
      if (!originalResult.data || !Array.isArray(originalResult.data) || originalResult.data.length === 0) {
        return originalResult;
      }
      
      // 确保所有通知都被正确处理 - 使用entityService获取完整数据
      const enhancedNotifications = await Promise.all(
        originalResult.data.map(async (item: any) => {
          try {
            // 使用entityService直接获取完整的通知数据
            // 使用类型断言解决TypeScript错误
            const notification = await strapi.entityService.findOne(
              'api::notification.notification',
              item.id,
              { populate: ['users'] }
            ) as any; // 使用any类型断言
            
            // 确保返回所有字段
            return {
              id: item.id,
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
            };
          } catch (error) {
            console.error(`Error fetching complete notification ${item.id}:`, error);
            
            // 回退到使用attributes
            return {
              id: item.id,
              documentId: item.attributes?.documentId || null,
              isGlobal: item.attributes?.isGlobal || false,
              title: item.attributes?.title || '',
              message: item.attributes?.message || '',
              type: item.attributes?.type || null,
              startDate: item.attributes?.startDate || null,
              users: (item.attributes?.users?.data || []).map((u: any) => ({
                id: u.id,
                username: u.attributes?.username || '',
                email: u.attributes?.email || ''
              }))
            };
          }
        })
      );
      
      // 应用过滤逻辑
      const globalNotifications = enhancedNotifications.filter(item => item.isGlobal === true);
      
      // 如果有用户ID，获取与该用户关联的非全局通知
      let userSpecificNotifications = [];
      if (userId) {
        userSpecificNotifications = enhancedNotifications.filter(item => {
          // 跳过全局通知，因为已经包含在globalNotifications中
          if (item.isGlobal === true) {
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
      }
      
      // 合并全局通知和用户特定通知
      const combinedNotifications = [...globalNotifications, ...userSpecificNotifications];
      
      // 如果没有通知可显示，但原始数据中有通知，返回所有通知
      if (combinedNotifications.length === 0 && enhancedNotifications.length > 0) {
        console.warn(`没有通知可显示给用户${userId}。返回所有通知。`);
        
        // 确保按startDate逆序排列
        const sortedNotifications = [...enhancedNotifications].sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        });
        
        return {
          data: sortedNotifications,
          meta: originalResult.meta
        };
      }
      
      // 确保按startDate逆序排列
      const sortedNotifications = [...combinedNotifications].sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      });
      
      return {
        data: sortedNotifications,
        meta: originalResult.meta
      };
    } catch (error) {
      console.error('Error in notification controller:', error);
      try {
        // 如果主要方法失败，使用直接的数据库查询作为备用
        const notifications = await strapi.entityService.findMany('api::notification.notification', {
          sort: [{ startDate: 'desc' }],
          populate: ['users']
        }) as any[]; // 使用any[]类型断言
        
        // 转换为所需的响应格式
        const data = notifications.map(notification => ({
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