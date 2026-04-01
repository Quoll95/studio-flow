import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { validatePdfSize } from "@/lib/file-compression";
import { FileText, Upload, Trash2, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

type FilePratica = {
  id: string;
  nome_file: string;
  storage_path: string;
  mime_type: string | null;
  dimensione: number | null;
  created_at: string;
};

export default function PraticaDocumenti({ praticaId, files, onUpdate }: {
  praticaId: string;
  files: FilePratica[];
  onUpdate: () => void;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non autenticato");

      for (const file of Array.from(selectedFiles)) {
        // Controllo dimensione PDF
        const pdfCheck = validatePdfSize(file);
        if (!pdfCheck.valid) {
          toast({ title: "File troppo grande", description: pdfCheck.message, variant: "destructive" });
          continue;
        }
        const path = `${user.id}/${praticaId}/documenti/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("pratica-files")
          .upload(path, file);
        if (uploadError) throw uploadError;

        await supabase.from("file_pratica").insert({
          id_pratica: praticaId,
          user_id: user.id,
          nome_file: file.name,
          tipo: "documento",
          mime_type: file.type,
          dimensione: file.size,
          storage_path: path,
        });
      }
      toast({ title: "Documenti caricati" });
      onUpdate();
    } catch (err: any) {
      toast({ title: "Errore upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpen = async (file: FilePratica) => {
    const { data } = await supabase.storage
      .from("pratica-files")
      .createSignedUrl(file.storage_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (file: FilePratica) => {
    if (!confirm(`Eliminare "${file.nome_file}"?`)) return;
    await supabase.storage.from("pratica-files").remove([file.storage_path]);
    await supabase.from("file_pratica").delete().eq("id", file.id);
    toast({ title: "Documento eliminato" });
    onUpdate();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" /> Documenti
        </CardTitle>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            {uploading ? "Caricamento..." : "Carica"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nessun documento caricato</p>
        ) : (
          <div className="space-y-1">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group cursor-pointer"
                onClick={() => handleOpen(file)}
              >
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.nome_file}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(file.created_at), "dd MMM yyyy", { locale: it })}
                    {file.dimensione ? ` · ${formatSize(file.dimensione)}` : ""}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleOpen(file); }}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(file); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
