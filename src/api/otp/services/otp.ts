// src/api/otp/services/otp.ts
export default {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  async saveOTP(email: string, otp: string) {
    return await strapi.entityService.create('api::otp.otp', {
      data: {
        email,
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
      },
    });
  },

  async verifyOTP(email: string, code: string) {
    const otp = await strapi.entityService.findMany('api::otp.otp', {
      filters: {
        email,
        code,
        used: false,
        expiresAt: {
          $gt: new Date(),
        },
      },
    });

    if (!otp || otp.length === 0) {
      throw new Error('Invalid or expired OTP');
    }

    await strapi.entityService.update('api::otp.otp', otp[0].id, {
      data: { used: true },
    });

    return true;
  },
};