import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "noreply@pokeus.app";
const APP_NAME = "PokeUs";

export async function sendOTPEmail(
  email: string,
  name: string,
  otp: string,
  type: "verify" | "reset"
): Promise<void> {
  const subject =
    type === "verify"
      ? `${otp} is your ${APP_NAME} verification code`
      : `${otp} — Reset your ${APP_NAME} password`;

  const title =
    type === "verify" ? "Verify your email" : "Reset your password";

  const description =
    type === "verify"
      ? "Welcome to PokeUs! Enter this code to verify your email and start connecting with your partner."
      : "Someone requested a password reset for your PokeUs account. Enter this code to continue.";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width"/>
    </head>
    <body style="margin:0;padding:0;background:#08061a;font-family:Inter,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#08061a;padding:40px 20px;">
        <tr><td align="center">
          <table width="100%" style="max-width:480px;background:#12093e;border-radius:24px;overflow:hidden;border:1px solid rgba(217,70,239,0.2);">
            <tr>
              <td style="background:linear-gradient(135deg,#d946ef,#e11d48);padding:32px;text-align:center;">
                <p style="font-size:36px;margin:0;line-height:1;">💜</p>
                <h1 style="color:#fff;font-size:24px;margin:8px 0 0;font-weight:800;">${APP_NAME}</h1>
                <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px;">Private space for two</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;">
                <h2 style="color:#f5f0ff;font-size:20px;margin:0 0 8px;font-weight:700;">${title}</h2>
                <p style="color:#b4a5d2;font-size:15px;line-height:1.6;margin:0 0 28px;">Hi ${name}, ${description}</p>
                <div style="background:rgba(217,70,239,0.12);border:2px solid rgba(217,70,239,0.3);border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;">
                  <p style="color:#b4a5d2;font-size:13px;margin:0 0 8px;letter-spacing:0.1em;text-transform:uppercase;">Your code</p>
                  <p style="color:#f5f0ff;font-size:40px;font-weight:900;letter-spacing:0.25em;margin:0;">${otp}</p>
                  <p style="color:#b4a5d2;font-size:13px;margin:8px 0 0;">Expires in 10 minutes</p>
                </div>
                <p style="color:#7a6996;font-size:13px;margin:0;">If you didn't request this, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px;text-align:center;">
                <p style="color:#4a3d6e;font-size:12px;margin:0;">© 2024 ${APP_NAME} · Made with 💜</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  await resend.emails.send({ from: FROM, to: email, subject, html });
}

export async function sendInviteEmail(
  email: string,
  senderName: string,
  inviteCode: string
): Promise<void> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteCode}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${senderName} wants to connect with you on ${APP_NAME} 💜`,
    html: `
      <div style="font-family:Inter,sans-serif;background:#08061a;padding:40px;min-height:100vh;">
        <div style="max-width:480px;margin:0 auto;background:#12093e;border-radius:24px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#d946ef,#e11d48);padding:32px;text-align:center;">
            <p style="font-size:40px;margin:0;">💌</p>
            <h1 style="color:#fff;font-size:22px;margin:8px 0 0;font-weight:800;">You're invited!</h1>
          </div>
          <div style="padding:32px;">
            <p style="color:#f5f0ff;font-size:16px;line-height:1.6;">
              <strong>${senderName}</strong> wants you to be their partner on PokeUs — a private space just for the two of you.
            </p>
            <a href="${inviteUrl}" style="display:block;margin:24px 0;padding:16px;background:linear-gradient(135deg,#d946ef,#e11d48);color:#fff;text-decoration:none;border-radius:14px;text-align:center;font-weight:700;font-size:16px;">
              Accept Invitation 💜
            </a>
            <p style="color:#7a6996;font-size:13px;">Or visit: ${inviteUrl}</p>
          </div>
        </div>
      </div>
    `,
  });
}
