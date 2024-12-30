export default ({ env }) => ({
  email: {
    config: {
      provider: '@strapi/provider-email-sendmail',
      providerOptions: {
        smtp: {
          host: 'smtp-relay.brevo.com',
          port: 587, 
          secure: false,
          auth: {
            user: env('SMTP_USERNAME'),
            pass: env('SMTP_PASSWORD')
          },
          requireTLS: true,
          logger: true  // 添加这行来获取详细日志
        }
      },
      settings: {
        defaultFrom: 'tak@add-values.com',
        defaultReplyTo: 'tak@add-values.com'
      }
    }
  }
});






