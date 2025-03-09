export default {
    async afterCreate(event) {    // Connected to "Save" button in admin panel
        const { result } = event;
        if (result.publishedAt === null) {
            return;
        }
        //console.log('afterCreate triggered for:', result.id);
        try{
            if(result.roommate_status === 'pending'){
             //send email to requestiong user
              await strapi.plugins['email'].services.email.send({
                to:  `${result.requesting_email}`,     // 必須有效的郵箱地址
                from: process.env.SMTP_FROM, // 必須是在 SendGrid 已驗證的域名
                subject: '布拉格海外會議2025酒店安排',
                html: `<p>尊敬的${result.requesting_name} :</p><p>你已邀請(${result.agent_code})${result.receive_name}成為你酒店同房室友</p><p>【這是一條自動產生的訊息，請勿回覆。】</p>`            
              });
              //send email to roommate
              await strapi.plugins['email'].services.email.send({
                to:  `${result.receive_email}`,     // 必須有效的郵箱地址
                from: process.env.SMTP_FROM, // 必須是在 SendGrid 已驗證的域名
                subject: '布拉格海外會議2025酒店安排',
                html: `<p>尊敬的${result.receive_name} :</p><p>(${result.agent_code})${result.requesting_name}已邀請你成為酒店同房室友</p><p>【這是一條自動產生的訊息，請勿回覆。】</p>`            
              });
            }
            if(result.roommate_status === 'rejected'){
                //send email to requestiong user
                 await strapi.plugins['email'].services.email.send({
                   to:  `${result.requesting_email}`,     // 必須有效的郵箱地址
                   from: process.env.SMTP_FROM, // 必須是在 SendGrid 已驗證的域名
                   subject: '布拉格海外會議2025酒店安排',
                   html: `<p>尊敬的${result.requesting_name} :</p><p>(${result.agent_code})${result.receive_name}已拒絕你成為酒店同房室友</p><p>【這是一條自動產生的訊息，請勿回覆。】</p>`            
                 });
                 //send email to roommate
                 await strapi.plugins['email'].services.email.send({
                   to:  `${result.receive_email}`,     // 必須有效的郵箱地址
                   from: process.env.SMTP_FROM, // 必須是在 SendGrid 已驗證的域名
                   subject: '布拉格海外會議2025酒店安排',
                   html: `<p>尊敬的${result.receive_name} :</p><p>您已拒絕(${result.agent_code})${result.requesting_name}成為酒店同房室友</p><p>【這是一條自動產生的訊息，請勿回覆。】</p>`            
                 });
               }
               if(result.roommate_status === 'accepted'){
                //send email to requestiong user
                 await strapi.plugins['email'].services.email.send({
                   to:  `${result.requesting_email}`,     // 必須有效的郵箱地址
                   from: process.env.SMTP_FROM, // 必須是在 SendGrid 已驗證的域名
                   subject: '布拉格海外會議2025酒店安排',
                   html: `<p>尊敬的${result.requesting_name} :</p><p>(${result.agent_code})${result.receive_name}已接受你成為酒店同房室友</p><p>【這是一條自動產生的訊息，請勿回覆。】</p>`            
                 });
                 //send email to roommate
                 await strapi.plugins['email'].services.email.send({
                   to:  `${result.receive_email}`,     // 必須有效的郵箱地址
                   from: process.env.SMTP_FROM, // 必須是在 SendGrid 已驗證的域名
                   subject: '布拉格海外會議2025酒店安排',
                   html: `<p>尊敬的${result.receive_name} :</p><p>你已接受(${result.agent_code})${result.requesting_name}已成為酒店同房室友</p><p>【這是一條自動產生的訊息，請勿回覆。】</p>`            
                 });
               }
        } catch(err) {
            console.log(err);
        }
    }
}