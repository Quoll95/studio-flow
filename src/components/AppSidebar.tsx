import {
  LayoutDashboard,
  FolderOpen,
  Users,
  CalendarDays,
  Settings,
  ScrollText,
  LogOut,
  ClipboardList,
  Euro,
  Receipt,
  Calculator,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
// import logoBianco from "@/assets/logo-bianco.png"; // Logo precedente — mantenuto per riferimento
// import logoBianco from "@/assets/logo-white-1.png"; // Logo bianco senza scritta — mantenuto per riferimento
import logoBianco from "@/assets/logo-white-2.png";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Punto della Situazione", url: "/situazione", icon: ClipboardList },
  { title: "Pratiche", url: "/pratiche", icon: FolderOpen },
  { title: "Clienti", url: "/clienti", icon: Users },
  { title: "Calendario", url: "/calendario", icon: CalendarDays },
  { title: "Guadagni", url: "/guadagni", icon: Euro },
  { title: "Spese Fisse", url: "/spese-fisse", icon: Receipt },
  { title: "Netto Tasse", url: "/netto-tasse", icon: Calculator },
  { title: "Attività", url: "/audit", icon: ScrollText },
  { title: "Impostazioni", url: "/impostazioni", icon: Settings },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-5 border-b border-sidebar-border">
        <img src={logoBianco} alt="Studio Tecnico Ferrante" className="h-12 w-auto object-contain" />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeClassName="bg-sidebar-accent text-sidebar-primary"
            onClick={onNavigate}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Esci</span>
        </button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-shrink-0 h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}
