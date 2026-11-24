import { NavLink, Outlet } from "react-router-dom";
import { BedDouble, Heart, House, Building2, UserRound } from "lucide-react";

const TABS = [
  { to: "/", label: "Beranda", icon: House, end: true },
  { to: "/kos", label: "Kos", icon: BedDouble },
  { to: "/kontrakan", label: "Kontrakan", icon: Building2 },
  { to: "/favorit", label: "Favorit", icon: Heart },
  { to: "/profil", label: "Profil", icon: UserRound },
];

/** Bottom Navigation Bar dengan 5 tab. */
export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
        >
          <span className="nav-icon">
            <Icon size={22} />
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/** Kerangka halaman utama: isi halaman + Bottom Navigation. */
export function TabLayout() {
  return (
    <div className="tab-layout">
      <main className="tab-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
