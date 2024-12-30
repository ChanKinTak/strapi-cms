export default ({ env }) => ({
  email: {
    config: {
      provider: '@strapi/provider-email-sendmail',
      providerOptions: {
        smtp: {
          host: 'smtp-relay.brevo.com',
          port: 587, 
          secure: true,
          auth: {
            user: env('SMTP_USERNAME'),
            pass: env('SMTP_PASSWORD')
          }
        }
      },
      settings: {
        defaultFrom: 'tak@add-values.com',
        defaultReplyTo: 'tak@add-values.com'
      }
    }
  }
});






