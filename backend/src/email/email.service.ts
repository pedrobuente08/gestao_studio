import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { verifyEmailTemplate } from './templates/verify-email.template';
import { resetPasswordTemplate } from './templates/reset-password.template';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly appUrl: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@inkstudio.com.br';
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${this.appUrl}/verify-email?token=${token}`;
    const html = verifyEmailTemplate(name, verificationUrl);

    try {
      await this.resend.emails.send({
        from: `InkStudio <${this.fromEmail}>`,
        to,
        subject: 'Verifique seu email — InkStudio',
        html,
      });
      this.logger.log(`Email de verificação enviado para ${to}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar email de verificação para ${to}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;
    const html = resetPasswordTemplate(name, resetUrl);

    try {
      await this.resend.emails.send({
        from: `InkStudio <${this.fromEmail}>`,
        to,
        subject: 'Recuperação de senha — InkStudio',
        html,
      });
      this.logger.log(`Email de recuperação de senha enviado para ${to}`);
    } catch (error) {
      this.logger.error(`Falha ao enviar email de recuperação para ${to}`, error);
      throw error;
    }
  }
}
