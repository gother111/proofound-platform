#!/usr/bin/env node

/**
 * Test Email Script - Verify Resend Configuration
 *
 * This script tests your Resend API setup by sending a test email.
 *
 * Usage:
 *   node scripts/test-email.mjs your-email@example.com
 *
 * Requirements:
 *   - RESEND_API_KEY in environment (.env.local or Vercel)
 *   - EMAIL_FROM in environment (optional, defaults to Proofound)
 */

import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Proofound <onboarding@resend.dev>';

// Get recipient email from command line argument
const recipientEmail = process.argv[2];

// Validate inputs
if (!recipientEmail) {
  console.error('\n❌ Error: No recipient email provided');
  console.log('\nUsage:');
  console.log('  node scripts/test-email.mjs your-email@example.com\n');
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error('\n❌ Error: RESEND_API_KEY not found in environment');
  console.log('\nPlease ensure RESEND_API_KEY is set in:');
  console.log('  - .env.local (for local testing)');
  console.log('  - Vercel environment variables (for production)\n');
  console.log('Get your API key from: https://resend.com/api-keys\n');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error('\n❌ Error: Invalid email format');
  console.log(`Provided: ${recipientEmail}\n`);
  process.exit(1);
}

// Initialize Resend
console.log('\n🔧 Initializing Resend...');
console.log(`   API Key: ${RESEND_API_KEY.substring(0, 10)}...`);
console.log(`   From: ${EMAIL_FROM}`);
console.log(`   To: ${recipientEmail}\n`);

const resend = new Resend(RESEND_API_KEY);

// Send test email
async function sendTestEmail() {
  try {
    console.log('📤 Sending test email...\n');

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipientEmail,
      subject: '✅ Proofound Email Test - Success!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f3ee;
              }
              .container {
                background-color: white;
                padding: 40px;
                border-radius: 12px;
                border: 2px solid #e8e5dc;
              }
              .header {
                text-align: center;
                margin-bottom: 32px;
              }
              .logo {
                font-size: 32px;
                font-weight: 600;
                color: #7a9278;
                margin: 0;
                font-family: 'Crimson Pro', Georgia, serif;
              }
              .success-badge {
                display: inline-block;
                background-color: #e8f5f0;
                color: #1c4d3a;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                padding: 8px 16px;
                border-radius: 4px;
                letter-spacing: 0.5px;
                margin-bottom: 16px;
              }
              h1 {
                font-size: 28px;
                font-weight: 600;
                color: #2c3e2c;
                margin: 16px 0;
                font-family: 'Crimson Pro', Georgia, serif;
              }
              .info-box {
                background-color: #f8f9fa;
                padding: 16px;
                border-left: 4px solid #5c8b89;
                border-radius: 4px;
                margin: 24px 0;
              }
              .info-box p {
                margin: 8px 0;
                font-size: 14px;
              }
              .footer {
                text-align: center;
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #e8e5dc;
                font-size: 12px;
                color: #9ca3af;
              }
              .check-mark {
                font-size: 48px;
                color: #1c4d3a;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Proofound</div>
              </div>

              <div style="text-align: center;">
                <div class="success-badge">✓ Test Successful</div>
                <div class="check-mark">✓</div>
                <h1>Email Configuration Works!</h1>
              </div>

              <p>Congratulations! Your Resend email integration is properly configured and working.</p>

              <div class="info-box">
                <p><strong>✓ What This Means:</strong></p>
                <p>• Your RESEND_API_KEY is valid and active</p>
                <p>• Email sending functionality is operational</p>
                <p>• All transactional emails will work correctly</p>
                <p>• You're ready for production deployment</p>
              </div>

              <p><strong>Email Features Now Available:</strong></p>
              <ul>
                <li>Email verification for new users</li>
                <li>Password reset emails</li>
                <li>Organization invitations</li>
                <li>Skill verification requests</li>
                <li>Match notifications</li>
                <li>Account deletion reminders</li>
              </ul>

              <p style="margin-top: 32px; font-size: 14px; color: #6b7280;">
                This was a test email sent from your Proofound application to verify email configuration.
                If you didn't request this test, you can safely ignore it.
              </p>

              <div class="footer">
                <p>© ${new Date().getFullYear()} Proofound. All rights reserved.</p>
                <p>Powered by Resend</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('✅ SUCCESS! Email sent successfully\n');
    console.log('📧 Email Details:');
    console.log(`   Email ID: ${result.data?.id || result.id}`);
    console.log(`   From: ${EMAIL_FROM}`);
    console.log(`   To: ${recipientEmail}`);
    console.log(`   Status: Sent\n`);

    console.log('🔍 Next Steps:');
    console.log('   1. Check your inbox at:', recipientEmail);
    console.log('   2. Check spam folder if not in inbox');
    console.log('   3. Verify Resend dashboard: https://resend.com/logs');
    console.log('   4. All email features should now work in your app!\n');

    console.log('✨ Email configuration verified and ready for production!\n');

    return result;
  } catch (error) {
    console.error('❌ FAILED to send email\n');
    console.error('Error Details:');
    console.error(`   Message: ${error.message}`);

    if (error.message.includes('API key')) {
      console.log('\n💡 Troubleshooting: API Key Issues');
      console.log('   • Verify RESEND_API_KEY is correct');
      console.log('   • Check it starts with "re_"');
      console.log('   • Regenerate key if needed: https://resend.com/api-keys');
      console.log('   • Update .env.local and Vercel environment variables\n');
    } else if (error.message.includes('domain')) {
      console.log('\n💡 Troubleshooting: Domain Issues');
      console.log('   • Verify domain in Resend dashboard');
      console.log('   • Check DNS records (SPF, DKIM, DMARC)');
      console.log('   • Use onboarding@resend.dev for testing');
      console.log('   • See: docs/RESEND_SETUP.md\n');
    } else {
      console.log('\n💡 Troubleshooting:');
      console.log('   • Check Resend dashboard: https://resend.com/logs');
      console.log('   • Verify API key permissions');
      console.log('   • See documentation: docs/RESEND_SETUP.md\n');
    }

    process.exit(1);
  }
}

// Run the test
sendTestEmail();
