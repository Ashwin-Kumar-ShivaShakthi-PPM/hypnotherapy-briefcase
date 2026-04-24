// Welcome + episode-welcome email template builders.
// Pure strings — no markdown, HTML only, matches Ashwin's voice.

import { buildEmailShell, htmlToPlainText } from "./emailHtml";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(fullName: string): string {
  const first = (fullName || "").trim().split(/\s+/)[0];
  return first || "there";
}

function bodyStyles() {
  return {
    p: 'style="margin:0 0 18px 0; line-height:1.8; font-size:16px; color:#1a1e1c; font-family:Georgia,\'Times New Roman\',serif;"',
    h2: 'style="margin:32px 0 12px 0; font-family:Georgia,\'Times New Roman\',serif; font-size:18px; font-weight:normal; color:#0F6E56; letter-spacing:0.01em; line-height:1.35;"',
    strong: 'style="color:#1a1e1c; font-weight:700;"',
    a: 'style="color:#0F6E56; text-decoration:underline;"',
    invitebox:
      'style="margin:18px 0 28px 0; padding:14px 18px; background:#f0f5f2; border-left:3px solid #0F6E56; font-family:Georgia,\'Times New Roman\',serif;"',
  };
}

export type WelcomeEmail = {
  subject: string;
  html: string;
  text: string;
};

export function renderNewClientWelcome(params: {
  clientName: string;
  episodeTitle: string;
  presentingIssue: string;
  inviteCode: string;
  intakeUrl: string;
  practitionerName?: string;
}): WelcomeEmail {
  const s = bodyStyles();
  const fname = escapeHtml(firstName(params.clientName));
  const episodeTitle = escapeHtml(params.episodeTitle);
  const presenting = escapeHtml(params.presentingIssue);
  const inviteCode = escapeHtml(params.inviteCode);
  const intakeUrl = escapeHtml(params.intakeUrl);
  const practitionerName = params.practitionerName || "Ashwin Kumar";

  const subject = "Welcome — your hypnotherapy journey begins here";

  const bodyHtml = `
<p ${s.p}>Welcome, ${fname}.</p>

<p ${s.p}>You've been invited into a quiet space for meaningful work. Before our first session together, there's a small step that helps us begin well.</p>

<h2 ${s.h2}>What we'll be focused on</h2>

<p ${s.p}><strong ${s.strong}>${episodeTitle}</strong></p>

<p ${s.p}>${presenting}</p>

<h2 ${s.h2}>Your intake form</h2>

<p ${s.p}>The form takes about five minutes. What you share helps us arrive prepared, so our first hour together can belong entirely to you.</p>

<div ${s.invitebox}>
  <p style="margin:0 0 10px 0; line-height:1.6; font-size:15px; color:#1a1e1c; font-family:Georgia,'Times New Roman',serif;"><strong ${s.strong}>Your intake link:</strong><br/>
  <a href="${intakeUrl}" ${s.a}>${intakeUrl}</a></p>
  <p style="margin:10px 0 0 0; line-height:1.6; font-size:15px; color:#1a1e1c; font-family:Georgia,'Times New Roman',serif;"><strong ${s.strong}>Your invite code:</strong> <span style="letter-spacing:0.12em; font-family:Georgia,serif;">${inviteCode}</span></p>
</div>

<p ${s.p}>Keep that code somewhere safe — it gives you access to your own portal once we begin.</p>

<p ${s.p}>You're in good hands. We'll see you soon.</p>
`;

  const html = buildEmailShell({
    subject,
    bodyHtml,
    practitionerName,
  });

  return {
    subject,
    html,
    text: htmlToPlainText(bodyHtml),
  };
}

export function renderEpisodeWelcome(params: {
  clientName: string;
  episodeTitle: string;
  presentingIssue: string;
  inviteCode: string;
  intakeUrl: string;
  practitionerName?: string;
}): WelcomeEmail {
  const s = bodyStyles();
  const fname = escapeHtml(firstName(params.clientName));
  const episodeTitle = escapeHtml(params.episodeTitle);
  const presenting = escapeHtml(params.presentingIssue);
  const inviteCode = escapeHtml(params.inviteCode);
  const intakeUrl = escapeHtml(params.intakeUrl);
  const practitionerName = params.practitionerName || "Ashwin Kumar";

  const subject = `A new chapter — your intake for ${params.episodeTitle}`;

  const bodyHtml = `
<p ${s.p}>Welcome back, ${fname}.</p>

<p ${s.p}>Returning for more work together always carries weight. It means you're still curious, still willing. That is not small.</p>

<h2 ${s.h2}>A new chapter</h2>

<p ${s.p}><strong ${s.strong}>${episodeTitle}</strong></p>

<p ${s.p}>${presenting}</p>

<h2 ${s.h2}>Before our first session of this chapter</h2>

<p ${s.p}>A fresh intake helps us begin this chapter grounded in where you are right now. It takes about five minutes and only asks what's useful for us to know.</p>

<div ${s.invitebox}>
  <p style="margin:0 0 10px 0; line-height:1.6; font-size:15px; color:#1a1e1c; font-family:Georgia,'Times New Roman',serif;"><strong ${s.strong}>Your intake link for this chapter:</strong><br/>
  <a href="${intakeUrl}" ${s.a}>${intakeUrl}</a></p>
  <p style="margin:10px 0 0 0; line-height:1.6; font-size:15px; color:#1a1e1c; font-family:Georgia,'Times New Roman',serif;"><strong ${s.strong}>Your invite code:</strong> <span style="letter-spacing:0.12em; font-family:Georgia,serif;">${inviteCode}</span></p>
</div>

<p ${s.p}>Same portal as before — the code is just a quick way back in if you need it.</p>

<p ${s.p}>Looking forward to what we'll uncover together in this next chapter.</p>
`;

  const html = buildEmailShell({
    subject,
    bodyHtml,
    practitionerName,
  });

  return {
    subject,
    html,
    text: htmlToPlainText(bodyHtml),
  };
}
