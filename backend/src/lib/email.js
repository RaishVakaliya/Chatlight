import dotenv from "dotenv";
import path from "path";

const __dirname = path.resolve();
dotenv.config({ path: path.join(__dirname, "../.env") });

const sendEmailViaBrevo = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail =
    process.env.SENDER_EMAIL ||
    process.env.EMAIL_USER ||
    "chatlight.service@gmail.com";

  if (!apiKey) {
    throw new Error(
      "BREVO_API_KEY is not configured in environment variables.",
    );
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Chatlight",
        email: senderEmail,
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Brevo API error response:", data);
    throw new Error(data.message || "Failed to send email via Brevo API.");
  }

  return data;
};

export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationEmail = async (email, code, fullName) => {
  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            overflow: hidden;
          }
          .title {
            color: #2d3748;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #718096;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .code-container {
            background: #f7fafc;
            border: 2px dashed #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #2d3748;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .code-label {
            color: #718096;
            font-size: 14px;
            margin-top: 10px;
          }
          .message {
            color: #4a5568;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .warning {
            background: #fff5f5;
            border-left: 4px solid #fc8181;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning-text {
            color: #c53030;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img 
                src="${process.env.CLOUDINARY_APP_LOGO || process.env.CLOUDINARY_DEFAULT_AVATAR || "https://via.placeholder.com/60"}" 
                alt="Chatlight Logo" 
                style="width: 100%; height: 100%; object-fit: cover; display: block;"
              />
            </div>
            <h1 class="title">Verify Your Email Address</h1>
            <p class="subtitle">Hi ${fullName}, welcome to Chatlight!</p>
          </div>
          
          <p class="message">
            Thank you for signing up! To complete your registration and start connecting with friends, 
            please verify your email address using the code below:
          </p>
          
          <div class="code-container">
            <div class="code">${code}</div>
            <div class="code-label">Enter this code in the verification screen</div>
          </div>
          
          <p class="message">
            This code will expire in <strong>10 minutes</strong> for security reasons. 
            If you didn't request this verification, please ignore this email.
          </p>
          
          <div class="warning">
            <p class="warning-text">
              <strong>Security Note:</strong> Never share this code with anyone. 
              Chatlight will never ask for your verification code via phone or email.
            </p>
          </div>
          
          <div class="footer">
            <p>
              This email was sent to ${email}. If you didn't create an account with Chatlight, 
              please ignore this email.
            </p>
            <p>
              © ${new Date().getFullYear()} Chatlight. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
  `;

  try {
    const info = await sendEmailViaBrevo({
      to: email,
      subject: "Verify Your Email Address - Chatlight",
      html,
    });
    console.log("Verification email sent via Brevo:", info.messageId || info);
    return { success: true, messageId: info.messageId || info.messageIds?.[0] };
  } catch (error) {
    console.error("Error sending verification email:", {
      message: error.message,
    });
    throw new Error(
      error.message ||
        "Failed to send verification email. Please check email configuration.",
    );
  }
};
