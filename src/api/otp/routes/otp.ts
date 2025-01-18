// src/api/otp/routes/otp.ts
export default {
  routes: [
    {
      method: 'POST',
      path: '/otp/send',
      handler: 'otp.send',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/otp/reset',
      handler: 'otp.reset',
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};