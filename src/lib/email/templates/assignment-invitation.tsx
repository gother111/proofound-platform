/**
 * Assignment Invitation Email Template
 *
 * Sent when an organization invites a stakeholder to complete profile sections
 */

interface AssignmentInvitationEmailProps {
  stakeholderName?: string;
  organizationName: string;
  assignedSections: string[];
  message?: string;
  invitationUrl: string;
  expiryDate: string;
}

export function AssignmentInvitationEmail({
  stakeholderName,
  organizationName,
  assignedSections,
  message,
  invitationUrl,
  expiryDate,
}: AssignmentInvitationEmailProps) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to contribute</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #2D3330;
      background-color: #F7F6F1;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1C4D3A 0%, #2D5F4A 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .message {
      background-color: #F7F6F1;
      border-left: 4px solid #1C4D3A;
      padding: 16px;
      margin: 20px 0;
      font-style: italic;
    }
    .sections {
      background-color: #F7F6F1;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .sections h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #1C4D3A;
    }
    .sections ul {
      margin: 0;
      padding-left: 20px;
    }
    .sections li {
      margin: 8px 0;
      color: #2D3330;
    }
    .button {
      display: inline-block;
      background-color: #1C4D3A;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #2D5F4A;
    }
    .expiry {
      background-color: #FFF4E6;
      border: 1px solid #FFE0B2;
      border-radius: 6px;
      padding: 12px;
      margin: 20px 0;
      font-size: 14px;
      color: #856404;
    }
    .footer {
      background-color: #F7F6F1;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #6B6760;
      border-top: 1px solid: #E8E6DD;
    }
    .footer a {
      color: #1C4D3A;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Trust Page Contribution Invitation</h1>
    </div>

    <div class="content">
      <div class="greeting">
        ${stakeholderName ? `Hello ${stakeholderName},` : 'Hello,'}
      </div>

      <p>
        <strong>${organizationName}</strong> has invited you to help complete their organization trust page on Proofound.
      </p>

      ${
        message
          ? `
      <div class="message">
        <strong>Personal message from ${organizationName}:</strong><br>
        ${message}
      </div>
      `
          : ''
      }

      <div class="sections">
        <h3>You've been asked to complete the following sections:</h3>
        <ul>
          ${assignedSections.map((section) => `<li><strong>${section.charAt(0).toUpperCase() + section.slice(1)}</strong></li>`).join('')}
        </ul>
      </div>

      <p>
        Your input will help provide a complete and accurate picture of ${organizationName}'s work and impact.
        <strong>No account is required</strong> – simply click the button below to get started.
      </p>

      <div style="text-align: center;">
        <a href="${invitationUrl}" class="button">
          Complete Trust Page Sections
        </a>
      </div>

      <div class="expiry">
        ⏰ <strong>Note:</strong> This invitation expires on ${expiryDate}
      </div>

      <p style="font-size: 14px; color: #6B6760; margin-top: 30px;">
        If you have any questions or need assistance, please reply to this email or contact ${organizationName} directly.
      </p>
    </div>

    <div class="footer">
      <p>
        This invitation was sent by ${organizationName} via Proofound.<br>
        <a href="https://proofound.io">Learn more about Proofound</a>
      </p>
      <p style="font-size: 12px; margin-top: 20px;">
        If you believe you received this email in error, you can safely ignore it.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the email
 */
export function AssignmentInvitationEmailText({
  stakeholderName,
  organizationName,
  assignedSections,
  message,
  invitationUrl,
  expiryDate,
}: AssignmentInvitationEmailProps) {
  return `
Trust Page Contribution Invitation

${stakeholderName ? `Hello ${stakeholderName},` : 'Hello,'}

${organizationName} has invited you to help complete their organization trust page on Proofound.

${message ? `Personal message from ${organizationName}:\n${message}\n\n` : ''}

You've been asked to complete the following sections:
${assignedSections.map((s) => `- ${s.charAt(0).toUpperCase() + s.slice(1)}`).join('\n')}

Your input will help provide a complete and accurate picture of ${organizationName}'s work and impact. No account is required.

Complete the trust page sections here:
${invitationUrl}

This invitation expires on ${expiryDate}

If you have any questions, please reply to this email or contact ${organizationName} directly.

---
This invitation was sent by ${organizationName} via Proofound.
Learn more: https://proofound.io
  `.trim();
}
