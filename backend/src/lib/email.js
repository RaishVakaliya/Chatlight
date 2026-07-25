import dotenv from "dotenv";
import React from "react";
import { render } from "react-email";
import VerificationEmail from "../emails/VerificationEmail.js";

dotenv.config();

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
  const html = await render(
    React.createElement(VerificationEmail, { fullName, email, code }),
  );

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
