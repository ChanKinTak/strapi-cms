export default {
    async afterCreate(event) {    // Connected to "Save" button in admin panel
        const { result } = event;

        try{
            await strapi.plugins['email'].services.email.send({
                to: 'tak@add-values.com',     // 必須有效的郵箱地址
                from: process.env.SMTP_FROM, // 必須是在 SendGrid 已驗證的域名
                subject: 'Test Subject',         // 不能為空
                text: 'Hello world'              // text 或 html 至少要有一個
              });
        } catch(err) {
            console.log(err);
        }
    }
}