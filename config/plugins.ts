export default ({ env }) => ({
  email: {
    config: {
      provider: "brevo", // 使用 brevo 提供商
      providerOptions: {
        apiKey: env("BREVO_API_KEY"), // 从环境变量中获取 API 密钥
      },
      settings: {
        defaultFrom: env("EMAIL_DEFAULT_FROM"), // 默认发件人
        defaultSenderName: 'Admin',
        defaultReplyTo: env("EMAIL_DEFAULT_REPLY_TO"), // 默认回复地址
      },
    },
  },
});
