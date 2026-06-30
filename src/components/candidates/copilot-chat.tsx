import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CopilotChat({ candidateId, jobId }: { candidateId: string; jobId?: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hi! I'm your AI Recruiter Copilot. Ask me anything about this candidate's fit, risks, or interview questions." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const QUICK_ACTIONS = [
    "Summarize Candidate",
    "Compare with JD",
    "Hiring Risks",
    "Interview Questions",
    "Strengths",
    "Missing Skills",
    "Similar Candidates"
  ];

  const handleSend = async (overrideMsg?: string) => {
    const userMsg = overrideMsg || input.trim();
    if (!userMsg) return;
    
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/candidates/${candidateId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg, jobId }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I encountered an error analyzing the candidate." }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I couldn't connect to the AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[550px] border-primary/20 shadow-md">
      <CardHeader className="bg-muted/30 pb-3 border-b">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Recruiter Copilot
        </CardTitle>
      </CardHeader>
      
      <div className="px-4 pt-3 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(action => (
          <Badge 
            key={action} 
            variant="outline" 
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => handleSend(action)}
          >
            {action}
          </Badge>
        ))}
      </div>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            )}
            <div className={`p-3 rounded-lg text-sm max-w-[85%] whitespace-pre-wrap ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted leading-relaxed"
            }`}>
              {m.role === "ai" ? (
                m.content.split('\n').map((line, i) => {
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  const formattedLine = parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  });

                  if (line.trim().startsWith('- ')) {
                    return (
                      <li key={i} className="ml-4 list-disc marker:text-primary/50 mb-1">
                        {formattedLine.map((f, k) => typeof f === 'string' && k === 0 ? f.replace(/^\s*- /, '') : f)}
                      </li>
                    );
                  }
                  
                  if (line.trim() === '') return <br key={i} />;

                  return <span key={i} className="block mb-1.5 last:mb-0">{formattedLine}</span>;
                })
              ) : (
                m.content
              )}
            </div>
            {m.role === "user" && (
              <div className="h-8 w-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="p-3 rounded-lg text-sm bg-muted flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 pt-0 border-t bg-muted/10">
        <form
          className="flex w-full gap-2 mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input 
            placeholder="Type a message or select a quick action..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || (!input.trim() && messages.length === 1)}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
