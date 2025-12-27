import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

async function verifyCaptcha(token: string): Promise<boolean> {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY not configured");
      return false;
    }

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      issueName,
      location,
      startDate,
      type,
      complainantName,
      email,
      phone,
      photoLink,
      description,
      captchaToken
    } = body;

    // Validate required fields
    if (!issueName || !location || !type || !complainantName || !email || !description || !captchaToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify CAPTCHA
    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed" },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: "citizens.east.blr@gmail.com",
      subject: `New Citizen Issue: ${issueName}`,
      html: `
        <h2>New Citizen Issue Report</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Issue Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${issueName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${location}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Start Date:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${startDate || 'Not specified'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${type}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Complainant Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${complainantName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${email}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${phone || 'Not provided'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Photo/Link:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${photoLink || 'Not provided'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Description:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${description.replace(/\n/g, '<br>')}</td></tr>
        </table>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting citizen issue:", error);
    return NextResponse.json(
      { error: "Failed to submit issue" },
      { status: 500 }
    );
  }
}