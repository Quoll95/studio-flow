import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

interface TimePickerProps {
  ora: string;
  minuti: string;
  onOraChange: (v: string) => void;
  onMinutiChange: (v: string) => void;
  disabled?: boolean;
  label?: string;
}

export default function TimePicker({ ora, minuti, onOraChange, onMinutiChange, disabled = false, label }: TimePickerProps) {
  return (
    <div className="space-y-1">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <div className="flex gap-2">
        <Select value={ora} onValueChange={onOraChange} disabled={disabled}>
          <SelectTrigger className="h-9 flex-1"><SelectValue placeholder="Ore" /></SelectTrigger>
          <SelectContent>
            {HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={minuti} onValueChange={onMinutiChange} disabled={disabled}>
          <SelectTrigger className="h-9 flex-1"><SelectValue placeholder="Min" /></SelectTrigger>
          <SelectContent>
            {MINUTES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
