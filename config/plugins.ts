export default () => ({
    email: {
        config: {
          provider: 'strapi-provider-email-brevo',
          providerOptions: {
            apiKey: env("BREVO_API_KEY"),
          },
          settings: {
            defaultFrom: env("EMAIL_DEFAULT_FROM"), 
            defaultSenderName: 'Admin',
            defaultReplyTo: env("EMAIL_DEFAULT_REPLY_TO"), 
          },
        },
      }
});