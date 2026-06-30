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
