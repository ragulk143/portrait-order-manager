require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const multer  = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app  = express();
const PORT = process.env.PORT || 3001;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PORTRAIT_BUCKET = "reference-photos";
const SHOP_BUCKET     = "shop-items";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(file.mimetype);
    cb(ok ? null : new Error("Only image files allowed"), ok);
  },
});

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

app.get("/", (_req, res) => res.json({ status: "Portrait Order Manager API is running" }));

async function uploadImage(file, bucket) {
  if (!file) return null;
  const ext      = file.originalname.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file.buffer, {
    contentType: file.mimetype, upsert: false,
  });
  if (error) { console.error("Upload error:", error.message); return null; }
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

function genRefId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ZA-${num}`;
}

app.get("/api/orders", async (_req, res) => {
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/orders/:id", async (req, res) => {
  const { data, error } = await supabase.from("orders").select("*").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ error: "Order not found" });
  res.json(data);
});

app.post("/api/orders", upload.single("photo"), async (req, res) => {
  const { name, whatsapp, num_people, size, deadline, address, notes } = req.body;
  if (!name?.trim() || !whatsapp?.trim()) return res.status(400).json({ error: "Name and WhatsApp are required" });
  const photo_url = await uploadImage(req.file, PORTRAIT_BUCKET);
  const { data, error } = await supabase.from("orders").insert([{
    name: name.trim(), whatsapp: whatsapp.trim(), photo_url,
    num_people: parseInt(num_people) || 1, size: size || "A4",
    deadline: deadline || null, address: address || null, notes: notes || null,
    status: "New", payment: "Pending",
  }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.patch("/api/orders/:id", async (req, res) => {
  const { status, payment } = req.body;
  const patch = {};
  if (status)  patch.status  = status;
  if (payment) patch.payment = payment;
  if (!Object.keys(patch).length) return res.status(400).json({ error: "Nothing to update" });
  const { data, error } = await supabase.from("orders").update(patch).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/api/orders/:id", async (req, res) => {
  const { data: order } = await supabase.from("orders").select("photo_url").eq("id", req.params.id).single();
  const { error } = await supabase.from("orders").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  if (order?.photo_url) {
    const fileName = order.photo_url.split("/").pop();
    await supabase.storage.from(PORTRAIT_BUCKET).remove([fileName]);
  }
  res.json({ success: true });
});

app.get("/api/shop/items", async (_req, res) => {
  const { data, error } = await supabase.from("shop_items").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/shop/items", upload.single("photo"), async (req, res) => {
  const { title, description, price } = req.body;
  if (!title?.trim() || !price) return res.status(400).json({ error: "Title and price are required" });
  const image_url = await uploadImage(req.file, SHOP_BUCKET);
  const { data, error } = await supabase.from("shop_items").insert([{
    title: title.trim(), description: description || null,
    price: parseFloat(price), image_url, sold: false,
  }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.patch("/api/shop/items/:id", async (req, res) => {
  const { sold } = req.body;
  const { data, error } = await supabase.from("shop_items").update({ sold }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/api/shop/items/:id", async (req, res) => {
  const { data: item } = await supabase.from("shop_items").select("image_url").eq("id", req.params.id).single();
  const { error } = await supabase.from("shop_items").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  if (item?.image_url) {
    const fileName = item.image_url.split("/").pop();
    await supabase.storage.from(SHOP_BUCKET).remove([fileName]);
  }
  res.json({ success: true });
});

app.get("/api/shop/orders", async (_req, res) => {
  const { data, error } = await supabase.from("shop_orders").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/shop/orders", async (req, res) => {
  const { item_id, name, whatsapp, address } = req.body;
  if (!item_id || !name?.trim() || !whatsapp?.trim() || !address?.trim()) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const { data: item, error: itemErr } = await supabase.from("shop_items").select("*").eq("id", item_id).single();
  if (itemErr || !item) return res.status(404).json({ error: "Item not found" });
  if (item.sold) return res.status(400).json({ error: "Item already sold" });

  let ref_id, exists = true;
  while (exists) {
    ref_id = genRefId();
    const { data } = await supabase.from("shop_orders").select("id").eq("ref_id", ref_id).single();
    exists = !!data;
  }

  const { data, error } = await supabase.from("shop_orders").insert([{
    ref_id, item_id, item_title: item.title, item_price: item.price,
    name: name.trim(), whatsapp: whatsapp.trim(), address: address.trim(),
    status: "New",
  }]).select().single();
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from("shop_items").update({ sold: true }).eq("id", item_id);
  res.status(201).json(data);
});

app.patch("/api/shop/orders/:id", async (req, res) => {
  const { status } = req.body;
  const { data, error } = await supabase.from("shop_orders").update({ status }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ API running → http://localhost:${PORT}`);
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL || "⚠️  Not set"}`);
});
