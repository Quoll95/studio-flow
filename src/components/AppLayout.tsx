import { useState, useRef, useCallback } from "react";
import { AppSidebar, SidebarContent } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
// import logoNero from "@/assets/logo-nero.png"; // Logo precedente — mantenuto per riferimento
import logoNero from "@/assets/logo-scritta-grande.png";
// import soloLogo from "@/assets/solo-logo.png"; // Solo logo senza scritta — mantenuto per riferimento

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (touchStartX.current < 40 && deltaX > 60 && deltaY < 60) {
      setMobileOpen(true);
    }
  }, []);

  return (
    <div
      className="flex min-h-screen w-full bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AppSidebar />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-0 [&>button]:hidden bg-sidebar">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card sticky top-0 z-40">
          <img src={logoNero} alt="Studio Tecnico Ferrante" className="h-10 w-auto object-contain" />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
