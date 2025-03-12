module.exports = ({env}) => ({
  i18n: {
    enabled: true,
    defaultLocale: 'en',
    locales: ['en', 'zh-Hans', 'zh-Hant'],
  },
    upload: {
      config: {
        provider: "strapi-provider-upload-do", 
        providerOptions: {
          key: env('DO_SPACE_ACCESS_KEY'),
          secret: env('DO_SPACE_SECRET_KEY'),
          endpoint: env('DO_SPACE_ENDPOINT'),
          space: env('DO_SPACE_BUCKET'),
        }
      },
    }, 
    'users-permissions': {
      config: {
        jwt: {
          expiresIn: '7d',
        },
        resetPassword: {
          resetTokenLength: 10, // 這裡修改驗證碼長度，例如從默認的 6 位改為 10 位
        },
      },
    },
  })