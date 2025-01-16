/**
 * notification router
 */

import { factories } from '@strapi/strapi';

//export default factories.createCoreRouter('api::notification.notification');


export default {
    routes: [
      // 默認路由
      {
        method: 'GET',
        path: '/notifications', 
        handler: 'notification.find'
      },
      // 新加入的未讀計數路由
      {
        method: 'GET',
        path: '/notifications/unread-count',
        handler: 'notification.getUnreadCount',
        config: {
          policies: []
        }
      }
    ]
  };