import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

import { required } from '../common/config/env.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Injectable()
export class MailService {
  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: required('EMAIL_USER'),
      pass: required('EMAIL_PASS'),
    },
  });
  private readonly baseUrl = required('BASE_URL');

  private async loadTemplate(name: string, token: string): Promise<string> {
    // Prefer compiled templates under dist/ in production, fallback to src/ in development
    const compiledPath = path.join(__dirname, 'templates', name);
    let templatePath = compiledPath;

    try {
      // Check compiled path first
      await fs.access(compiledPath);
    } catch {
      // Fallback to source templates for development
      templatePath = path.resolve(process.cwd(), 'src', 'mail', 'templates', name);
    }

    let html = await fs.readFile(templatePath, 'utf8');
    const url = `${this.baseUrl}/auth/${token}`;
    html = html.replace(/{{LINK}}/g, url);
    return html;
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"No Reply" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }

  public async sendConfirmationEmail(to: string, token: string): Promise<void> {
    const html = await this.loadTemplate(
      'confirm-email.html',
      `confirm-email?token=${token}`,
    );
    await this.sendEmail(to, '✅ Confirm your account', html);
  }

  public async sendConfirmationUpdatedEmail(
    to: string,
    token: string,
  ): Promise<void> {
    const html = await this.loadTemplate(
      'confirm-email-update.html',
      `confirm-email-update?token=${token}`,
    );
    await this.sendEmail(to, '📩 Confirm your new email', html);
  }

  public async sendRevertEmailChange(to: string, token: string): Promise<void> {
    const html = await this.loadTemplate(
      'revert-email.html',
      `revert-email?token=${token}`,
    );
    await this.sendEmail(to, '🔄 Revert email change', html);
  }

  public async sendPasswordReset(to: string, token: string): Promise<void> {
    const html = await this.loadTemplate(
      'reset-password.html',
      `reset-password?token=${token}`,
    );
    await this.sendEmail(to, '🔐 Reset your password', html);
  }

  public async sendUnlockAccount(to: string, token: string): Promise<void> {
    const html = await this.loadTemplate(
      'unlock-account.html',
      `unlock-account?token=${token}`,
    );
    await this.sendEmail(to, '🔓 Unlock your account', html);
  }
}
