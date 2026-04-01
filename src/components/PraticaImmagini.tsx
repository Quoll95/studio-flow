import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { compressImage } from "@/lib/file-compression";
import { Image, Upload, Camera, Trash2, Download, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

type FilePratica = {
  id: string;
  nome_file: string;
  storage_path: string;
  mime_type: string | null;
  dimensione: number | null;
  created_at: string;
};

export default function PraticaImmagini({ praticaId, files, onUpdate }: {
  praticaId: string;
  files: FilePratica[];
  onUpdate: () => void;
}) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxUrls, setLightboxUrls] = useState<Record<string, string>>({});
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const loadThumbnail = async (file: FilePratica) => {
    if (thumbnails[file.id]) return;
    const { data } = await supabase.storage
      .from("pratica-files")
      .createSignedUrl(file.storage_path, 3600);
    if (data?.signedUrl) {
      setThumbnails(prev => ({ ...prev, [file.id]: data.signedUrl }));
    }
  };

  const loadLightboxUrl = async (file: FilePratica) => {
    if (lightboxUrls[file.id]) return lightboxUrls[file.id];
    const { data } = await supabase.storage
      .from("pratica-files")
      .createSignedUrl(file.storage_path, 600);
    if (data?.signedUrl) {
      setLightboxUrls(prev => ({ ...prev, [file.id]: data.signedUrl }));
      return data.signedUrl;
    }
    return null;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non autenticato");
      for (const file of Array.from(selectedFiles)) {
        // Comprimi l'immagine prima dell'upload
        const compressed = await compressImage(file);
        const path = `${user.id}/${praticaId}/immagini/${Date.now()}_${compressed.name}`;
        const { error: uploadError } = await supabase.storage.from("pratica-files").upload(path, compressed);
        if (uploadError) throw uploadError;
        await supabase.from("file_pratica").insert({
          id_pratica: praticaId, user_id: user.id, nome_file: compressed.name,
          tipo: "immagine", mime_type: compressed.type, dimensione: compressed.size, storage_path: path,
        });
      }
      toast({ title: "Immagini caricate" });
      onUpdate();
    } catch (err: any) {
      toast({ title: "Errore upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const openLightbox = async (index: number) => {
    setLightboxIndex(index);
    await loadLightboxUrl(files[index]);
  };

  const goTo = useCallback(async (dir: number) => {
    if (lightboxIndex === null) return;
    const next = lightboxIndex + dir;
    if (next < 0 || next >= files.length) return;
    setLightboxIndex(next);
    await loadLightboxUrl(files[next]);
  }, [lightboxIndex, files]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [lightboxIndex]);

  // Keyboard nav
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(-1);
      else if (e.key === "ArrowRight") goTo(1);
      else if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, goTo]);

  const handleDownload = async (file: FilePratica) => {
    const url = lightboxUrls[file.id] || await loadLightboxUrl(file);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = file.nome_file;
      a.click();
    }
  };

  const handleDelete = async (file: FilePratica) => {
    if (!confirm(`Eliminare "${file.nome_file}"?`)) return;
    await supabase.storage.from("pratica-files").remove([file.storage_path]);
    await supabase.from("file_pratica").delete().eq("id", file.id);
    toast({ title: "Immagine eliminata" });
    setLightboxIndex(null);
    onUpdate();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) files.forEach(f => loadThumbnail(f));
  };

  const currentFile = lightboxIndex !== null ? files[lightboxIndex] : null;
  const currentUrl = currentFile ? lightboxUrls[currentFile.id] || thumbnails[currentFile.id] : null;

  return (
    <>
      <Card>
        <Collapsible open={open} onOpenChange={handleOpenChange}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer hover:opacity-80">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4" /> Immagini
                {files.length > 0 && (
                  <span className="text-xs text-muted-foreground font-normal">({files.length})</span>
                )}
              </CardTitle>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <div className="flex gap-1">
              {/* Camera button solo su mobile */}
              {isMobile && (
                <>
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
                  <Button size="sm" variant="outline" disabled={uploading} onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
              <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1" />
                {uploading ? "..." : "Carica"}
              </Button>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nessuna immagine caricata</p>
              ) : (
                <div className={`grid gap-2 ${isMobile ? "grid-cols-3" : "grid-cols-4 md:grid-cols-5 lg:grid-cols-6"}`}>
                  {files.map((file, idx) => (
                    <div
                      key={file.id}
                      className={`relative group rounded-md overflow-hidden bg-muted cursor-pointer ${isMobile ? "aspect-square" : "aspect-[4/3]"}`}
                      onClick={() => openLightbox(idx)}
                    >
                      {thumbnails[file.id] ? (
                        <img src={thumbnails[file.id]} alt={file.nome_file} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground animate-pulse" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Lightbox fullscreen */}
      {lightboxIndex !== null && currentFile && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onTouchStart={e => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={e => {
            if (touchStart === null) return;
            const diff = e.changedTouches[0].clientX - touchStart;
            if (Math.abs(diff) > 60) {
              goTo(diff > 0 ? -1 : 1);
            }
            setTouchStart(null);
          }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between p-3 text-white shrink-0">
            <p className="text-sm truncate max-w-[50%]">{currentFile.nome_file}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">{lightboxIndex + 1}/{files.length}</span>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => handleDownload(currentFile)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-red-500/40 h-8 w-8" onClick={() => handleDelete(currentFile)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setLightboxIndex(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center relative min-h-0">
            {currentUrl ? (
              <img src={currentUrl} alt={currentFile.nome_file} className="max-w-full max-h-full object-contain" />
            ) : (
              <Image className="h-12 w-12 text-white/40 animate-pulse" />
            )}
            {/* Desktop arrows */}
            {!isMobile && files.length > 1 && (
              <>
                {lightboxIndex > 0 && (
                  <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10" onClick={() => goTo(-1)}>
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}
                {lightboxIndex < files.length - 1 && (
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10" onClick={() => goTo(1)}>
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
