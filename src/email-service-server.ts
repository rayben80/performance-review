// 서버 환경용 실제 Gmail SMTP 이메일 서비스
import * as nodemailer from 'nodemailer';

interface EmailConfig {
  gmailUser: string;
  gmailAppPassword: string;
  systemName: string;
  baseUrl: string;
}

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export class ServerEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: this.config.gmailUser,
          pass: this.config.gmailAppPassword,
        },
      });

      console.log('✅ Gmail SMTP transporter initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Gmail SMTP:', error);
    }
  }

  // 회원가입 신청 알림 (관리자에게)
  async notifySignupRequest(userData: { name: string; email: string; role: string }) {
    const template: EmailTemplate = {
      to: 'admin@company.com',
      subject: `[${this.config.systemName}] 새로운 회원가입 신청`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
                .footer { background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 10px; }
                .user-info { background: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🔔 새로운 회원가입 신청</h2>
                </div>
                <div class="content">
                    <p>안녕하세요, 관리자님!</p>
                    <p><strong>${this.config.systemName}</strong>에 새로운 회원가입 신청이 있습니다.</p>
                    
                    <div class="user-info">
                        <h3>📋 신청자 정보</h3>
                        <p><strong>이름:</strong> ${userData.name}</p>
                        <p><strong>이메일:</strong> ${userData.email}</p>
                        <p><strong>신청 역할:</strong> ${this.getRoleName(userData.role)}</p>
                        <p><strong>신청 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                    </div>
                    
                    <p>승인 또는 거부 처리를 위해 관리자 패널에 접속하세요.</p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${this.config.baseUrl}" class="button">관리자 패널 접속</a>
                    </div>
                </div>
                <div class="footer">
                    <p style="color: #6b7280; font-size: 14px;">
                        이 메일은 ${this.config.systemName}에서 자동 발송되었습니다.<br>
                        문의사항이 있으시면 ${this.config.gmailUser}로 연락 주세요.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }

  // 회원가입 승인 알림 (신청자에게)
  async notifyApproval(userData: { name: string; email: string; approverName: string }) {
    const template: EmailTemplate = {
      to: userData.email,
      subject: `[${this.config.systemName}] 계정 승인 완료 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center; border-radius: 8px 8px 0 0; color: white; }
                .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
                .footer { background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 10px; }
                .success-box { background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>✅ 계정 승인 완료!</h2>
                </div>
                <div class="content">
                    <p>안녕하세요, <strong>${userData.name}</strong>님!</p>
                    
                    <div class="success-box">
                        <h3>🎉 계정 승인이 완료되었습니다</h3>
                        <p><strong>${this.config.systemName}</strong> 계정이 성공적으로 승인되었습니다.</p>
                        <p><strong>승인자:</strong> ${userData.approverName}</p>
                        <p><strong>승인 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                    </div>
                    
                    <p>이제 시스템에 로그인하여 모든 기능을 사용하실 수 있습니다.</p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${this.config.baseUrl}" class="button">지금 로그인하기</a>
                    </div>
                    
                    <h3>📌 다음 단계</h3>
                    <ul>
                        <li>로그인 후 개인 프로필 설정</li>
                        <li>조직 정보 확인 및 업데이트</li>
                        <li>평가 시스템 사용법 숙지</li>
                    </ul>
                </div>
                <div class="footer">
                    <p style="color: #6b7280; font-size: 14px;">
                        환영합니다! 궁금한 점이 있으시면 언제든 ${this.config.gmailUser}로 연락 주세요.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }

  // 회원가입 거부 알림 (신청자에게)
  async notifyRejection(userData: { name: string; email: string; reason: string; approverName: string }) {
    const template: EmailTemplate = {
      to: userData.email,
      subject: `[${this.config.systemName}] 계정 신청 검토 결과`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 20px; text-align: center; border-radius: 8px 8px 0 0; color: white; }
                .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
                .footer { background: #f9fafb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
                .rejection-box { background: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 6px; margin: 15px 0; }
                .contact-button { display: inline-block; padding: 12px 24px; background: #6b7280; color: white; text-decoration: none; border-radius: 6px; margin: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📋 계정 신청 검토 결과</h2>
                </div>
                <div class="content">
                    <p>안녕하세요, <strong>${userData.name}</strong>님!</p>
                    
                    <div class="rejection-box">
                        <h3>⚠️ 계정 신청이 승인되지 않았습니다</h3>
                        <p><strong>검토자:</strong> ${userData.approverName}</p>
                        <p><strong>검토 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                        ${userData.reason ? `<p><strong>사유:</strong> ${userData.reason}</p>` : ''}
                    </div>
                    
                    <h3>📞 추가 문의</h3>
                    <p>승인되지 않은 사유에 대해 궁금한 점이 있으시거나, 추가 정보를 제공하고 싶으시면 언제든 연락해 주세요.</p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="mailto:${this.config.gmailUser}" class="contact-button">문의하기</a>
                    </div>
                    
                    <p>필요시 정보를 보완하여 다시 신청하실 수 있습니다.</p>
                </div>
                <div class="footer">
                    <p style="color: #6b7280; font-size: 14px;">
                        ${this.config.systemName}<br>
                        문의: ${this.config.gmailUser}
                    </p>
                </div>
            </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(template);
  }

  private getRoleName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'admin': '관리자',
      'user': '일반 사용자',
      'admin_user': '관리자겸사용자 (팀장)'
    };
    return roleNames[role] || role;
  }

  private async sendEmail(template: EmailTemplate): Promise<boolean> {
    if (!this.transporter) {
      console.error('❌ Gmail SMTP transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: `"${this.config.systemName}" <${this.config.gmailUser}>`,
        to: template.to,
        subject: template.subject,
        html: template.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ 실제 이메일 발송 성공:', result.messageId);
      console.log('📧 발송 대상:', template.to);
      console.log('📋 제목:', template.subject);
      return true;
    } catch (error) {
      console.error('❌ Gmail SMTP 발송 실패:', error);
      return false;
    }
  }

  // 연결 테스트
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Gmail SMTP 연결 확인 완료');
      return true;
    } catch (error) {
      console.error('❌ Gmail SMTP 연결 실패:', error);
      console.error('설정을 확인하세요: 앱 비밀번호, 2단계 인증');
      return false;
    }
  }
}