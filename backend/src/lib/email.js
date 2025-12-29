import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

const __dirname = path.resolve();
dotenv.config({ path: path.join(__dirname, "../.env") });

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Generate 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, code, fullName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: {
      name: 'Chatlight',
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: 'Verify Your Email Address - Chatlight',
    html: `
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
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            color: white;
            font-size: 24px;
            font-weight: bold;
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
            <div class="logo">C</div>
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
              © 2025 Chatlight. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Log full error on the server for debugging
    console.error('Error sending verification email:', {
      message: error.message,
      code: error.code,
      response: error.response?.body || error.response,
    });
    // Re-throw with a more descriptive message that can be sent to client
    throw new Error(
      error.message ||
        'Failed to send verification email. Please check email configuration.'
    );
  }
};

// Send welcome email after successful verification
export const sendWelcomeEmail = async (email, fullName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: {
      name: 'Chatlight',
      address: process.env.EMAIL_USER,
    },
    to: email,
    subject: 'Welcome to Chatlight!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Chatlight</title>
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
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            color: #2d3748;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #718096;
            font-size: 18px;
            margin-bottom: 30px;
          }
          .message {
            color: #4a5568;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .features {
            background: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          .feature {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
          }
          .feature-icon {
            width: 24px;
            height: 24px;
            background: #48bb78;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            margin-right: 15px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">C</div>
            <h1 class="title">Welcome to Chatlight!</h1>
            <p class="subtitle">Your account has been successfully verified</p>
          </div>
          
          <p class="message">
            Hi ${fullName},
          </p>
          
          <p class="message">
            Congratulations! Your email has been successfully verified and your Chatlight account is now active. 
            You're all set to start connecting with friends and family.
          </p>
          
          <div class="features">
            <h3 style="color: #2d3748; margin-top: 0;">What you can do now:</h3>
            <div class="feature">
              <div class="feature-icon"></div>
              <span>Send and receive messages instantly</span>
            </div>
            <div class="feature">
              <div class="feature-icon"></div>
              <span>Connect with friends and family</span>
            </div>
            <div class="feature">
              <div class="feature-icon"></div>
              <span>Share photos and memories</span>
            </div>
            <div class="feature">
              <div class="feature-icon"></div>
              <span>Enjoy secure, private conversations</span>
            </div>
          </div>
          
          <p class="message">
            If you have any questions or need help getting started, don't hesitate to reach out to our support team.
          </p>
          
          <div class="footer">
            <p>
              Happy chatting!<br>
              The Chatlight Team
            </p>
            <p>
              © 2025 Chatlight. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email as it's not critical
    return { success: false, error: error.message };
  }
};
