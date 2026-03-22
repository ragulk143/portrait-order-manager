import { useState, useRef } from "react";
import { API } from "../App";

export default function OrderForm() {
  const [form, setForm] = useState({
    name: "", whatsapp: "", num_people: "1",
    size: "A4", deadline: "", address: "", notes: "",
  });
  const [photo, setPhoto]           = useState(null);
  const [photoPreview, setPreview]  = useState(null);
  const [loading, setLoading]       = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");
  const fileRef = useRef();

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.whatsapp.trim()) {
      setError("Name and WhatsApp number are required.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append("photo", photo);
      const res = await fetch(`${API}/api/orders`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="text-5xl mb-6">🎨</div>
        <h2 className="font-display text-2xl font-bold text-ink mb-3">Order Received!</h2>
        <p className="text-muted font-body mb-8 leading-relaxed">
          Thank you! The artist will contact you on WhatsApp shortly.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ name:"",whatsapp:"",num_people:"1",size:"A4",deadline:"",address:"",notes:"" });
            setPhoto(null); setPreview(null);
          }}
          className="btn-ghost"
        >
          Place another order
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Commission a Portrait</h1>
        <p className="text-muted text-sm">Fill in the details and we'll reach out on WhatsApp.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="label">Your Name *</label>
          <input name="name" value={form.name} onChange={change}
            placeholder="Full name" className="input-field" required />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="label">WhatsApp Number *</label>
          <input name="whatsapp" value={form.whatsapp} onChange={change}
            placeholder="+91 98765 43210" className="input-field" required />
        </div>

        {/* Photo */}
        <div>
          <label className="label">Reference Photo</label>
          <div
            onClick={() => fileRef.current.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              photoPreview ? "border-accent bg-orange-50" : "border-soft hover:border-accent hover:bg-orange-50"
            }`}
          >
            {photoPreview ? (
              <div className="flex flex-col items-center gap-2">
                <img src={photoPreview} alt="Preview" className="max-h-40 rounded-lg object-cover" />
                <span className="text-xs text-muted">{photo?.name}</span>
                <span className="text-xs text-accent">Click to change</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted">
                <span className="text-3xl">📷</span>
                <span className="text-sm">Click to upload reference photo</span>
                <span className="text-xs">JPG, PNG, WEBP · max 10 MB</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </div>

        {/* People + Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Number of People</label>
            <input name="num_people" type="number" min="1" max="20"
              value={form.num_people} onChange={change} className="input-field" />
          </div>
          <div>
            <label className="label">Portrait Size</label>
            <select name="size" value={form.size} onChange={change} className="input-field">
              <option>A4</option>
              <option>A3</option>
            </select>
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="label">Deadline</label>
          <input name="deadline" type="date" value={form.deadline} onChange={change} className="input-field" />
        </div>

        {/* Address */}
        <div>
          <label className="label">Delivery Address</label>
          <textarea name="address" value={form.address} onChange={change}
            rows={2} placeholder="Street, City, PIN code" className="input-field resize-none" />
        </div>

        {/* Notes */}
        <div>
          <label className="label">Additional Notes</label>
          <textarea name="notes" value={form.notes} onChange={change}
            rows={3} placeholder="Style preferences, framing, special instructions..."
            className="input-field resize-none" />
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? "Submitting…" : "Submit Order"}
        </button>
      </form>
    </div>
  );
}
