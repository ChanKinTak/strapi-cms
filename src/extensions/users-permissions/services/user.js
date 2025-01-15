const crypto = require('crypto');

module.exports = (plugin) => {
  const originalResetPassword = plugin.services.user.resetPassword;

  plugin.services.user.resetPassword = async (email, url) => {
    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email } });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate a 7-digit numeric token
    const resetPasswordToken = Math.floor(1000000 + Math.random() * 9000000).toString();

    // Save the token with the user
    await strapi.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: { resetPasswordToken },
    });

    // Send the email with your custom token
    await strapi.plugin('email').service('email').send({
      to: user.email,
      subject: 'Reset Password',
      text: `Your reset password code is: ${resetPasswordToken}`,
      html: `<p>Your reset password code is: <strong>${resetPasswordToken}</strong></p>`,
    });

    return resetPasswordToken;
  };

  return plugin;
};
