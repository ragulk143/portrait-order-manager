import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../App";

const STATUS_CONFIG  = {
  New:       { color: "bg-blue-100 text-blue-700" },
  Drawing:   { color: "bg-amber-100 text-amber-700" },
  Completed: { color: "bg-green-100 text-green-700" },
  Shipped:   { color: "bg-purple-100 text-purple-700" },
};
const PAYMENT_CONFIG = {
  Pending: { color: "bg-red-100 text-red-600" },
  Paid:    { color: "bg-emerald-100 text-emerald-700" },
};

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-ink text-sm leading-relaxed">{value}</p>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const update = async (patch) => {
    const res = await fetch(`${API}/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setOrder(await res.json());
  };

  if (loading) return <div className="text-center py-20 text-muted">Loading…</div>;
  if (!order || order.error) return (
    <div className="text-center py-20">
      <p className="text-muted mb-4">Order not found.</p>
      <button onClick={() => navigate("/dashboard")} className="btn-ghost">← Back</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate("/dashboard")}
        className="text-sm text-muted hover:text-ink transition-colors mb-6 flex items-center gap-1">
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div className="card mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{order.name}</h1>
            <p className="text-muted text-sm mt-0.5">{order.whatsapp}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className={`status-badge ${STATUS_CONFIG[order.status]?.color}`}>{order.status}</span>
            <span className={`status-badge ${PAYMENT_CONFIG[order.payment]?.color}`}>{order.payment}</span>
          </div>
        </div>
        <p className="text-xs text-muted mt-3">
          Ordered on {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Details */}
        <div className="card space-y-4">
          <h2 className="font-display text-base font-semibold text-ink">Order Details</h2>
          <Field label="Number of People" value={String(order.num_people)} />
          <Field label="Portrait Size"    value={order.size} />
          <Field label="Deadline"         value={order.deadline
            ? new Date(order.deadline).toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })
            : null} />
          <Field label="Delivery Address" value={order.address} />
          <Field label="Notes"            value={order.notes} />
        </div>

        {/* Controls */}
        <div className="space-y-5">
          <div className="card space-y-3">
            <h2 className="font-display text-base font-semibold text-ink">Update Status</h2>
            <div>
              <label className="label">Order Status</label>
              <select value={order.status} onChange={(e) => update({ status: e.target.value })} className="input-field">
                {Object.keys(STATUS_CONFIG).map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Status</label>
              <select value={order.payment} onChange={(e) => update({ payment: e.target.value })} className="input-field">
                {Object.keys(PAYMENT_CONFIG).map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="card">
            <h2 className="font-display text-base font-semibold text-ink mb-3">Contact</h2>
            <a
              href={`https://wa.me/${order.whatsapp.replace(/\D/g, "")}?text=Hi+${encodeURIComponent(order.name)}%2C+your+portrait+order+update+is+ready!`}
              target="_blank" rel="noopener noreferrer"
              className="btn-primary flex items-center justify-center gap-2 w-full"
            >
              💬 WhatsApp Customer
            </a>
          </div>
        </div>
      </div>

      {/* Reference photo */}
      {order.photo_url && (
        <div className="card mt-5">
          <h2 className="font-display text-base font-semibold text-ink mb-4">Reference Photo</h2>
          <img src={order.photo_url} alt="Reference"
            className="w-full max-h-96 object-contain rounded-lg bg-canvas" />
          <a href={order.photo_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-accent mt-3 inline-block hover:underline">
            Open full size ↗
          </a>
        </div>
      )}
    </div>
  );
}
