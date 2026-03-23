import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../App";

const PASSWORD = "zohraharts2206";

const STATUS_CONFIG = {
  New:       { color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500" },
  Drawing:   { color: "bg-amber-100 text-amber-700",   dot: "bg-amber-500" },
  Completed: { color: "bg-green-100 text-green-700",   dot: "bg-green-500" },
  Shipped:   { color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
};
const PAYMENT_CONFIG = {
  Pending: { color: "bg-red-100 text-red-600" },
  Paid:    { color: "bg-emerald-100 text-emerald-700" },
};
const STATUSES = Object.keys(STATUS_CONFIG);
const PAYMENTS = Object.keys(PAYMENT_CONFIG);

function InlineSelect({ value, options, onChange, config }) {
  const cfg = config[value] || {};
  return (
    <select
      value={value}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      onClick={(e) => e.stopPropagation()}
      className={`status-badge border-0 cursor-pointer outline-none ${cfg.color}`}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function Dashboard() {
  const [auth, setAuth]     = useState(false);
  const [pass, setPass]     = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/orders`);
      setOrders(await res.json());
    } catch { console.error("Failed to load orders"); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { if (auth) fetchOrders(); }, [auth, fetchOrders]);

  const update = async (id, patch) => {
    const res = await fetch(`${API}/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const updated = await res.json();
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const del = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this order?")) return;
    await fetch(`${API}/api/orders/${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // ── Password screen ──────────────────────────────────────────────────────────
  if (!auth) return (
    <div className="max-w-sm mx-auto mt-24">
      <div className="card text-center">
        <div className="text-4xl mb-4">🎨</div>
        <h2 className="font-display text-xl font-bold text-ink mb-2">Artist Access Only</h2>
        <p className="text-muted text-sm mb-6">Enter your password to view orders</p>
        <input
          className="input-field mb-3"
          type="password"
          placeholder="Enter password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (pass === PASSWORD) setAuth(true);
              else alert("Wrong password!");
            }
          }}
        />
        <button
          className="btn-primary w-full"
          onClick={() => {
            if (pass === PASSWORD) setAuth(true);
            else alert("Wrong password!");
          }}
        >
          Enter Dashboard
        </button>
      </div>
    </div>
  );

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const filtered = filter === "All" ? orders : orders.filter((o) => o.status === filter);
  const counts   = STATUSES.reduce((acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }), {});
  const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Orders</h1>
          <p className="text-muted text-sm mt-0.5">{orders.length} total</p>
        </div>
        <button onClick={fetchOrders} className="btn-ghost text-xs px-3 py-2">↻ Refresh</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter((f) => f === s ? "All" : s)}
            className={`card py-4 text-left transition-all ${filter === s ? "ring-2 ring-accent" : ""}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
              <span className="text-xs text-muted font-medium">{s}</span>
            </div>
            <span className="font-display text-2xl font-bold text-ink">{counts[s]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-muted">
          {filter === "All" ? "No orders yet." : `No "${filter}" orders.`}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-soft bg-canvas">
                  {["Customer","People","Size","Deadline","Status","Payment",""].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-soft">
                {filtered.map((o) => (
                  <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)}
                    className="hover:bg-orange-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-ink">{o.name}</div>
                      <div className="text-xs text-muted">{o.whatsapp}</div>
                    </td>
                    <td className="px-4 py-3.5 text-muted">{o.num_people}</td>
                    <td className="px-4 py-3.5 text-muted">{o.size}</td>
                    <td className="px-4 py-3.5 text-muted">{fmtDate(o.deadline)}</td>
                    <td className="px-4 py-3.5">
                      <InlineSelect value={o.status} options={STATUSES}
                        onChange={(v) => update(o.id, { status: v })} config={STATUS_CONFIG} />
                    </td>
                    <td className="px-4 py-3.5">
                      <InlineSelect value={o.payment} options={PAYMENTS}
                        onChange={(v) => update(o.id, { payment: v })} config={PAYMENT_CONFIG} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={(e) => del(e, o.id)}
                        className="text-muted hover:text-red-500 transition-colors">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden divide-y divide-soft">
            {filtered.map((o) => (
              <div key={o.id} onClick={() => navigate(`/orders/${o.id}`)}
                className="px-4 py-4 cursor-pointer hover:bg-orange-50 transition-colors">
                <div className="flex justify-between mb-2">
                  <div>
                    <div className="font-medium text-ink text-sm">{o.name}</div>
                    <div className="text-xs text-muted">{o.whatsapp}</div>
                  </div>
                  <button onClick={(e) => del(e, o.id)} className="text-muted hover:text-red-500 text-sm">✕</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-soft text-muted px-2 py-0.5 rounded-full">
                    {o.num_people} {o.num_people === 1 ? "person" : "people"} · {o.size}
                  </span>
                  {o.deadline && (
                    <span className="text-xs bg-soft text-muted px-2 py-0.5 rounded-full">{fmtDate(o.deadline)}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                  <InlineSelect value={o.status} options={STATUSES}
                    onChange={(v) => update(o.id, { status: v })} config={STATUS_CONFIG} />
                  <InlineSelect value={o.payment} options={PAYMENTS}
                    onChange={(v) => update(o.id, { payment: v })} config={PAYMENT_CONFIG} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

