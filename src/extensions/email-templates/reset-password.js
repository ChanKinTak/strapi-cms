module.exports = {
    subject: '重設密碼驗證碼',
    text: `
      您好,
      
      我們收到您的密碼重設請求。請使用以下驗證碼更新您的密碼:
      
      <%= token %>
      
      在密碼重設頁面輸入此驗證碼，並按照指示設定新密碼。
      
      謝謝!
    `,
    html: `
      <p>您好,</p>
      
      <p>我們收到您的密碼重設請求。請使用以下驗證碼更新您的密碼:</p>
      
      <p style="font-size: 18px; font-weight: bold; padding: 10px; background-color: #f5f5f5; border-radius: 4px; letter-spacing: 2px;"><%= token %></p>
      
      <p>在密碼重設頁面輸入此驗證碼，並按照指示設定新密碼。</p>
      
      <p>謝謝!</p>
    `,
  };