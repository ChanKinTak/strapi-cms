export default {
    async afterCreate(event) {    // Connected to "Save" button in admin panel
        const { result } = event;
        console.log('afterCreate triggered for:', result.id);
        try{
            await strapi.plugins['email'].services.email.send({
                to:  `${result.email}`,     // 必須有效的郵箱地址
                from: process.env.SMTP_FROM, // 必須是在 SendGrid 已驗證的域名
                subject: '成功登記布拉格海外會議2025 Successfully registered for 2025 Prague Convention',
                html: `<p>尊敬的${result.chineseName} :</p><p>你好，非常感謝閣下參加本次保誠保險布拉格海外會議2025活動。<br/>現已確認收到閣下填寫的會議登記資料。如閣下需修改其中資料，請於<u>2025年2月19日星期三下午6時前</u>再次登入 Mobile APP 中進行修改，逾時將無法修改資料。</p><p>如對本次活動行程安排有任何疑問，可於辦公時間通過熱線電話：+852 6386 5601 (支援 WhatsApp) 或電郵 Prague2025@kuonitumlare.com 聯絡我們。</p><p>謝謝。</p><p>【這是一條自動產生的訊息，請勿回覆。】</p>`            
              });
        } catch(err) {
            console.log(err);
        }
    }
}