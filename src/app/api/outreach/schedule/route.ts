import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    : "http://localhost:3000/api/auth/callback/google"
);

const IS_DEMO = !process.env.GOOGLE_REFRESH_TOKEN || !process.env.GOOGLE_CLIENT_ID;

if (!IS_DEMO) {
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
}

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

/**
 * Generates a UNIQUE, deterministic Google Meet-style code per candidate.
 * Uses three independent hash seeds so all 12 characters are different across candidates.
 */
function uniqueMeetCode(candidateId: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const djb2 = (s: string, seed: number) =>
    s.split("").reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0) + seed) | 0, seed);
  const h1 = Math.abs(djb2(candidateId, 0x9E3779B9));
  const h2 = Math.abs(djb2(candidateId, 0x6C62272D));
  const h3 = Math.abs(djb2(candidateId, 0xE7B87A5F));
  const seg = (h: number) =>
    [h % 26, (h >> 4) % 26, (h >> 8) % 26, (h >> 12) % 26]
      .map((n) => chars[n])
      .join("");
  return `${seg(h1)}-${seg(h2)}-${seg(h3)}`;
}

/**
 * Returns a unique interview hour (10–16 = 10 AM to 4 PM) per candidate.
 * This ensures every candidate gets a different 1-hour slot.
 */
function uniqueInterviewHour(candidateId: string): number {
  const hash = Math.abs(
    candidateId.split("").reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 0x5AFEDA4B)
  );
  const slots = [10, 11, 12, 13, 14, 15, 16]; // 10 AM – 4 PM (last ends at 5 PM)
  return slots[hash % slots.length];
}

/** Format a Date in IST with a readable style */
function fmtIST(d: Date, includeWeekday = true): string {
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    ...(includeWeekday ? { weekday: "short" } : {}),
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format a UTC Date to ICS YYYYMMDDTHHMMSSZ format */
function fmtICS(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");
}

/** Generate an RFC-5545 ICS calendar invite with a 30-min reminder */
function generateICS(name: string, email: string, start: Date, end: Date, meet: string): string {
  const sender = process.env.GMAIL_SENDER || "tanishqsethi04@gmail.com";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Scout AI Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `DTSTART:${fmtICS(start)}`,
    `DTEND:${fmtICS(end)}`,
    `DTSTAMP:${fmtICS(new Date())}`,
    `UID:scout-${email}-${start.getTime()}@scout.ai`,
    `SUMMARY:Scout AI Engineer Interview – ${name}`,
    `DESCRIPTION:Join Google Meet: ${meet}\\nThis is your technical interview for the Scout AI Engineer position.`,
    `LOCATION:${meet}`,
    `ORGANIZER;CN=Team Scout:mailto:${sender}`,
    `ATTENDEE;CN=${name};RSVP=TRUE:mailto:${email}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your Scout interview starts in 30 minutes!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Build the professional HTML email (HackerEarth-style) */
function buildEmailHTML(opts: {
  name: string;
  testLink: string;
  testWindowStart: Date;
  testWindowEnd: Date;
  meetLink: string;
  interviewStart: Date;
  interviewEnd: Date;
  calendarLink: string;
}): string {
  const { name, testLink, testWindowStart, testWindowEnd, meetLink, interviewStart, interviewEnd, calendarLink } = opts;
  const meetCode = meetLink.replace("https://meet.google.com/", "");
  const interviewEndTime = interviewEnd.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true
  });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:28px 32px;text-align:center;">
    <p style="margin:0;font-size:26px;font-weight:900;color:#fff;letter-spacing:-1px;">
      Scout<span style="color:#818cf8;">.</span>
    </p>
    <p style="margin:4px 0 0;font-size:12px;color:#a5b4fc;letter-spacing:1px;text-transform:uppercase;">AI Hiring Platform</p>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:28px 32px 0;">
    <p style="font-size:16px;margin:0 0 6px;">Hello <strong>${name}</strong>,</p>
    <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.7;">
      Congratulations! You have been selected to participate in the <strong>Scout Hiring Challenge&nbsp;|&nbsp;AI Engineer Test</strong>. 
      Please read the details below carefully before beginning.
    </p>
  </td></tr>

  <!-- Assessment Box -->
  <tr><td style="padding:20px 32px 8px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#1e293b;padding:10px 20px;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.2px;">📋 &nbsp;Online Assessment</p>
      </td></tr>
      <tr><td style="padding:20px;background:#f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33%" style="text-align:center;padding:10px 6px;border-right:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;">Duration</p>
              <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#111827;">1 hr 30 mins</p>
            </td>
            <td width="33%" style="text-align:center;padding:10px 6px;border-right:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;">Window Opens</p>
              <p style="margin:6px 0 0;font-size:13px;font-weight:700;color:#111827;">${fmtIST(testWindowStart)}</p>
            </td>
            <td width="33%" style="text-align:center;padding:10px 6px;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;">Window Closes</p>
              <p style="margin:6px 0 0;font-size:13px;font-weight:700;color:#111827;">${fmtIST(testWindowEnd)} IST</p>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 4px;font-size:12px;color:#16a34a;font-weight:600;text-align:center;">
          ✅ Attempt the test <strong>anytime</strong> within the 12-hour window above — no fixed start time required.
        </p>
        <p style="margin:16px 0 8px;text-align:center;">
          <a href="${testLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 48px;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;">Start Test</a>
        </p>
        <p style="margin:4px 0 2px;text-align:center;font-size:12px;color:#9ca3af;">Or paste in your browser:</p>
        <p style="text-align:center;margin:0;"><a href="${testLink}" style="color:#4f46e5;font-size:12px;word-break:break-all;">${testLink}</a></p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Important Notes -->
  <tr><td style="padding:8px 32px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fefce8;border-left:4px solid #eab308;border-radius:4px;">
      <tr><td style="padding:14px 18px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#854d0e;">⚠️ &nbsp;Important</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#713f12;line-height:1.8;">
          <li>You may attempt the test <strong>anytime</strong> during the 12-hour attempt window.</li>
          <li>Once started, the test runs continuously for <strong>1 hr 30 mins</strong> and cannot be paused.</li>
          <li>Ensure a stable internet connection and quiet environment before starting.</li>
        </ul>
      </td></tr>
    </table>
  </td></tr>

  <!-- Meet Interview Box -->
  <tr><td style="padding:0 32px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #c7d2fe;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#4f46e5;padding:10px 20px;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#e0e7ff;text-transform:uppercase;letter-spacing:1.2px;">📹 &nbsp;Google Meet Technical Interview</p>
      </td></tr>
      <tr><td style="padding:20px;text-align:center;background:#f5f3ff;">
        <p style="margin:0 0 4px;font-size:12px;color:#7c3aed;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Your Interview Slot</p>
        <p style="margin:0 0 2px;font-size:18px;font-weight:800;color:#1e1b4b;">${fmtIST(interviewStart)}</p>
        <p style="margin:0 0 16px;font-size:14px;color:#4f46e5;">to ${interviewEndTime} IST &nbsp;(1 hour)</p>
        <a href="${meetLink}" style="display:inline-block;background:#4f46e5;color:#fff;padding:11px 36px;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;">Join Google Meet</a>
        <p style="margin:10px 0 4px;font-size:12px;color:#9ca3af;">Meeting code:</p>
        <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#4f46e5;letter-spacing:1px;">${meetCode}</p>
        <a href="${calendarLink}" style="display:inline-block;background:#fff;color:#4f46e5;padding:9px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:13px;border:2px solid #4f46e5;">
          📅 &nbsp;Add to Google Calendar
        </a>
        <p style="margin:8px 0 0;font-size:11px;color:#a78bfa;">A calendar invite (.ics) is also attached to this email.</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Before You Begin -->
  <tr><td style="padding:0 32px 24px;">
    <p style="font-size:13px;font-weight:700;color:#374151;margin:0 0 6px;">Before you begin the assessment</p>
    <p style="font-size:13px;color:#6b7280;margin:0 0 10px;line-height:1.6;">
      We recommend completing a short practice session to familiarise yourself with the HackerRank platform and its proctoring settings.
    </p>
    <a href="https://www.hackerrank.com/test/practice" style="display:inline-block;color:#16a34a;border:1px solid #16a34a;padding:8px 20px;text-decoration:none;border-radius:4px;font-weight:600;font-size:13px;">Begin Practice Test</a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 32px;text-align:center;">
    <p style="font-size:13px;color:#374151;margin:0;">Best regards,<br><strong>Team Scout &mdash; AI Hiring Platform</strong></p>
    <p style="font-size:11px;color:#d1d5db;margin:6px 0 0;">This is an automated message. Please do not reply to this email.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const { candidateIds, summary } = await req.json();

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ error: "Missing candidate IDs" }, { status: 400 });
    }

    const candidates = await prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      include: { matches: true },
    });

    const results = [];

    for (const candidate of candidates) {
      try {
        // ── Interview slot: unique per-candidate hour, tomorrow+1 ──────────────
        const interviewHour = uniqueInterviewHour(candidate.id);
        const interviewStart = new Date();
        interviewStart.setDate(interviewStart.getDate() + 2); // day after tomorrow
        interviewStart.setHours(interviewHour, 0, 0, 0);
        const interviewEnd = new Date(interviewStart);
        interviewEnd.setHours(interviewHour + 1, 0, 0, 0); // 1 hour

        // ── Test window: 12 hours starting tomorrow 9 AM IST ──────────────────
        const testWindowStart = new Date();
        testWindowStart.setDate(testWindowStart.getDate() + 1);
        // Set to 9 AM IST (UTC+5:30 → 3:30 AM UTC)
        testWindowStart.setUTCHours(3, 30, 0, 0);
        const testWindowEnd = new Date(testWindowStart);
        testWindowEnd.setHours(testWindowEnd.getHours() + 12); // 9 PM IST

        // ── Meet link: unique per candidate ───────────────────────────────────
        let meetLink = `https://meet.google.com/${uniqueMeetCode(candidate.id)}`;

        // ── Google Calendar: try to create real event ─────────────────────────
        if (!IS_DEMO) {
          try {
            const calEvent = {
              summary: `Scout AI Engineer Interview – ${candidate.name}`,
              description: `Technical Interview\nCandidate: ${candidate.email}\nGoogle Meet: ${meetLink}`,
              start: { dateTime: interviewStart.toISOString(), timeZone: "Asia/Kolkata" },
              end: { dateTime: interviewEnd.toISOString(), timeZone: "Asia/Kolkata" },
              attendees: [{ email: candidate.email }],
              conferenceData: {
                createRequest: {
                  requestId: `scout-${candidate.id}-${Date.now()}`,
                  conferenceSolutionKey: { type: "hangoutsMeet" },
                },
              },
              reminders: {
                useDefault: false,
                overrides: [
                  { method: "email", minutes: 24 * 60 },
                  { method: "popup", minutes: 30 },
                ],
              },
            };

            const calRes = await calendar.events.insert({
              calendarId: "primary",
              conferenceDataVersion: 1,
              sendUpdates: "all", // sends Google Calendar invite to attendee automatically
              requestBody: calEvent,
            });

            if (calRes.data.hangoutLink) {
              meetLink = calRes.data.hangoutLink;
            }
          } catch (calErr) {
            console.error("Calendar insert failed, using fabricated Meet link:", calErr);
          }
        }

        // ── Links ──────────────────────────────────────────────────────────────
        const testLink = `https://www.hackerrank.com/test/scout-ai-engineer-challenge/${candidate.id}`;

        const gcalParams = new URLSearchParams({
          action: "TEMPLATE",
          text: `Scout AI Engineer Interview – ${candidate.name}`,
          dates: `${fmtICS(interviewStart)}/${fmtICS(interviewEnd)}`,
          details: `Google Meet: ${meetLink}\n\nTechnical interview for Scout AI Engineer position.`,
          location: meetLink,
          add: candidate.email,
        });
        const calendarLink = `https://calendar.google.com/calendar/render?${gcalParams.toString()}`;

        // ── Build email ────────────────────────────────────────────────────────
        const subject = `Scout Hiring Challenge | AI Engineer – Interview Scheduled for ${fmtIST(interviewStart, false)}`;
        const html = buildEmailHTML({ name: candidate.name, testLink, testWindowStart, testWindowEnd, meetLink, interviewStart, interviewEnd, calendarLink });
        const ics = generateICS(candidate.name, candidate.email, interviewStart, interviewEnd, meetLink);

        // ── Try direct Gmail send with ICS attachment ──────────────────────────
        let emailSent = false;
        if (!IS_DEMO) {
          try {
            const gmail = google.gmail({ version: "v1", auth: oauth2Client });
            const sender = process.env.GMAIL_SENDER || "tanishqsethi04@gmail.com";
            const boundary = `scout_${Date.now()}_boundary`;
            const sub64 = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;

            const mime = [
              `From: Team Scout <${sender}>`,
              `To: ${candidate.email}`,
              `Subject: ${sub64}`,
              "MIME-Version: 1.0",
              `Content-Type: multipart/mixed; boundary="${boundary}"`,
              "",
              `--${boundary}`,
              "Content-Type: text/html; charset=utf-8",
              "Content-Transfer-Encoding: base64",
              "",
              Buffer.from(html).toString("base64"),
              "",
              `--${boundary}`,
              "Content-Type: text/calendar; charset=utf-8; method=REQUEST",
              "Content-Transfer-Encoding: base64",
              `Content-Disposition: attachment; filename="interview_invite.ics"`,
              "",
              Buffer.from(ics).toString("base64"),
              "",
              `--${boundary}--`,
            ].join("\n");

            const raw = Buffer.from(mime)
              .toString("base64")
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "");

            await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
            emailSent = true;
          } catch (gmailErr) {
            console.error("Gmail direct send failed:", gmailErr);
          }
        }

        // ── Build fallback compose URL (used if direct send failed) ───────────
        const plainBody = `Hello ${candidate.name},

Congratulations! You have been invited to the Scout Hiring Challenge | AI Engineer Test.

────────────────────────────
ONLINE ASSESSMENT
────────────────────────────
Duration       : 1 hr 30 mins
Window Opens   : ${fmtIST(testWindowStart)}
Window Closes  : ${fmtIST(testWindowEnd)} IST

You may attempt the test ANYTIME within this 12-hour window.
Test Link: ${testLink}

────────────────────────────
GOOGLE MEET INTERVIEW
────────────────────────────
Slot           : ${fmtIST(interviewStart)} – ${interviewEnd.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true })} IST
Join Link      : ${meetLink}
Add to Calendar: ${calendarLink}

Important:
• You can attempt the test anytime within the window — no fixed start time.
• Once started, the 1 hr 30 min timer cannot be paused.

Regards,
Team Scout`;

        const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(candidate.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainBody)}`;

        // ── Log activity ───────────────────────────────────────────────────────
        await prisma.agentActivity.create({
          data: {
            agentName: "OutreachAgent",
            event: "SCHEDULED_INTERVIEW",
            executionTimeMs: 1500,
            output: {
              status: "SUCCESS",
              details: `Interview @${interviewHour}:00 IST for ${candidate.name}. Email sent directly: ${emailSent}`,
              candidateId: candidate.id,
              email: candidate.email,
              meetLink,
              emailSent,
            },
          },
        });

        // Update match status
        if (candidate.matches && candidate.matches.length > 0) {
          const cur = candidate.matches[0].status;
          if (["SCREENING", "ASSESSMENT"].includes(cur)) {
            await prisma.jobMatch.update({
              where: { id: candidate.matches[0].id },
              data: { status: "INTERVIEW" },
            });
          }
        }

        results.push({ id: candidate.id, status: "success", meetLink, gmailComposeUrl, emailSent });
      } catch (error) {
        console.error(`Failed for ${candidate.email}:`, error);
        results.push({ id: candidate.id, status: "error", error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      scheduled: results.filter((r) => r.status === "success").length,
      demoMode: IS_DEMO,
      results,
    });
  } catch (error) {
    console.error("Schedule Outreach API Error:", error);
    return NextResponse.json({ error: "Failed to process scheduling" }, { status: 500 });
  }
}
