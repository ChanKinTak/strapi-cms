/**
 * notification controller
 */

import { factories } from '@strapi/strapi'

//export default factories.createCoreController('api::notification.notification');
// 定义类型以避免TypeScript错误

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
  /*async find(ctx) {
    // 将上下文查询参数与默认排序合并
    ctx.query = {
      ...ctx.query,
      sort: { startDate: 'desc' }
    };

    // 调用默认实现
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },*/
  async find(ctx) {
    try {
      // 获取用户ID
      let userId = null;
      try {
        const query = ctx.query as any;
        if (query?.populate?.notification_reads?.filters?.user?.id?.$eq) {
          userId = query.populate.notification_reads.filters.user.id.$eq;
          
          if (typeof userId === 'string') {
            userId = parseInt(userId, 10);
          }
          console.log('Using userId for filtering:', userId);
        }
      } catch (e) {
        console.error('Error extracting userId:', e);
      }
      
      // 修改查询参数，确保获取 users 关系并按 startDate 排序
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
        
        // 添加users关系填充
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
      
      // 直接获取每个通知的完整数据，包括所有必需的关系
      const enhancedNotifications = await Promise.all(
        originalResult.data.map(async (item: any) => {
          try {
            // 使用 entityService 获取完整的通知数据，包括 isGlobal 和 users 关系
            const fullNotification = await strapi.entityService.findOne(
              'api::notification.notification',
              item.id,
              { populate: ['users'] }
            ) as any;
            
            // 确保 users 属性存在并且格式正确
            const users = fullNotification.users || [];
            
            // 创建一个扁平化的响应对象 - 直接包含所有字段而不使用attributes包裹
            return {
              id: item.id,
              documentId: fullNotification.documentId || null, // 添加documentId字段
              isGlobal: fullNotification.isGlobal || false,
              title: fullNotification.title,
              message: fullNotification.message,
              type: fullNotification.type,
              startDate: fullNotification.startDate,
              users: users.map((user: any) => ({
                id: user.id,
                username: user.username,
                email: user.email
              }))
            };
          } catch (error) {
            console.error(`Error enhancing notification ${item.id}:`, error);
            // 如果增强失败，尝试返回扁平化的原始项
            if (item.attributes) {
              return {
                id: item.id,
                documentId: item.attributes.documentId || null, // 添加documentId字段
                ...item.attributes,
                users: (item.attributes.users?.data || []).map((u: any) => ({
                  id: u.id,
                  ...(u.attributes || {})
                }))
              };
            }
            return item;
          }
        })
      );
      
      // 应用过滤逻辑
      const filteredNotifications = enhancedNotifications.filter((item: any) => {
        // 将isGlobal转换为布尔值
        let isGlobal = item.isGlobal;
        if (isGlobal === 'true') isGlobal = true;
        if (isGlobal === 'false') isGlobal = false;
        
        // 全局通知对所有人可见
        if (isGlobal === true) {
          return true;
        }
        
        // 如果没有用户ID，只返回全局通知
        if (!userId) {
          return false;
        }
        
        // 检查用户是否在通知的users列表中
        const users = item.users || [];
        
        return users.some((user: any) => {
          let userIdFromList = user.id;
          if (typeof userIdFromList === 'string') {
            userIdFromList = parseInt(userIdFromList, 10);
          }
          return userIdFromList === userId;
        });
      });
      
      // 如果过滤后无数据但原始数据存在，返回所有原始数据
      if (filteredNotifications.length === 0 && enhancedNotifications.length > 0) {
        console.warn('Filtering removed all notifications. Returning all data instead.');
        return {
          data: enhancedNotifications,
          meta: originalResult.meta
        };
      }
      
      // 确保按 startDate 逆序排列
      const sortedNotifications = [...filteredNotifications].sort((a, b) => {
        // 防止空值
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        
        // 逆序排列（新的在前）
        return dateB - dateA;
      });
      
      return {
        data: sortedNotifications,
        meta: originalResult.meta
      };
    } catch (error) {
      console.error('Error in notification controller:', error);
      try {
        const result = await super.find(ctx);
        
        // 尝试扁平化原始结果
        if (result.data && Array.isArray(result.data)) {
          result.data = result.data.map((item: any) => {
            if (item.attributes) {
              return {
                id: item.id,
                documentId: item.attributes.documentId || null, // 添加documentId字段
                ...item.attributes,
                users: (item.attributes.users?.data || []).map((u: any) => ({
                  id: u.id,
                  ...(u.attributes || {})
                }))
              };
            }
            return item;
          });
          
          // 排序
          result.data.sort((a: any, b: any) => {
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            return dateB - dateA;
          });
        }
        
        return result;
      } catch (e) {
        console.error('Error in fallback find:', e);
        return { data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } };
      }
    }
  }
}));