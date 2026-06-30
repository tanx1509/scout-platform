import { Resend } from 'resend';
import jwt from 'jsonwebtoken';

// Lazy-init: only create client when key is genuinely set
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith('re_1234')) return null;
  return new Resend(key);
}

export async function sendAdminApprovalEmail(user: { id: string, name: string | null, email: string | null }) {
  const adminEmail = "tanishqsethi04@gmail.com";
  
  // Create an expiring JWT token (valid for 1 hour)
  const token = jwt.sign(
    { userId: user.id }, 
    process.env.AUTH_SECRET || 'secret', 
    { expiresIn: '1h' }
  );
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const approvalLink = `${baseUrl}/approve-access?token=${token}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; padding: 20px;">
      <h2>Scout</h2>
      <h3 style="color: #555;">New Recruiter Access Request</h3>
      <table style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Name</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.name || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.email || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Requested</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
      
      <div style="margin-top: 30px;">
        <a href="${approvalLink}" style="background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; margin-right: 10px;">Review & Approve</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 12px; color: #888;">
        This link expires in 1 hour. If you do not wish to grant access, you can ignore this email.
      </p>
    </div>
  `;

  try {
    const resend = getResend();
    if (!resend) {
      console.log("[email] Resend not configured in demo mode — skipping approval email.");
      return;
    }
    await resend.emails.send({
      from: 'Scout Security <onboarding@resend.dev>',
      to: adminEmail,
      subject: 'Action Required: New Workspace Access Request',
      html: htmlContent,
    });
    console.log("Approval email sent to admin.");
  } catch (error) {
    console.error("Error sending approval email:", error);
  }
}
