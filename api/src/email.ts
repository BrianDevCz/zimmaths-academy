import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM_EMAIL = "ZimMaths Academy <noreply@zimmaths.com>";

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  try {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Verify your ZimMaths Academy account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a5276; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ZimMaths Academy</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">Welcome, ${name}! 🎉</h2>
            <p style="color: #555; line-height: 1.6;">
              Thank you for joining ZimMaths Academy. Please verify your email address to activate your account.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}"
                style="background: #1a5276; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Verify My Email
              </a>
            </div>
            <p style="color: #999; font-size: 13px;">
              This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 12px;">
              Or copy this link: ${verifyUrl}
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  try {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your ZimMaths Academy password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a5276; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ZimMaths Academy</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #555; line-height: 1.6;">
              Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                style="background: #1a5276; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Reset My Password
              </a>
            </div>
            <p style="color: #999; font-size: 13px;">
              This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 12px;">
              Or copy this link: ${resetUrl}
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}