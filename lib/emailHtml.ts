// Email HTML builder — converts the Opus-generated body HTML into a
// table-based, inline-styled email that renders consistently across clients.

const STYLES: Record<string, string> = {
  p: "margin:0 0 18px 0; line-height:1.8; font-size:16px; color:#1a1e1c; font-family:Georgia,'Times New Roman',serif;",
  strong: "color:#1a1e1c; font-weight:700;",
  em: "color:#1a1e1c; font-style:italic;",
  ul: "margin:0 0 20px 0; padding:0 0 0 22px; font-size:16px; color:#1a1e1c; font-family:Georgia,'Times New Roman',serif;",
  ol: "margin:0 0 20px 0; padding:0 0 0 22px; font-size:16px; color:#1a1e1c; font-family:Georgia,'Times New Roman',serif;",
  li: "margin:0 0 10px 0; line-height:1.8; color:#1a1e1c; font-family:Georgia,'Times New Roman',serif;",
  h2: "margin:32px 0 12px 0; font-family:Georgia,'Times New Roman',serif; font-size:18px; font-weight:normal; color:#0F6E56; letter-spacing:0.01em; line-height:1.35;",
  h3: "margin:24px 0 10px 0; font-family:Georgia,'Times New Roman',serif; font-size:16px; font-weight:normal; color:#0a4e3d; line-height:1.4;",
  hr: "border:none; border-top:1px solid #c2dad0; margin:28px 0;",
  blockquote:
    "margin:0 0 20px 0; padding:12px 18px; border-left:3px solid #0F6E56; background:#f0f5f2; font-style:italic; color:#1a1e1c; font-family:Georgia,'Times New Roman',serif; line-height:1.75;",
};

function inlineStyleTag(html: string, tag: string): string {
  const style = STYLES[tag];
  if (!style) return html;
  // Only inject style when the tag doesn't already carry one.
  const withoutStyle = new RegExp(
    `<${tag}(\\b)(?![^>]*\\bstyle=)([^>]*)>`,
    "gi"
  );
  return html.replace(withoutStyle, `<${tag}$1$2 style="${style}">`);
}

function stripLeadingProse(html: string): string {
  const firstTag = html.indexOf("<");
  if (firstTag > 0) {
    const leading = html.slice(0, firstTag).trim();
    // If there's clearly prose before the first tag (more than a few chars of
    // explanatory text), drop it. Keep short whitespace.
    if (leading.length > 2) return html.slice(firstTag);
  }
  return html;
}

export function normalizeBodyHtml(raw: string): string {
  let html = (raw ?? "").trim();

  // Strip any leading meta-commentary the quality gate may have prepended.
  html = stripLeadingProse(html);

  // Defensive: convert any markdown that slipped through.
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(
    /(^|[\s>])\*([^*\n]+?)\*(?=[\s<.,!?;:]|$)/g,
    "$1<em>$2</em>"
  );
  // Unwanted markdown backticks around inline code — just strip them.
  html = html.replace(/`([^`\n]+)`/g, "$1");

  // Strip markdown headings like "### Heading" → <h3>Heading</h3>
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");

  // If there are no HTML tags at all, wrap paragraphs.
  if (!/<\w+/.test(html)) {
    html = html
      .split(/\n\s*\n/)
      .map((p) => `<p>${p.trim().replace(/\n/g, "<br/>")}</p>`)
      .join("\n");
  }

  // Remove any stray <html>/<body>/<head> wrappers the model might add.
  html = html.replace(/<\/?(html|body|head)[^>]*>/gi, "");

  // Inline styles on common tags.
  for (const tag of [
    "p",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "hr",
    "blockquote",
  ]) {
    html = inlineStyleTag(html, tag);
  }

  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildEmailShell({
  subject,
  bodyHtml,
  practitionerName = "Ashwin Kumar",
}: {
  subject: string;
  bodyHtml: string;
  practitionerName?: string;
}): string {
  const safeSubject = escapeHtml(subject || "A note from our session");
  const safeName = escapeHtml(practitionerName);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${safeSubject}</title>
</head>
<body style="margin:0; padding:0; background:#fbfaf7; font-family:Georgia,'Times New Roman',serif; color:#1a1e1c; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbfaf7;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#fbfaf7;">
          <tr>
            <td style="padding:0 0 20px 0; border-bottom:1px solid #c2dad0;">
              <span style="font-family:Georgia,'Times New Roman',serif; font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:#0F6E56;">The Hypnotherapy Briefcase</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 0 10px 0;">
              <h1 style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:28px; line-height:1.25; font-weight:normal; color:#1a1e1c;">${safeSubject}</h1>
            </td>
          </tr>
          <tr>
            <td style="font-family:Georgia,'Times New Roman',serif; font-size:16px; line-height:1.8; color:#1a1e1c; padding:18px 0 0 0;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:36px 0 0 0; border-top:1px solid #c2dad0;">
              <p style="margin:18px 0 6px 0; font-family:Georgia,'Times New Roman',serif; font-size:14px; color:#3d4240;">Your data is private and encrypted.</p>
              <p style="margin:0; font-family:Georgia,'Times New Roman',serif; font-size:14px; color:#3d4240; font-style:italic;">— ${safeName}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|li|h\d|ul|ol|blockquote|div)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<hr[^>]*\/?>/gi, "\n\n———\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
