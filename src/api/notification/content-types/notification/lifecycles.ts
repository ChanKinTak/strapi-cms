// 文件: /src/api/notification/content-types/notification/lifecycles.ts

'use strict';

import * as admin from 'firebase-admin';

// 初始化 Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (err) {
    console.error('Error initializing Firebase Admin:', err);
  }
}

/**
 * 发送推送通知函数
 */
async function sendPushNotification(notification, strapi) {
  try {
    console.log(`Attempting to send notification ${notification.id}`);
    
    // 如果 pushSent 为 false，不发送通知
    if (notification.pushSent === false) {
      console.log(`Notification ${notification.id} is marked as not to be sent (pushSent is false)`);
      return false;
    }
    
    // 收集所有需要发送的令牌
    const tokens = [];
    
    // 如果通知有设备令牌，添加到列表
    if (notification.deviceTokens && Array.isArray(notification.deviceTokens)) {
      tokens.push(...notification.deviceTokens.filter(token => typeof token === 'string' && token.length > 0));
      console.log(`Added ${tokens.length} tokens from deviceTokens field`);
    }
    
    // 处理用户关联的令牌
    if (!notification.isGlobal && notification.users && notification.users.length > 0) {
      // 非全局通知，只发送给关联的用户
      console.log(`Non-global notification with ${notification.users.length} associated users`);
      
      for (const user of notification.users) {
        if (user.FCMToken) {
          console.log(`Adding token for user ${user.id}: ${user.FCMToken.substring(0, 10)}...`);
          tokens.push(user.FCMToken);
        } else {
          console.log(`User ${user.id} has no FCM token`);
        }
      }
    } else if (notification.isGlobal === true) {
      // 全局通知，发送给所有有令牌的用户
      console.log('This is a global notification, fetching all user tokens');
      
      const allUsers = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: {
          FCMToken: { $notNull: true }
        },
        fields: ['id', 'FCMToken']
      });
      
      console.log(`Found ${allUsers.length} users with FCM tokens`);
      
      for (const user of allUsers) {
        if (user.FCMToken) {
          tokens.push(user.FCMToken);
        }
      }
    }
    
    // 去重
    const uniqueTokens = [...new Set(tokens)];
    
    if (uniqueTokens.length === 0) {
      console.log(`No device tokens available for notification ${notification.id}. isGlobal=${notification.isGlobal}`);
      return false;
    }
    
    console.log(`Sending push notification to ${uniqueTokens.length} devices`);
    
    // 准备通知内容
    const messagePayload = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        notificationId: notification.id.toString(),
        type: notification.type || 'info',
        createdAt: notification.createdAt
      }
    };
    
    // 手动发送给每个设备，跟踪成功和失败
    let successCount = 0;
    let failureCount = 0;
    
    // 批量发送（每批最多 500 个令牌，Firebase 的限制）
    for (let i = 0; i < uniqueTokens.length; i += 500) {
      const batch = uniqueTokens.slice(i, i + 500);
      
      // 逐个发送通知并收集结果
      const promises = batch.map(async (token) => {
        try {
          const message = {
            ...messagePayload,
            token: token
          };
          
          const result = await admin.messaging().send(message);
          successCount++;
          console.log(`Successfully sent to token: ${token.substring(0, 10)}...`);
          return { success: true, token, result };
        } catch (error) {
          failureCount++;
          
          // 检查是否是令牌无效的错误
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error sending to token ${token.substring(0, 10)}...: ${errorMessage}`);
          
          return { success: false, token, error };
        }
      });
      
      await Promise.all(promises);
    }
    
    console.log(`Push notification results: ${successCount} successful, ${failureCount} failed`);
    
    return successCount > 0;
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return false;
  }
}

/**
 * 检查计划通知
 */
async function checkScheduledNotifications(strapi) {
  try {
    const now = new Date();
    
    // 查找所有已发布、pushSent为true且起始日期已到或未设置的通知
    const notificationsToSend = await strapi.entityService.findMany('api::notification.notification', {
      filters: {
        pushSent: true,
        publishedAt: { $notNull: true },
        $or: [
          { startDate: { $lte: now } },
          { startDate: { $null: true } }
        ]
      },
      populate: ['users']
    });
    
    console.log(`Found ${notificationsToSend.length} notifications to send`);
    
    for (const notification of notificationsToSend) {
      const success = await sendPushNotification(notification, strapi);
      if (success) {
        console.log(`Successfully sent notification ${notification.id}`);
      } else {
        console.log(`Failed to send notification ${notification.id}`);
      }
    }
  } catch (error) {
    console.error('Error checking scheduled notifications:', error);
  }
}

/**
 * Notification lifecycle hooks
 */
export default {
  // 创建后钩子 - Strapi v5 格式
  async afterCreate({ result, params, state, service, container }) {
    console.log(`afterCreate event received for notification: ${result.id}`);
    
    const strapi = state?.service?.strapi || container.get('strapi');
    
    if (!strapi) {
      console.log('Strapi instance not available in afterCreate hook');
      return;
    }
    
    try {
      // 检查通知是否已发布
      if (!result.publishedAt) {
        console.log(`Notification ${result.id} is not published yet, skipping push notification`);
        return;
      }
      
      // 获取完整的通知数据
      const notification = await strapi.entityService.findOne('api::notification.notification', result.id, {
        populate: ['users']
      });
      
      // 检查是否有计划发送时间
      if (notification.startDate) {
        const startDate = new Date(notification.startDate);
        const now = new Date();
        
        if (startDate > now) {
          console.log(`Notification ${notification.id} scheduled for ${notification.startDate}, will be sent automatically`);
          return;
        }
      }
      
      // 检查 pushSent 是否为 true
      if (notification.pushSent) {
        console.log(`Notification ${notification.id} has pushSent=true, sending push notification`);
        // 立即发送通知
        await sendPushNotification(notification, strapi);
      } else {
        console.log(`Notification ${notification.id} has pushSent=false, skipping push notification`);
      }
    } catch (error) {
      console.error('Error in notification afterCreate hook:', error);
    }
  },
  
  // 更新后钩子 - Strapi v5 格式
  async afterUpdate({ result, params, state, service, container }) {
    console.log(`afterUpdate event received for notification: ${result.id}`);
    
    const strapi = state?.service?.strapi || container.get('strapi');
    
    if (!strapi) {
      console.log('Strapi instance not available in afterUpdate hook');
      return;
    }
    
    try {
      // 检查通知是否发布且 pushSent 为 true
      if (result.publishedAt && result.pushSent) {
        console.log(`Notification ${result.id} was updated and has pushSent=true, checking if we need to send push notification`);
        
        // 获取完整的通知数据
        const notification = await strapi.entityService.findOne('api::notification.notification', result.id, {
          populate: ['users']
        });
        
        // 检查是否有计划发送时间
        if (notification.startDate) {
          const startDate = new Date(notification.startDate);
          const now = new Date();
          
          if (startDate > now) {
            console.log(`Notification ${notification.id} scheduled for ${notification.startDate}, will be sent automatically`);
            return;
          }
        }
        
        // 立即发送通知
        await sendPushNotification(notification, strapi);
      } else {
        console.log(`Notification ${result.id} was updated but has pushSent=false or is not published, skipping push notification`);
      }
    } catch (error) {
      console.error('Error in notification afterUpdate hook:', error);
    }
  }
};

/**
 * 注册函数 - Strapi v5 格式
 */
export function register({ strapi }) {
  console.log('Registering scheduled notification check');
  
  // 设置定时任务，每分钟检查一次计划通知
  setInterval(() => {
    checkScheduledNotifications(strapi).catch(err => {
      console.error('Error in scheduled notification check:', err);
    });
  }, 60000); // 每分钟检查一次
}