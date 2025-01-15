/*export default ({ env }) => ({
  email: {
    config: {
      provider: '@strapi/provider-email-sendmail',
      providerOptions: {
        smtp: {
          host: env('SMTP_HOST'),
          port: env('SMTP_PORT'), 
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
        defaultFrom: env('SMTP_FROM'),
        defaultReplyTo: env('SMTP_TO')
      }
    }
  }
});*/


export default ({ env }) => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
      forgotPassword: {
        emailTemplate: {
          subject: '重設密碼驗證碼',
          text: `您的驗證碼是：<%= resetPasswordToken %>`,
          html: `您的驗證碼是：<%= resetPasswordToken %>`
        },
        tokenExpiration: 24 * 60 * 60 * 1000
      }
    }
  },
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: env('SMTP_FROM'),
        defaultReplyTo: env('SMTP_TO'),
      },
    },
  }
});



