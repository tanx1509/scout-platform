import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Bot, FileCheck, Calendar, Mail, AlertTriangle, PlayCircle, Clock, Wrench, Database, FileText, GitBranch, UserCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export function ActivityFeed({ activities }: { activities: any[] }) {
  const getIcon = (agentName: string) => {
    switch (agentName) {
      case "AssessmentAgent": return <FileCheck className="h-4 w-4" />;
      case "InterviewAgent": return <Calendar className="h-4 w-4" />;
      case "OutreachAgent": return <Mail className="h-4 w-4" />;
      case "ScreeningAgent": return <FileText className="h-4 w-4" />;
      case "GitHubAgent": return <GitBranch className="h-4 w-4" />;
      default: return <UserCheck className="h-4 w-4" />;
    }
  };

  const getMeaningfulEvent = (act: any) => {
    if (act.agentName === "ScreeningAgent") return "Resume parsed and candidate profile extracted.";
    if (act.agentName === "AssessmentAgent") return "Assessment results imported successfully.";
    if (act.agentName === "InterviewAgent") return "Interview scheduled with candidate.";
    if (act.agentName === "OutreachAgent") return "Outreach email sent to candidate.";
    if (act.event.toLowerCase().includes("github")) return "GitHub profile analysed.";
    return "Candidate match quality recalculated.";
  };

  const getEventTitle = (act: any) => {
    if (act.agentName === "ScreeningAgent") return "Resume Parsed";
    if (act.agentName === "AssessmentAgent") return "Assessment Imported";
    if (act.agentName === "InterviewAgent") return "Interview Scheduled";
    if (act.agentName === "OutreachAgent") return "Candidate Contacted";
    if (act.event.toLowerCase().includes("github")) return "GitHub Analysed";
    return "Candidate Shortlisted";
  };

  return (
    <Card className="shadow-sm border-border/50 h-full">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No recent activity recorded.</p>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
            {activities.map((act, index) => (
              <motion.div 
                key={act.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full border border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {getIcon(act.agentName)}
                </div>
                
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">{getEventTitle(act)}</span>
                    <span className="text-xs text-muted-foreground font-mono">{format(new Date(act.timestamp), 'HH:mm')}</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {getMeaningfulEvent(act)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
