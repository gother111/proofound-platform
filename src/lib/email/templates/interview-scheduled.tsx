/**
 * Interview Scheduled Email Template
 *
 * Sent when an interview is scheduled between a candidate and organization
 */

interface InterviewScheduledEmailProps {
  candidateName: string;
  organizationName: string;
  interviewDate: string;
  interviewTime: string;
  duration: string;
  meetingLink?: string;
  calendarInvite?: string;
  assignmentTitle?: string;
}

export function InterviewScheduledEmail({
  candidateName,
  organizationName,
  interviewDate,
  interviewTime,
  duration,
  meetingLink,
  calendarInvite,
  assignmentTitle,
}: InterviewScheduledEmailProps) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Scheduled</title>
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
      background: linear-gradient(135deg, #1C4D3A 0%, #5F6E52 100%);
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
    .interview-details {
      background-color: #F7F6F1;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    .detail-row {
      display: flex;
      margin: 12px 0;
      align-items: flex-start;
    }
    .detail-label {
      font-weight: 600;
      color: #1C4D3A;
      min-width: 120px;
    }
    .detail-value {
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
      margin: 12px 8px;
      text-align: center;
    }
    .button-secondary {
      background-color: #7A9278;
    }
    .button:hover {
      opacity: 0.9;
    }
    .tips {
      background-color: #E8F5E9;
      border-left: 4px solid: #1C4D3A;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
    }
    .tips h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #1C4D3A;
    }
    .tips ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    .tips li {
      margin: 6px 0;
      font-size: 14px;
    }
    .footer {
      background-color: #F7F6F1;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #6B6760;
      border-top: 1px solid #E8E6DD;
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
      <h1>🎯 Interview Scheduled</h1>
    </div>

    <div class="content">
      <div class="greeting">
        Hi ${candidateName},
      </div>

      <p>
        Great news! Your interview with <strong>${organizationName}</strong> has been scheduled${assignmentTitle ? ` for the <strong>${assignmentTitle}</strong> opportunity` : ''}.
      </p>

      <div class="interview-details">
        <div class="detail-row">
          <div class="detail-label">📅 Date:</div>
          <div class="detail-value">${interviewDate}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">🕐 Time:</div>
          <div class="detail-value">${interviewTime}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">⏱️ Duration:</div>
          <div class="detail-value">${duration} minutes</div>
        </div>
        ${
          meetingLink
            ? `
        <div class="detail-row">
          <div class="detail-label">🔗 Meeting Link:</div>
          <div class="detail-value"><a href="${meetingLink}" style="color: #1C4D3A;">${meetingLink}</a></div>
        </div>
        `
            : ''
        }
      </div>

      <div style="text-align: center;">
        ${
          meetingLink
            ? `
        <a href="${meetingLink}" class="button">
          Join Video Call
        </a>
        `
            : ''
        }
        ${
          calendarInvite
            ? `
        <a href="${calendarInvite}" class="button button-secondary">
          Add to Calendar
        </a>
        `
            : ''
        }
      </div>

      <div class="tips">
        <h3>💡 Interview Tips:</h3>
        <ul>
          <li>Test your video and audio setup 5-10 minutes before the call</li>
          <li>Find a quiet, well-lit location for the interview</li>
          <li>Review your profile and the assignment details</li>
          <li>Prepare questions about the role and organization</li>
          <li>Be ready to discuss your relevant skills and experience</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #6B6760; margin-top: 30px;">
        Need to reschedule? Contact ${organizationName} as soon as possible through the Proofound messaging system.
      </p>
    </div>

    <div class="footer">
      <p>
        Sent by Proofound on behalf of ${organizationName}<br>
        <a href="https://proofound.com">proofound.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function InterviewScheduledEmailText({
  candidateName,
  organizationName,
  interviewDate,
  interviewTime,
  duration,
  meetingLink,
  assignmentTitle,
}: InterviewScheduledEmailProps) {
  return `
Interview Scheduled

Hi ${candidateName},

Great news! Your interview with ${organizationName} has been scheduled${assignmentTitle ? ` for the ${assignmentTitle} opportunity` : ''}.

Interview Details:
- Date: ${interviewDate}
- Time: ${interviewTime}
- Duration: ${duration} minutes
${meetingLink ? `- Meeting Link: ${meetingLink}` : ''}

Interview Tips:
- Test your video and audio setup 5-10 minutes before the call
- Find a quiet, well-lit location for the interview
- Review your profile and the assignment details
- Prepare questions about the role and organization
- Be ready to discuss your relevant skills and experience

Need to reschedule? Contact ${organizationName} as soon as possible through the Proofound messaging system.

---
Sent by Proofound on behalf of ${organizationName}
https://proofound.com
  `.trim();
}
