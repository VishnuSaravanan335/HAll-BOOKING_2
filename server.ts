import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    department TEXT
  );

  CREATE TABLE IF NOT EXISTS halls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    capacity INTEGER,
    type TEXT,
    is_locked INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    resource_person TEXT,
    coordinator_name TEXT,
    phone TEXT,
    department TEXT,
    student_count INTEGER,
    date TEXT,
    time_slot TEXT,
    hall_id INTEGER,
    status TEXT DEFAULT 'Pending_Admin',
    booker_id INTEGER,
    has_budget INTEGER DEFAULT 0,
    budget_amount REAL DEFAULT 0,
    intro_video INTEGER DEFAULT 0,
    dance_performance INTEGER DEFAULT 0,
    FOREIGN KEY(hall_id) REFERENCES halls(id)
  );

  CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    department TEXT,
    stock_qty INTEGER DEFAULT 100
  );

  CREATE TABLE IF NOT EXISTS event_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    item_id INTEGER,
    requested_qty INTEGER DEFAULT 0,
    providable_qty INTEGER DEFAULT 0,
    allocated_qty INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(item_id) REFERENCES inventory_items(id)
  );
`);

// Migration: Ensure columns exist in events table
const columns = db.prepare("PRAGMA table_info(events)").all() as any[];
const columnNames = columns.map(c => c.name);

if (!columnNames.includes('has_budget')) {
  db.exec("ALTER TABLE events ADD COLUMN has_budget INTEGER DEFAULT 0");
}
if (!columnNames.includes('budget_amount')) {
  db.exec("ALTER TABLE events ADD COLUMN budget_amount REAL DEFAULT 0");
}
if (!columnNames.includes('intro_video')) {
  db.exec("ALTER TABLE events ADD COLUMN intro_video INTEGER DEFAULT 0");
}
if (!columnNames.includes('dance_performance')) {
  db.exec("ALTER TABLE events ADD COLUMN dance_performance INTEGER DEFAULT 0");
}

// Migration: Ensure columns exist in event_inventory table
const eiColumns = db.prepare("PRAGMA table_info(event_inventory)").all() as any[];
const eiColumnNames = eiColumns.map(c => c.name);

if (!eiColumnNames.includes('requested_qty')) {
  db.exec("ALTER TABLE event_inventory ADD COLUMN requested_qty INTEGER DEFAULT 0");
}
if (!eiColumnNames.includes('providable_qty')) {
  db.exec("ALTER TABLE event_inventory ADD COLUMN providable_qty INTEGER DEFAULT 0");
}
if (!eiColumnNames.includes('allocated_qty')) {
  db.exec("ALTER TABLE event_inventory ADD COLUMN allocated_qty INTEGER DEFAULT 0");
}
if (!eiColumnNames.includes('status')) {
  db.exec("ALTER TABLE event_inventory ADD COLUMN status TEXT DEFAULT 'Pending'");
}

// Seed initial data
const seedData = () => {
  const users = [
    ["admin", "admin", "Admin", "Administration"],
    ["student", "student", "Booker", "CSE"],
    ["it", "it", "IT", "IT Support"],
    ["reception", "reception", "Reception", "Reception"],
    ["principal", "principal", "Principal", "Management"]
  ];

  const insertUser = db.prepare("INSERT OR REPLACE INTO users (username, password, role, department) VALUES (?, ?, ?, ?)");
  users.forEach(u => insertUser.run(...u));

  const halls = [
    ...["Lab-1", "Lab-2", "Lab-3", "Lab-4", "Lab-5", "Lab-6", "Lab-7", "Lab-8", "Lab-9", "AT101", "BF112", "CF117", "AS107"].map(n => [n, 50, "Lab/Classroom"]),
    ...["Seminar-1", "Seminar-2"].map(n => [n, 300, "Seminar Hall"]),
    ...["Auditorium-1", "Auditorium-2", "OAT"].map(n => [n, 1000, "Auditorium"])
  ];

  const insertHall = db.prepare("INSERT OR REPLACE INTO halls (name, capacity, type) VALUES (?, ?, ?)");
  halls.forEach(h => insertHall.run(...h));

  const itItems = [
    "Hand Mic", "Speakers", "Laptops", "Projectors", "Presenter", 
    "Podium Mic", "Podium", "Photocam", "Photographs", "Videocam"
  ];
  const receptionItems = [
    "Lamp", "Paneer sprinkler", "Tray", "Silver bowls", "Table cloth", 
    "Plug card", "L-Folder", "Water bottle", "Hall Chairs", "Stage Table", 
    "Stage Chair", "Registration Table", "Registration Chair", 
    "Reception table", "Refreshment table", "White Board", "T-Poy"
  ];

  const insertItem = db.prepare("INSERT OR REPLACE INTO inventory_items (name, department, stock_qty) VALUES (?, ?, ?)");
  itItems.forEach(item => insertItem.run(item, "IT", 100));
  receptionItems.forEach(item => insertItem.run(item, "Reception", 100));

  // Cleanup duplicates if any
  db.exec("DELETE FROM inventory_items WHERE id NOT IN (SELECT MIN(id) FROM inventory_items GROUP BY name)");
  db.exec("DELETE FROM halls WHERE id NOT IN (SELECT MIN(id) FROM halls GROUP BY name)");
};

seedData();

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${username}`);
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      console.log(`[AUTH] Login successful: ${username} (${user.role})`);
      res.json(user);
    } else {
      console.warn(`[AUTH] Login failed: ${username}`);
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Inventory Items API
  app.get("/api/inventory-items", (req, res) => {
    const items = db.prepare("SELECT * FROM inventory_items").all();
    res.json(items);
  });

  app.post("/api/inventory-items", (req, res) => {
    const { name, department, stock_qty } = req.body;
    db.prepare("INSERT INTO inventory_items (name, department, stock_qty) VALUES (?, ?, ?)").run(name, department, stock_qty);
    res.json({ success: true });
  });

  app.patch("/api/inventory-items/:id", (req, res) => {
    const { id } = req.params;
    const { stock_qty } = req.body;
    db.prepare("UPDATE inventory_items SET stock_qty = ? WHERE id = ?").run(stock_qty, id);
    res.json({ success: true });
  });

  app.delete("/api/inventory-items/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM inventory_items WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Events API
  app.get("/api/events", (req, res) => {
    try {
      const events = db.prepare(`
        SELECT e.*, h.name as hall_name, u.username as booker_name 
        FROM events e 
        LEFT JOIN halls h ON e.hall_id = h.id
        LEFT JOIN users u ON e.booker_id = u.id
        ORDER BY e.id DESC
      `).all();
      console.log(`[API] Fetched ${events.length} events`);
      res.json(events);
    } catch (err) {
      console.error("[API] Error fetching events:", err);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events", (req, res) => {
    console.log("Incoming Proposal:", JSON.stringify(req.body, null, 2));
    const { 
      name, resource_person, coordinator_name, phone, department, 
      student_count, date, time_slot, booker_id, hall_id,
      has_budget, budget_amount, intro_video, dance_performance 
    } = req.body;

    if (!booker_id) {
      console.error("Missing booker_id in proposal");
      return res.status(400).json({ error: "Booker ID is required" });
    }

    try {
      // Double booking check
      if (hall_id) {
        const existing = db.prepare("SELECT id FROM events WHERE hall_id = ? AND date = ? AND status != 'Declined'").get(hall_id, date);
        if (existing) {
          console.warn(`[API] Double booking detected for hall ${hall_id} on ${date}`);
          return res.status(400).json({ error: "Hall is already booked for this date." });
        }
      }

      const result = db.prepare(`
        INSERT INTO events (
          name, resource_person, coordinator_name, phone, department, 
          student_count, date, time_slot, booker_id, hall_id,
          has_budget, budget_amount, intro_video, dance_performance
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name, resource_person, coordinator_name, phone, department, 
        Number(student_count), date, time_slot, Number(booker_id), hall_id ? Number(hall_id) : null,
        has_budget ? 1 : 0, Number(budget_amount) || 0, intro_video ? 1 : 0, dance_performance ? 1 : 0
      );
      console.log("[API] Created Event ID:", result.lastInsertRowid);
      res.json({ id: result.lastInsertRowid });
    } catch (err) {
      console.error("[API] Error creating event:", err);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.get("/api/check-availability", (req, res) => {
    const { hall_id, date } = req.query;
    const existing = db.prepare("SELECT id FROM events WHERE hall_id = ? AND date = ? AND status != 'Declined'").get(hall_id, date);
    res.json({ available: !existing });
  });

  app.patch("/api/events/:id", (req, res) => {
    const { id } = req.params;
    const { status, hall_id } = req.body;
    
    const transaction = db.transaction(() => {
      if (status === 'Declined') {
        // Return stock
        const items = db.prepare("SELECT item_id, allocated_qty FROM event_inventory WHERE event_id = ?").all(id) as any[];
        for (const item of items) {
          db.prepare("UPDATE inventory_items SET stock_qty = stock_qty + ? WHERE id = ?").run(item.allocated_qty || 0, item.item_id);
          // Also reset allocated_qty to 0 so it doesn't get returned again if status changes multiple times
          db.prepare("UPDATE event_inventory SET allocated_qty = 0 WHERE event_id = ? AND item_id = ?").run(id, item.item_id);
        }
      }

      if (status && hall_id) {
        db.prepare("UPDATE events SET status = ?, hall_id = ? WHERE id = ?").run(status, hall_id, id);
      } else if (status) {
        db.prepare("UPDATE events SET status = ? WHERE id = ?").run(status, id);
      } else if (hall_id) {
        db.prepare("UPDATE events SET hall_id = ? WHERE id = ?").run(hall_id, id);
      }
    });

    transaction();
    res.json({ success: true });
  });

  app.delete("/api/events/:id", (req, res) => {
    const { id } = req.params;
    const transaction = db.transaction(() => {
      // Return stock
      const items = db.prepare("SELECT item_id, allocated_qty FROM event_inventory WHERE event_id = ?").all(id) as any[];
      for (const item of items) {
        db.prepare("UPDATE inventory_items SET stock_qty = stock_qty + ? WHERE id = ?").run(item.allocated_qty || 0, item.item_id);
      }
      db.prepare("DELETE FROM events WHERE id = ?").run(id);
      db.prepare("DELETE FROM event_inventory WHERE event_id = ?").run(id);
    });
    transaction();
    res.json({ success: true });
  });

  // Inventory API
  app.get("/api/inventory-items", (req, res) => {
    const items = db.prepare("SELECT * FROM inventory_items").all();
    res.json(items);
  });

  app.get("/api/event-inventory/:eventId", (req, res) => {
    const { eventId } = req.params;
    const items = db.prepare(`
      SELECT ei.*, ii.name, ii.department, ii.stock_qty
      FROM event_inventory ei
      JOIN inventory_items ii ON ei.item_id = ii.id
      WHERE ei.event_id = ?
    `).all(eventId);
    res.json(items);
  });

  app.post("/api/event-inventory", (req, res) => {
    const { event_id, items } = req.body; // items: [{item_id, requested_qty}]
    const insert = db.prepare("INSERT INTO event_inventory (event_id, item_id, requested_qty) VALUES (?, ?, ?)");
    const transaction = db.transaction((data) => {
      for (const item of data) {
        insert.run(event_id, item.item_id, item.requested_qty);
      }
    });
    transaction(items);
    res.json({ success: true });
  });

  app.patch("/api/event-inventory/:id", (req, res) => {
    const { id } = req.params;
    const { providable_qty, allocated_qty, status } = req.body;
    
    const transaction = db.transaction(() => {
      const current = db.prepare("SELECT * FROM event_inventory WHERE id = ?").get(id) as any;
      if (!current) return;

      const updates = [];
      const params = [];
      if (providable_qty !== undefined) { updates.push("providable_qty = ?"); params.push(providable_qty); }
      if (allocated_qty !== undefined) { 
        updates.push("allocated_qty = ?"); 
        params.push(allocated_qty); 
        
        // Adjust stock
        const diff = allocated_qty - (current.allocated_qty || 0);
        db.prepare("UPDATE inventory_items SET stock_qty = stock_qty - ? WHERE id = ?").run(diff, current.item_id);
      }
      if (status !== undefined) { updates.push("status = ?"); params.push(status); }
      params.push(id);
      
      if (updates.length > 0) {
        db.prepare(`UPDATE event_inventory SET ${updates.join(", ")} WHERE id = ?`).run(...params);
      }
    });

    transaction();
    res.json({ success: true });
  });

  // Halls API
  app.get("/api/halls", (req, res) => {
    const halls = db.prepare("SELECT * FROM halls").all();
    res.json(halls);
  });

  app.patch("/api/halls/:id", (req, res) => {
    const { id } = req.params;
    const { is_locked } = req.body;
    db.prepare("UPDATE halls SET is_locked = ? WHERE id = ?").run(is_locked ? 1 : 0, id);
    res.json({ success: true });
  });

  // User Management API
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role, department FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role, department } = req.body;
    db.prepare("INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)").run(username, password, role, department);
    res.json({ success: true });
  });

  app.delete("/api/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
