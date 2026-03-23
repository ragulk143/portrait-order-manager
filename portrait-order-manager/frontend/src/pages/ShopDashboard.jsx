import { useState, useEffect } from "react";
import { API } from "../App";

const PASSWORD = "zohraharts2206";

const STATUS_CONFIG = {
  New:       { color: "bg-blue-100 text-blue-700" },
  Shipped:   { color: "bg-purple-100 text-purple-700" },
  Delivered: { color: "bg-green-100 text-green-700" },
};

export default function ShopDashboard() {
  const [auth, setAuth]       = useState(false);
  const [pass, setPass]       = useState("");
  const [tab, setTab]         = useState("orders");
  const [orders, setOrders]   = useState([]);
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ title: "", description: "", price: "" });
  const [photo, setPhoto]     = useState(null);
  const [adding, setAdding]   = useState(false);
  const [msg, setMsg]         = useState("");

  useEffect(() => {
    if (!auth) return;
    Promise.all([
      fetch(`${API}/api/shop/orders`).then((r) => r.json()),
      fetch(`${API}/api/shop/items`).then((r) => r.json()),
    ]).then(([o, i]) => { setOrders(o); setItems(i); setLoading(false); });
  }, [auth]);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addItem = async () => {
    if (!form.title.trim() || !form.price) { setMsg("Title and price are required."); return; }
    setAdding(true); setMsg("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (photo) fd.append("photo", photo);
    const res = await fetch(`${API}/api/shop/items`, { method: "POST", body: fd });
    const newItem = await res.json();
    setItems((prev) => [newItem, ...prev]);
    setForm({ title: "", description: "", price: "" });
    setPhoto(null);
    setAdding(false);
    setMsg("✅ Item added!");
    setTimeout(() => setMsg(""), 3000);
  };

  const toggleSold = async (id, sold) => {
    const res = await fetch(`${API}/api/shop/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sold: !sold }),
    });
    const updated = await res.json();
    setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await fetch(`${API}/api/shop/items/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateOrderStatus = async (id, status) => {
    const res = await fetch(`${API}/api/shop/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
  };

  if (!auth) return (
    <div className="max-w-sm mx-auto mt-24">
      <div className="card text-center">
        <div className="text-4xl mb-4">🛍️</div>
        <h2 className="font-display text-xl font-bold text-ink mb-2">Shop Dashboard</h2>
        <p className="text-muted text-sm mb-6">Artist access only</p>
        <input className="input-field mb-3" type="password" placeholder="Enter password"
          value={pass} onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (pass === PASSWORD) setAuth(true);
              else alert("Wrong password!");
            }
          }} />
        <button className="btn-primary w-full"
          onClick={() => {
            if (pass === PASSWORD) setAuth(true);
            else alert("Wrong password!");
          }}>
          Enter
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Shop Dashboard</h1>
          <p className="text-muted text-sm mt-0.5">{orders.length} orders · {items.length} items</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("orders")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "orders" ? "bg-accent text-white" : "bg-white border border-soft text-muted hover:text-ink"}`}>
          📦 Orders ({orders.length})
        </button>
        <button onClick={() => setTab("items")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "items" ? "bg-accent text-white" : "bg-white border border-soft text-muted hover:text-ink"}`}>
          🖼️ My Artworks ({items.length})
        </button>
      </div>

      {tab === "orders" && (
        loading ? <div className="text-center py-20 text-muted">Loading…</div> :
        orders.length === 0 ? <div className="card text-center py-16 text-muted">No shop orders yet.</div> :
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-soft bg-canvas">
                  {["Ref ID","Customer","Item","Price","Address","Status",""].map((h,i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-soft">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-orange-50">
                    <td className="px-4 py-3.5">
                      <span className="font-display text-accent font-bold">{o.ref_id}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-ink">{o.name}</div>
                      <div className="text-xs text-muted">{o.whatsapp}</div>
                    </td>
                    <td className="px-4 py-3.5 text-muted text-xs">{o.item_title}</td>
                    <td className="px-4 py-3.5 text-accent font-semibold">₹{o.item_price}</td>
                    <td className="px-4 py-3.5 text-muted text-xs">{o.address}</td>
                    <td className="px-4 py-3.5">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer outline-none ${STATUS_CONFIG[o.status]?.color}`}>
                        {Object.keys(STATUS_CONFIG).map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <a href={`https://wa.me/${o.whatsapp.replace(/\D/g,"")}?text=Hi+${encodeURIComponent(o.name)}%2C+your+order+${o.ref_id}+is+on+the+way!`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline">💬 WA</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "items" && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">Add New Artwork</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Title *</label>
                <input name="title" value={form.title} onChange={change}
                  placeholder="e.g. Mother & Child Portrait" className="input-field" />
              </div>
              <div>
                <label className="label">Price (₹) *</label>
                <input name="price" type="number" value={form.price} onChange={change}
                  placeholder="e.g. 1500" className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <input name="description" value={form.description} onChange={change}
                  placeholder="e.g. Pencil sketch, A4 size, framed" className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Photo</label>
                <input type="file" accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  className="input-field py-2" />
              </div>
            </div>
            {msg && <p className="text-sm mt-3 text-green-600">{msg}</p>}
            <button onClick={addItem} disabled={adding} className="btn-primary mt-4">
              {adding ? "Adding…" : "Add Artwork"}
            </button>
          </div>

          {loading ? <div className="text-center py-10 text-muted">Loading…</div> :
          items.length === 0 ? <div className="card text-center py-10 text-muted">No artworks yet.</div> :
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="card p-0 overflow-hidden">
                <div className="aspect-square bg-canvas overflow-hidden">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl text-muted">🖼️</div>
                  }
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-ink text-sm mb-1">{item.title}</h3>
                  <p className="text-accent font-bold font-display text-lg mb-3">₹{item.price}</p>
                  <div className="flex gap-2">
                    <button onClick={() => toggleSold(item.id, item.sold)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors flex-1 ${item.sold ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                      {item.sold ? "Mark Available" : "Mark Sold"}
                    </button>
                    <button onClick={() => deleteItem(item.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>}
        </div>
      )}
    </div>
  );
}
