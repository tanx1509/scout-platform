import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');
const IS_DEMO = !process.env.RESEND_API_KEY;

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const { candidateIds } = await req.json();

    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ error: "Missing candidate IDs" }, { status: 400 });
    }

    const candidates = await prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      include: { matches: true }
    });

    const results = [];

    for (const candidate of candidates) {
      // Create a test link
      const testUrl = `https://scout.example.com/assessment/${candidate.id}?t=${Date.now()}`;
      
      try {
        if (!IS_DEMO) {
          await resend.emails.send({
            from: 'Scout Recruiting <talent@scout.example.com>',
            to: candidate.email,
            subject: 'Invitation: Technical Assessment - AI Engineer Role',
            html: `
              <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
                <h2>Hello ${candidate.name.split(' ')[0]},</h2>
                <p>Thank you for applying to the AI Engineer position. We were impressed by your background and would like to invite you to complete a short technical assessment.</p>
                <p>The assessment consists of:</p>
                <ul>
                  <li>Logical Reasoning (15 mins)</li>
                  <li>Coding Challenge (45 mins)</li>
                </ul>
                <div style="margin: 30px 0;">
                  <a href="${testUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Assessment</a>
                </div>
                <p>Please complete this within the next 48 hours.</p>
                <p>Best regards,<br>The Recruiting Team</p>
              </div>
            `
          });
        }
        
        // Log the activity
        await prisma.agentActivity.create({
          data: {
            agentName: 'OutreachAgent',
            event: 'SENT_TEST_LINK',
            executionTimeMs: 1000,
            output: {
              status: 'SUCCESS',
              details: `Sent technical assessment link to ${candidate.email}${IS_DEMO ? ' (Demo Mode)' : ''}`,
              candidateId: candidate.id, email: candidate.email, demo: IS_DEMO 
            }
          }
        });
        
        // Update job match status if it's currently SCREENING
        if (candidate.matches && candidate.matches.length > 0 && candidate.matches[0].status === 'SCREENING') {
          await prisma.jobMatch.update({
            where: { id: candidate.matches[0].id },
            data: { status: 'ASSESSMENT' }
          });
        }
        
        results.push({ id: candidate.id, status: 'success' });
      } catch (error) {
        console.error(`Failed to send email to ${candidate.email}:`, error);
        
        await prisma.agentActivity.create({
          data: {
            agentName: 'OutreachAgent',
            event: 'SENT_TEST_LINK',
            executionTimeMs: 1000,
            output: {
              status: 'FAILED',
              details: `Failed to send assessment link to ${candidate.email}`,
              candidateId: candidate.id, error: String(error)
            }
          }
        });
        
        results.push({ id: candidate.id, status: 'error', error: String(error) });
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent: results.filter(r => r.status === 'success').length,
      demoMode: IS_DEMO,
      results 
    });
  } catch (error) {
    console.error("Test Outreach API Error:", error);
    return NextResponse.json({ error: "Failed to process test outreach" }, { status: 500 });
  }
}
