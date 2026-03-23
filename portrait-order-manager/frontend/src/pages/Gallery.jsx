import { useState, useEffect } from "react";
import { API } from "../App";

export default function Gallery() {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState({ name: "", whatsapp: "", address: "" });
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    fetch(`${API}/api/shop/items`)
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleBuy = async () => {
    setError("");
    if (!form.name.trim() || !form.whatsapp.trim() || !form.address.trim()) {
      setError("All fields are required."); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/shop/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: selected.id, ...form }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSubmitted(data);
      setSelected(null);
      setForm({ name: "", whatsapp: "", address: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-5xl mb-6">🎉</div>
        <h2 className="font-display text-2xl font-bold text-ink mb-3">Order Placed!</h2>
        <p className="text-muted text-sm mb-4 leading-relaxed">
          The artist will contact you on WhatsApp to confirm and arrange delivery.
        </p>
        <div className="card mb-6">
          <p className="label">Your Order Reference</p>
          <p className="font-display text-3xl font-bold text-accent">{submitted.ref_id}</p>
          <p className="text-xs text-muted mt-2">Save this number — artist will use it for courier</p>
        </div>
        <button className="btn-ghost" onClick={() => setSubmitted(null)}>Browse more</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Shop</h1>
        <p className="text-muted text-sm">Original portrait artworks available for purchase.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted">No artworks listed yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="card p-0 overflow-hidden group">
              <div className="aspect-square bg-canvas overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-4xl">🖼️</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-ink mb-1">{item.title}</h3>
                {item.description && (
                  <p className="text-muted text-xs mb-3 leading-relaxed">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-bold text-accent">₹{item.price}</span>
                  {item.sold ? (
                    <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-medium">Sold</span>
                  ) : (
                    <button onClick={() => setSelected(item)} className="btn-primary py-1.5 px-4 text-xs">
                      Buy Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-ink mb-1">Place Order</h2>
            <p className="text-muted text-xs mb-5">
              {selected.title} — <span className="text-accent font-semibold">₹{selected.price}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="label">Your Name *</label>
                <input name="name" value={form.name} onChange={change}
                  placeholder="Full name" className="input-field" />
              </div>
              <div>
                <label className="label">WhatsApp Number *</label>
                <input name="whatsapp" value={form.whatsapp} onChange={change}
                  placeholder="+91 98765 43210" className="input-field" />
              </div>
              <div>
                <label className="label">Delivery Address *</label>
                <textarea name="address" value={form.address} onChange={change}
                  rows={3} placeholder="Street, City, PIN code"
                  className="input-field resize-none" />
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">{error}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setSelected(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleBuy} disabled={submitting} className="btn-primary flex-1">
                {submitting ? "Placing…" : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
