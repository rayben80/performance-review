// Netlify Functions를 통한 실제 Gmail 발송
// 이 함수는 별도 Netlify 사이트에 배포하여 사용

const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, subject, html, gmailUser, gmailAppPassword, systemName } = JSON.parse(event.body);

    // Gmail SMTP 설정
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });

    // 메일 옵션
    const mailOptions = {
      from: `"${systemName}" <${gmailUser}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: gmailUser
    };

    // 실제 이메일 발송
    const result = await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        messageId: result.messageId,
        response: result.response
      })
    };

  } catch (error) {
    console.error('이메일 발송 실패:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

// 배포 방법:
// 1. Netlify에 새 사이트 생성
// 2. netlify/functions/send-email.js로 이 파일 배포
// 3. URL: https://your-site.netlify.app/.netlify/functions/send-email