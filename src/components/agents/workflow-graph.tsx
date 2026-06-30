import { CheckCircle2, CircleDashed, ArrowRight } from "lucide-react";

export function WorkflowGraph({ status }: { status: string }) {
  const steps = [
    { key: "APPLIED", label: "Applied" },
    { key: "SCREENING", label: "Screening Agent" },
    { key: "ASSESSMENT", label: "Assessment Agent" },
    { key: "INTERVIEW", label: "Interview Agent" },
    { key: "OFFER", label: "Offer Extended" },
    { key: "HIRED", label: "Hired" }
  ];

  const currentIndex = steps.findIndex(s => s.key === status);
  // If status not found or unknown, default to APPLIED (0)
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="w-full py-4 overflow-x-auto">
      <div className="flex items-center min-w-max px-2">
        {steps.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isCompleted 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : "bg-background text-muted-foreground border-muted"
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <CircleDashed className="h-5 w-5" />}
                </div>
                <span className={`text-xs font-semibold ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              
              {!isLast && (
                <div className="w-16 sm:w-24 px-2 -mt-6">
                  <div className={`h-1 w-full rounded ${
                    index < activeIndex ? "bg-primary" : "bg-muted"
                  }`}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
