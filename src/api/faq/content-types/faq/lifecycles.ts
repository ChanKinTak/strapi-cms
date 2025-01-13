export default {
    afterUpdate: async (event) => {
      const { result } = event;
      
      try {
        await strapi.plugins.email.services.email.send({
          to: 'tak@add-values.com',
          subject: '資料已更新',
          html: `<h1>資料更新通知</h1>
                 <p>ID ${result.id} 的資料已被更新</p>
                 <p>更新時間: ${new Date().toLocaleString()}</p>`,
        });
      } catch (error) {
        console.error('發送電子郵件失敗:', error);
      }
    },
  };