// src/api/otp/controllers/otp.ts
export default {
  async send(ctx) {
    try {
      const { email } = ctx.request.body;
      if (!email) {
        return ctx.badRequest('Email is required');
      }

      const otpService = strapi.services.otp;
      const otp = await otpService.generateOTP();
      await otpService.saveOTP(email, otp);

      await strapi.plugins.email.services.email.send({
        to: email,
        subject: '密碼重置驗證碼',
        text: `您的驗證碼是: ${otp}，此驗證碼將在10分鐘後失效。`,
        html: `<p>您的驗證碼是: <strong>${otp}</strong></p><p>此驗證碼將在10分鐘後失效。</p>`,
      });

      return { data: { message: 'OTP sent successfully' } };
    } catch (error) {
      console.error('Send OTP error:', error);
      return ctx.throw(500, error);
    }
  },

  async reset(ctx) {
    try {
      const { email, otp, newPassword } = ctx.request.body;
      
      const otpService = strapi.services.otp;
      await otpService.verifyOTP(email, otp);
      
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email }
      });

      if (!user) {
        return ctx.notFound('User not found');
      }

      await strapi.plugins['users-permissions'].services.user.edit(
        user.id,
        { password: newPassword }
      );

      return { data: { message: 'Password reset successfully' } };
    } catch (error) {
      console.error('Reset password error:', error);
      return ctx.throw(400, error);
    }
  }
};