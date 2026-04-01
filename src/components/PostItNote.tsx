import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostItNoteProps {
  id: string;
  testo: string;
  colore: string;
  timestamp?: string;
  onUpdate: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
}

export default function PostItNote({ id, testo, colore, timestamp, onUpdate, onDelete }: PostItNoteProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(testo);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editing]);

  const save = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== testo) {
      onUpdate(id, trimmed);
    } else {
      setEditText(testo);
    }
    setEditing(false);
  };

  return (
    <div
      className="relative rounded-lg p-3 shadow-sm group min-h-[60px] cursor-pointer break-words overflow-hidden"
      style={{ backgroundColor: colore }}
      onClick={() => { if (!editing) { setEditText(testo); setEditing(true); } }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 no-print z-10"
        onClick={e => { e.stopPropagation(); onDelete(id); }}
      >
        <Trash2 className="h-3 w-3 text-foreground/60 hover:text-destructive" />
      </Button>
      {editing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === "Escape") { setEditText(testo); setEditing(false); } }}
          onClick={e => e.stopPropagation()}
          className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground/80 p-0 min-h-[40px]"
          style={{ fontFamily: "inherit" }}
        />
      ) : (
        <>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words overflow-wrap-anywhere pr-6">{testo}</p>
          {timestamp && <p className="text-[10px] text-foreground/50 mt-1">{timestamp}</p>}
        </>
      )}
    </div>
  );
}
