import nodemailer from 'nodemailer';
import { createError } from '../utils/error.js';

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEstimateEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(createError(400, 'Email is required'));
    }

    // Email to customer
    const customerMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your PAKSUMBASE Property Estimate Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4C924D;">Thank you for your estimate request!</h2>
          <p>We've received your request for a property estimate. Our team will analyze the market data and get back to you within 24 hours.</p>
          <p>In the meantime, you can:</p>
          <ul>
            <li>Browse our latest listings</li>
            <li>Check out our market insights</li>
            <li>Read our property guides</li>
          </ul>
          <p>Best regards,<br>The PAKSUMBASE Team</p>
        </div>
      `
    };

    // Email to admin/team
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Estimate Request',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #4C924D;">New Estimate Request</h2>
          <p>Customer Email: ${email}</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    // Send emails
    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(adminMailOptions);

    res.status(200).json({
      success: true,
      message: 'Estimate request sent successfully'
    });

  } catch (error) {
    console.error('Email error:', error);
    next(createError(500, 'Failed to send estimate request'));
  }
};