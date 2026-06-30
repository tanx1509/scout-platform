import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Tag, StickyNote, X, Loader2 } from "lucide-react";

export function NotesLabelsSidebar({ candidateId }: { candidateId: string }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [notesRes, labelsRes] = await Promise.all([
        fetch(`/api/candidates/${candidateId}/notes`),
        fetch(`/api/candidates/${candidateId}/labels`)
      ]);
      setNotes(await notesRes.json());
      setLabels(await labelsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes([note, ...notes]);
        setNewNote("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelName: newLabel.trim() }),
      });
      if (res.ok) {
        const label = await res.json();
        if (!labels.find(l => l.id === label.id)) {
          setLabels([...labels, label]);
        }
        setNewLabel("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}/labels?labelId=${labelId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLabels(labels.filter(l => l.id !== labelId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Labels
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {labels.map(l => (
              <Badge key={l.id} variant="secondary" className="flex items-center gap-1">
                {l.name}
                <X 
                  className="h-3 w-3 cursor-pointer opacity-50 hover:opacity-100" 
                  onClick={() => handleRemoveLabel(l.id)}
                />
              </Badge>
            ))}
            {labels.length === 0 && <span className="text-sm text-muted-foreground">No labels</span>}
          </div>
          <form className="flex gap-2" onSubmit={handleAddLabel}>
            <Input 
              size={1}
              placeholder="Add label..." 
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              disabled={submitting}
            />
            <Button size="icon" type="submit" variant="secondary" disabled={submitting || !newLabel.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            Recruiter Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <form className="space-y-2" onSubmit={handleAddNote}>
            <textarea
              className="w-full min-h-[80px] p-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Add a private note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              disabled={submitting}
            />
            <Button size="sm" type="submit" className="w-full" disabled={submitting || !newNote.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Note"}
            </Button>
          </form>
          <div className="space-y-3 pt-2">
            {notes.map(n => (
              <div key={n.id} className="bg-muted/50 p-3 rounded-md text-sm border">
                <p>{n.content}</p>
                <div className="text-[10px] text-muted-foreground mt-2 text-right">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
