export default ({ env }) => ({
  email: {
    config: {
      provider: '@strapi/provider-email-sendmail',
      providerOptions: {
        smtp: {
          host: env('SMTP_HOST'),
          port: env('SMTP_PORT'), 
          secure: false,
          auth: {
            user: env('SMTP_USER'),
            pass: env('SMTP_PASS')
          }
        }
      },
      settings: {
        defaultFrom: env('SMTP_FROM'),
        defaultReplyTo: env('SMTP_REPLY_TO')
      }
    }
  }
});
