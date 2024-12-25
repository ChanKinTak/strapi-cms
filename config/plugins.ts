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
            user: '74ec60001@smtp-brevo.com',
            pass: 'dvrIa2VGXPB9SfDx'
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
