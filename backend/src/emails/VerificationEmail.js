import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email";

export const VerificationEmail = ({ fullName = "User", email = "", code = "000000" }) => {
  const logoUrl =
    process.env.CLOUDINARY_APP_LOGO ||
    process.env.CLOUDINARY_DEFAULT_AVATAR ||
    "https://via.placeholder.com/60";

  return React.createElement(
    Html,
    { lang: "en" },
    React.createElement(
      Head,
      null,
      React.createElement("meta", { charSet: "utf-8" }),
      React.createElement("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0",
      }),
    ),
    React.createElement(
      Preview,
      null,
      `Your Chatlight OTP verification code is ${code}`,
    ),
    React.createElement(
      Body,
      {
        style: {
          backgroundColor: "#f4f6fb",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          margin: "0",
          padding: "20px 10px",
          color: "#1e293b",
        },
      },
      React.createElement(
        Container,
        {
          style: {
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            padding: "36px 28px",
            maxWidth: "560px",
            margin: "0 auto",
            boxShadow:
              "0 15px 35px -5px rgba(99, 102, 241, 0.15), 0 0 15px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e2e8f0",
          },
        },
        React.createElement(
          Section,
          { style: { textAlign: "center", marginBottom: "28px" } },
          React.createElement(
            "div",
            {
              style: {
                display: "inline-block",
                padding: "6px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
                boxShadow: "0 8px 16px rgba(99, 102, 241, 0.3)",
              },
            },
            React.createElement(Img, {
              src: logoUrl,
              alt: "Chatlight",
              width: "56",
              height: "56",
              style: {
                borderRadius: "12px",
                display: "block",
                objectFit: "cover",
              },
            }),
          ),
          React.createElement(
            Heading,
            {
              style: {
                margin: "14px 0 0 0",
                fontSize: "26px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                color: "#4f46e5",
              },
            },
            React.createElement("span", { style: { color: "#4f46e5" } }, "Chat"),
            React.createElement("span", { style: { color: "#ec4899" } }, "light"),
          ),
        ),

        React.createElement(
          Heading,
          {
            as: "h2",
            style: {
              fontSize: "22px",
              fontWeight: "700",
              color: "#0f172a",
              textAlign: "center",
              margin: "0 0 8px 0",
            },
          },
          "🔐 Email Verification Code",
        ),
        React.createElement(
          Text,
          {
            style: {
              fontSize: "15px",
              color: "#64748b",
              textAlign: "center",
              margin: "0 0 24px 0",
              lineHeight: "1.5",
            },
          },
          "Hi ",
          React.createElement(
            "span",
            { style: { color: "#6366f1", fontWeight: "600" } },
            fullName,
          ),
          "! Welcome to ",
          React.createElement(
            "span",
            { style: { color: "#ec4899", fontWeight: "600" } },
            "Chatlight",
          ),
          ". Complete your signup with the code below.",
        ),

        React.createElement(
          Section,
          {
            style: {
              background:
                "linear-gradient(135deg, #eef2ff 0%, #fae8ff 50%, #e0e7ff 100%)",
              borderRadius: "16px",
              padding: "28px 20px",
              textAlign: "center",
              margin: "24px 0",
              border: "2px dashed #818cf8",
              boxShadow: "inset 0 2px 4px rgba(255, 255, 255, 0.8)",
            },
          },
          React.createElement(
            Text,
            {
              style: {
                fontSize: "13px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: "#4338ca",
                margin: "0 0 10px 0",
              },
            },
            "Your Verification Code",
          ),
          React.createElement(
            Text,
            {
              style: {
                fontFamily:
                  "'Courier New', Courier, 'Cascadia Code', monospace",
                fontSize: "36px",
                fontWeight: "900",
                letterSpacing: "10px",
                color: "#1e1b4b",
                margin: "0 0 12px 0",
                textShadow: "0 2px 4px rgba(99, 102, 241, 0.2)",
              },
            },
            code,
          ),
          React.createElement(
            Text,
            {
              style: {
                fontSize: "13px",
                color: "#d97706",
                fontWeight: "600",
                margin: "0",
                display: "inline-block",
                backgroundColor: "#fffbeb",
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid #fcd34d",
              },
            },
            "⏰ Expires in 10 minutes",
          ),
        ),

        React.createElement(
          Section,
          {
            style: {
              backgroundColor: "#f0fdf4",
              borderLeft: "4px solid #10b981",
              borderRadius: "8px",
              padding: "16px",
              margin: "20px 0",
            },
          },
          React.createElement(
            Text,
            {
              style: {
                fontSize: "14px",
                color: "#065f46",
                margin: "0",
                lineHeight: "1.5",
              },
            },
            React.createElement(
              "strong",
              { style: { color: "#047857" } },
              "Security Tip: ",
            ),
            "Never share this OTP code with anyone. Chatlight team members will never ask for your verification code.",
          ),
        ),

        React.createElement(
          Text,
          {
            style: {
              fontSize: "14px",
              color: "#64748b",
              lineHeight: "1.6",
              margin: "20px 0",
              textAlign: "center",
            },
          },
          "If you didn't request this verification code, you can safely ignore this message.",
        ),

        React.createElement(Hr, {
          style: { borderColor: "#f1f5f9", margin: "28px 0 20px 0" },
        }),

        React.createElement(
          Section,
          { style: { textAlign: "center" } },
          React.createElement(
            Text,
            {
              style: {
                fontSize: "12px",
                color: "#94a3b8",
                margin: "0 0 6px 0",
                lineHeight: "1.5",
              },
            },
            "This email was sent to ",
            React.createElement(
              "span",
              { style: { color: "#6366f1" } },
              email,
            ),
          ),
          React.createElement(
            Text,
            {
              style: {
                fontSize: "12px",
                color: "#cbd5e1",
                margin: "0",
              },
            },
            `© ${new Date().getFullYear()} `,
            React.createElement(
              "span",
              { style: { color: "#818cf8", fontWeight: "600" } },
              "Chatlight",
            ),
            ". All rights reserved.",
          ),
        ),
      ),
    ),
  );
};

export default VerificationEmail;
