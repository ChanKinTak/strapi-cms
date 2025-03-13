export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  forgotPassword: {
    from: env('SMTP_FROM', 'hello@example.com'),
    replyTo: env('SMTP_REPLY_TO', 'hello@example.com'),
    emailTemplate: 'reset-password', // 使用自定義模板
  },
});
