export default () => ({
    email: {
        config: {
          provider: 'strapi-provider-email-brevo',
          providerOptions: {
            apiKey: process.env.SENDINBLUE_API_KEY,
          },
          settings: {
            defaultSenderEmail: 'tak@add-values.com',
            defaultSenderName: 'Admin',
            defaultReplyTo: 'tak@add-values.com',
          },
        },
      }
});