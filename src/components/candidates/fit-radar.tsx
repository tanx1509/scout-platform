import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

export function FitRadar({ scores }: { scores: Record<string, number> | undefined }) {
  if (!scores || Object.keys(scores).length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground border rounded-md border-dashed">
        Radar data unavailable
      </div>
    );
  }

  const data = Object.entries(scores).map(([subject, fullMark]) => ({
    subject,
    score: fullMark,
    fullMark: 100,
  }));

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e5e7eb" className="dark:stroke-neutral-800" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "currentColor", fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Candidate Fit"
            dataKey="score"
            stroke="#2563eb" // primary blue
            fill="#3b82f6"
            fillOpacity={0.4}
          />
          <Tooltip 
            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            itemStyle={{ color: "#2563eb", fontWeight: 600 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
