require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const multer  = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // service key bypasses RLS — safe for your own backend
);

const BUCKET = "reference-photos";   // must match bucket name you create in Supabase

// ─── Multer (memory storage — we stream directly to Supabase) ─────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(file.mimetype);
    cb(ok ? null : new Error("Only image files allowed"), ok);
  },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.json({ status: "Portrait Order Manager API is running" }));

// ─── GET all orders ───────────────────────────────────────────────────────────
app.get("/api/orders", async (_req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── GET single order ─────────────────────────────────────────────────────────
app.get("/api/orders/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Order not found" });
  res.json(data);
});

// ─── POST create order ────────────────────────────────────────────────────────
app.post("/api/orders", upload.single("photo"), async (req, res) => {
  const { name, whatsapp, num_people, size, deadline, address, notes } = req.body;

  if (!name?.trim() || !whatsapp?.trim()) {
    return res.status(400).json({ error: "Name and WhatsApp are required" });
  }

  // Upload photo to Supabase Storage if provided
  let photo_url = null;
  if (req.file) {
    const ext      = req.file.originalname.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Photo upload failed:", uploadError.message);
      // Don't block order creation — just skip the photo
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
      photo_url = urlData.publicUrl;
    }
  }

  // Insert order into DB
  const { data, error } = await supabase
    .from("orders")
    .insert([{
      name:       name.trim(),
      whatsapp:   whatsapp.trim(),
      photo_url,
      num_people: parseInt(num_people) || 1,
      size:       size || "A4",
      deadline:   deadline || null,
      address:    address || null,
      notes:      notes   || null,
      status:     "New",
      payment:    "Pending",
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── PATCH update order status / payment ─────────────────────────────────────
app.patch("/api/orders/:id", async (req, res) => {
  const { status, payment } = req.body;
  const patch = {};
  if (status)  patch.status  = status;
  if (payment) patch.payment = payment;

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── DELETE order ─────────────────────────────────────────────────────────────
app.delete("/api/orders/:id", async (req, res) => {
  // Get photo URL first so we can clean up storage
  const { data: order } = await supabase
    .from("orders")
    .select("photo_url")
    .eq("id", req.params.id)
    .single();

  // Delete from DB
  const { error } = await supabase.from("orders").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  // Remove from Storage (best-effort)
  if (order?.photo_url) {
    const fileName = order.photo_url.split("/").pop();
    await supabase.storage.from(BUCKET).remove([fileName]);
  }

  res.json({ success: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ API running → http://localhost:${PORT}`);
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL || "⚠️  Not set"}`);
});
