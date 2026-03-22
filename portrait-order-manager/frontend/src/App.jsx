import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import OrderForm   from "./pages/OrderForm";
import Dashboard   from "./pages/Dashboard";
import OrderDetail from "./pages/OrderDetail";

// Single place to change the API URL — reads from .env
export const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

function Nav() {
  return (
    <header className="bg-white border-b border-soft sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-ink">
          <span className="text-accent">✦</span> Portrait Orders
        </span>
        <nav className="flex gap-1">
          {[
            { to: "/",          label: "New Order",  end: true },
            { to: "/dashboard", label: "Dashboard",  end: false },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-accent text-white" : "text-muted hover:text-ink hover:bg-soft"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-canvas">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div key={location.pathname} className="page-enter">
          <Routes>
            <Route path="/"           element={<OrderForm />} />
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
