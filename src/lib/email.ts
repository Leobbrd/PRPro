import nodemailer from 'nodemailer'
import { nanoid } from 'nanoid'
import { redisService } from './redis'

export interface EmailConfig {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  fromEmail: string
  fromName: string
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private config: EmailConfig

  constructor(config: EmailConfig) {
    this.config = config
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  }

  async sendVerificationEmail(email: string, name: string): Promise<string> {
    const token = nanoid(32)
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`

    // Store token in Redis with 24-hour expiration
    await redisService.setEx(`email_verification:${token}`, 24 * 60 * 60, email)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>メール認証</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">PRPro - メール認証</h2>
            <p>こんにちは、${name}さん</p>
            <p>PRProへのご登録ありがとうございます。</p>
            <p>以下のリンクをクリックして、メールアドレスの認証を完了してください：</p>
            <div style="margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                メールアドレスを認証する
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              このリンクは24時間有効です。<br>
              もしこのメールに心当たりがない場合は、このメールを無視してください。
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              PRPro - PR会社用調整Webサービス
            </p>
          </div>
        </body>
      </html>
    `

    await this.transporter.sendMail({
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: email,
      subject: 'PRPro - メールアドレスの認証',
      html,
    })

    return token
  }

  async sendPasswordResetEmail(email: string, name: string): Promise<string> {
    const token = nanoid(32)
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

    // Store token in Redis with 1-hour expiration
    await redis.setEx(`password_reset:${token}`, 60 * 60, email)

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>パスワードリセット</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">PRPro - パスワードリセット</h2>
            <p>こんにちは、${name}さん</p>
            <p>パスワードリセットのリクエストを受け付けました。</p>
            <p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
            <div style="margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                パスワードをリセットする
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              このリンクは1時間有効です。<br>
              もしこのリクエストに心当たりがない場合は、このメールを無視してください。
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              PRPro - PR会社用調整Webサービス
            </p>
          </div>
        </body>
      </html>
    `

    await this.transporter.sendMail({
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: email,
      subject: 'PRPro - パスワードリセット',
      html,
    })

    return token
  }

  async verifyEmailToken(token: string): Promise<string | null> {
    const email = await redis.get(`email_verification:${token}`)
    if (email) {
      await redis.del(`email_verification:${token}`)
    }
    return email
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    const email = await redis.get(`password_reset:${token}`)
    if (email) {
      await redis.del(`password_reset:${token}`)
    }
    return email
  }
}

// Default email service instance
export const emailService = new EmailService({
  smtpHost: process.env.SMTP_HOST || 'localhost',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  fromEmail: process.env.FROM_EMAIL || 'noreply@prpro.local',
  fromName: process.env.FROM_NAME || 'PRPro',
})
