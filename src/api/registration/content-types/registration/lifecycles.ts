export default {
    async afterCreate(event) {    // Connected to "Save" button in admin panel
        const { result } = event;

        try{
            await strapi.plugins['email'].services.email.send({
                to: '${result.email}',     // 必須有效的郵箱地址
                from: process.env.SMTP_FROM, // 必須是在 SendGrid 已驗證的域名
                subject: '成功登記布拉格海外會議2025 Successfully registered for P2025 Prague Convention',         // 不能為空
                text: '已成功登記 Successfully registered'              // text 或 html 至少要有一個
              });
        } catch(err) {
            console.log(err);
        }
    }
}