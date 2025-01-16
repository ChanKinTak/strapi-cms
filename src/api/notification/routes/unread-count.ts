export default {
  routes: [
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