export default () => ({
    email: {
        config: {
          provider: 'strapi-provider-email-brevo',
          providerOptions: {
            apiKey: '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',
          },
          settings: {
            defaultSenderEmail: 'tak@add-values.com',
            defaultSenderName: 'Admin',
            defaultReplyTo: 'tak@add-values.com',
          },
        },
      }
});