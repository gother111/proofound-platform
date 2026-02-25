export interface AuthEmailLayoutOptions {
  previewText: string;
  heading: string;
  intro: string;
  actionLabel?: string;
  actionUrl?: string;
  actionFallbackLabel?: string;
  secondaryText?: string;
  details?: Array<{ label: string; value: string }>;
  footerText: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderDetails(details: Array<{ label: string; value: string }>): string {
  if (details.length === 0) {
    return '';
  }

  const rows = details
    .map(
      (item) =>
        `<li style="margin-bottom:8px;"><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`
    )
    .join('');

  return `<ul style="padding-left:20px;margin:20px 0 16px;color:#2D3330;font-size:15px;line-height:1.6;">${rows}</ul>`;
}

export function renderAuthEmailHtml(options: AuthEmailLayoutOptions): string {
  const safePreview = escapeHtml(options.previewText);
  const safeHeading = escapeHtml(options.heading);
  const safeIntro = escapeHtml(options.intro);
  const safeSecondaryText = options.secondaryText ? escapeHtml(options.secondaryText) : '';
  const safeFooter = escapeHtml(options.footerText);
  const safeActionLabel = options.actionLabel ? escapeHtml(options.actionLabel) : '';
  const safeActionUrl = options.actionUrl ? escapeHtml(options.actionUrl) : '';
  const safeActionFallbackLabel = options.actionFallbackLabel
    ? escapeHtml(options.actionFallbackLabel)
    : 'Open this link';
  const detailsHtml = renderDetails(options.details ?? []);

  const actionHtml =
    safeActionLabel && safeActionUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;"><tr><td style="border-radius:8px;background:#1C4D3A;"><a href="${safeActionUrl}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#F7F6F1;text-decoration:none;border-radius:8px;">${safeActionLabel}</a></td></tr></table>
         <p style="margin:0 0 20px;color:#2D3330;font-size:14px;line-height:1.6;">${safeActionFallbackLabel}: <a href="${safeActionUrl}" style="color:#1C4D3A;text-decoration:underline;word-break:break-word;">${safeActionUrl}</a></p>`
      : '';

  const secondaryHtml = safeSecondaryText
    ? `<p style="margin:0 0 16px;color:#2D3330;font-size:15px;line-height:1.6;">${safeSecondaryText}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeHeading}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F7F6F1;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#2D3330;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F7F6F1;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2E2DA;border-radius:14px;padding:28px;">
            <tr>
              <td>
                <p style="margin:0 0 10px;color:#1C4D3A;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Proofound</p>
                <h1 style="margin:0 0 16px;color:#1C4D3A;font-family:'Crimson Pro',Georgia,serif;font-size:30px;line-height:1.2;font-weight:600;">${safeHeading}</h1>
                <p style="margin:0 0 16px;color:#2D3330;font-size:16px;line-height:1.65;">${safeIntro}</p>
                ${detailsHtml}
                ${actionHtml}
                ${secondaryHtml}
                <p style="margin:24px 0 0;color:#6B706B;font-size:13px;line-height:1.5;">${safeFooter}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderAuthEmailText(options: AuthEmailLayoutOptions): string {
  const parts: string[] = [];
  parts.push(`Proofound - ${options.heading}`);
  parts.push('');
  parts.push(options.intro);

  if ((options.details ?? []).length > 0) {
    parts.push('');
    for (const item of options.details ?? []) {
      parts.push(`${item.label}: ${item.value}`);
    }
  }

  if (options.actionLabel && options.actionUrl) {
    parts.push('');
    parts.push(`${options.actionLabel}: ${options.actionUrl}`);
  }

  if (options.secondaryText) {
    parts.push('');
    parts.push(options.secondaryText);
  }

  parts.push('');
  parts.push(options.footerText);

  return parts.join('\n');
}
