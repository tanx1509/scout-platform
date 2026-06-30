import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { google } from "googleapis";

// In a real application, you'd want to store and retrieve user-specific refresh tokens securely.
// For this prototype, we're using the provided environment variables if available.
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/auth/callback/google"
);

// Fallback logic for Demo Mode if credentials aren't set
const IS_DEMO = !process.env.GOOGLE_REFRESH_TOKEN || !process.env.GOOGLE_CLIENT_ID;

if (!IS_DEMO) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const { candidateIds, summary } = await req.json();

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ error: "Missing candidate IDs" }, { status: 400 });
    }

    const candidates = await prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      include: { matches: true }
    });

    const results = [];

    for (const candidate of candidates) {
      try {
        let meetLink = "https://meet.google.com/demo-meet-link";
        
        if (!IS_DEMO) {
          // Schedule a 45 min interview for tomorrow at 10 AM
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + 1);
          startDate.setHours(10, 0, 0, 0);
          
          const endDate = new Date(startDate);
          endDate.setMinutes(endDate.getMinutes() + 45);

          const event = {
            summary: `Technical Interview: ${candidate.name} (AI Engineer)`,
            description: `Automated scheduling.\nCandidate Profile: ${candidate.email}\nNote: ${summary || "Standard Technical Round"}`,
            start: {
              dateTime: startDate.toISOString(),
              timeZone: "America/Los_Angeles",
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: "America/Los_Angeles",
            },
            attendees: [
              { email: candidate.email },
            ],
            conferenceData: {
              createRequest: {
                requestId: `interview_${candidate.id}_${Date.now()}`,
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            },
          };

          const response = await calendar.events.insert({
            calendarId: "primary",
            conferenceDataVersion: 1,
            requestBody: event,
          });
          
          meetLink = response.data.hangoutLink || meetLink;

          // Fabricate HackerRank test link
          const testLink = `https://www.hackerrank.com/test/scout-ai-engineer-challenge/${candidate.id}`;
          
          // Format the dates
          const formatOptions: Intl.DateTimeFormatOptions = { 
            timeZone: 'Asia/Kolkata', 
            day: 'numeric', month: 'short', year: 'numeric', 
            hour: 'numeric', minute: '2-digit', hour12: true 
          };
          const startFormatted = startDate.toLocaleString('en-IN', formatOptions);
          const endFormatted = endDate.toLocaleString('en-IN', formatOptions);

          // Create the HTML Email Draft exactly like HackerEarth
          const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #fff; padding: 20px;">
  <p>Hello ${candidate.name},</p>
  <p>This is a reminder about <strong>Scout Hiring Challenge | AI Engineer Test</strong> for which you were invited by Scout.</p>

  <div style="background: #fdfdfd; border: 1px solid #f0f0f0; border-radius: 4px; padding: 20px; text-align: center; margin: 20px 0;">
    <p style="margin: 5px 0;">Test Duration: <strong>1 hrs 30 mins</strong></p>
    <p style="margin: 5px 0;">Start date: <strong>${startFormatted}</strong></p>
    <p style="margin: 5px 0;">End date: <strong>${endFormatted} IST (Asia/Kolkata)</strong></p>
    
    <a href="${testLink}" style="display: inline-block; background-color: #1a7b2b; color: white; padding: 10px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 15px 0;">Start test</a>
    
    <p style="margin: 5px 0; color: #666; font-size: 14px;">OR</p>
    <p style="margin: 5px 0; font-size: 14px;">Paste the given link into your browser's address bar</p>
    <a href="${testLink}" style="color: #1a0dab; word-break: break-all; font-size: 14px;">${testLink}</a>
  </div>

  <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Important</h3>
    <ul style="margin-bottom: 0; padding-left: 20px; font-size: 14px;">
      <li>You can take this test anytime between the start date/time and end date/time.</li>
      <li>Once the test starts, you cannot pause it. The test will run continuously for 1 hrs 30 mins.</li>
    </ul>
  </div>

  <h3 style="margin-top: 30px;">Google Meet Interview Details</h3>
  <p style="font-size: 14px;">Your unique Google Meeting Code: <a href="${meetLink}">${meetLink}</a></p>

  <h3 style="margin-top: 30px;">Before you begin</h3>
  <p style="font-size: 14px;">The practice test helps you to get familiar with the HackerRank platform and its proctoring settings. There is an automatic system-compatibility check in place before the test to check if your system is compatible for the test.</p>
  
  <a href="#" style="display: inline-block; color: #1a7b2b; border: 1px solid #1a7b2b; padding: 8px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; margin-top: 10px;">Begin practice test</a>

  <p style="margin-top: 40px; font-size: 14px;">Regards,<br/>Team Scout</p>
</div>
          `;

          try {
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            const subject = 'Reminder for Scout Hiring Challenge | AI Engineer Test';
            const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
            
            const messageParts = [
              `To: ${candidate.email}`,
              'Content-Type: text/html; charset=utf-8',
              'MIME-Version: 1.0',
              `Subject: ${utf8Subject}`,
              '',
              emailHtml
            ];
            
            const encodedMessage = Buffer.from(messageParts.join('\n'))
              .toString('base64')
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');
            
            // Create a draft in Gmail
            await gmail.users.drafts.create({
              userId: 'me',
              requestBody: {
                message: {
                  raw: encodedMessage
                }
              }
            });
          } catch (gmailError) {
            console.error("Failed to create Gmail draft. Ensure you have the 'https://www.googleapis.com/auth/gmail.compose' scope in your OAuth token.", gmailError);
          }
        }

        // Log Activity
        await prisma.agentActivity.create({
          data: {
            agentName: 'OutreachAgent',
            event: 'SCHEDULED_INTERVIEW',
            executionTimeMs: 1500,
            output: {
              status: 'SUCCESS',
              details: `Scheduled technical interview for ${candidate.name}${IS_DEMO ? ' (Demo Mode)' : ''}`,
              candidateId: candidate.id, 
              email: candidate.email, 
              meetLink,
              demo: IS_DEMO 
            }
          }
        });
        
        // Update job match status if it's currently ASSESSMENT or SCREENING
        if (candidate.matches && candidate.matches.length > 0) {
          const currentStatus = candidate.matches[0].status;
          if (['SCREENING', 'ASSESSMENT'].includes(currentStatus)) {
            await prisma.jobMatch.update({
              where: { id: candidate.matches[0].id },
              data: { status: 'INTERVIEW' }
            });
          }
        }
        
        results.push({ id: candidate.id, status: 'success', meetLink });
      } catch (error) {
        console.error(`Failed to schedule interview for ${candidate.email}:`, error);
        
        await prisma.agentActivity.create({
          data: {
            agentName: 'OutreachAgent',
            event: 'SCHEDULED_INTERVIEW',
            executionTimeMs: 1500,
            output: {
              status: 'FAILED',
              details: `Failed to schedule interview for ${candidate.email}`,
              candidateId: candidate.id, error: String(error)
            }
          }
        });
        
        results.push({ id: candidate.id, status: 'error', error: String(error) });
      }
    }

    return NextResponse.json({ 
      success: true, 
      scheduled: results.filter(r => r.status === 'success').length,
      demoMode: IS_DEMO,
      results 
    });
  } catch (error) {
    console.error("Schedule Outreach API Error:", error);
    return NextResponse.json({ error: "Failed to process scheduling" }, { status: 500 });
  }
}
