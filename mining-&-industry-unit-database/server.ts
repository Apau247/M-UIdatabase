import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "./server/db.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "mining-key-2025";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  };

  const authorize = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes((req as any).user.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      next();
    };
  };

  // --- Auth Routes ---
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });

  // --- API Routes ---

  // Stakeholders
  app.get("/api/stakeholders", authenticateToken, (req, res) => {
    const rows = db.prepare('SELECT * FROM stakeholders').all();
    res.json(rows);
  });

  app.post("/api/stakeholders", authenticateToken, authorize(['Admin', 'Analyst']), (req, res) => {
    const { full_name, position, organization, email, phone, category } = req.body;
    const result = db.prepare('INSERT INTO stakeholders (full_name, position, organization, email, phone, category) VALUES (?, ?, ?, ?, ?, ?)')
      .run(full_name, position, organization, email, phone, category);
    res.status(201).json({ id: result.lastInsertRowid });
  });

  app.delete("/api/stakeholders/:id", authenticateToken, authorize(['Admin']), (req, res) => {
    db.prepare('DELETE FROM stakeholders WHERE id = ?').run(req.params.id);
    res.status(204).end();
  });

  // Mining Data
  app.get("/api/mining", authenticateToken, (req, res) => {
    const rows = db.prepare('SELECT * FROM mining_data').all();
    res.json(rows);
  });

  app.post("/api/mining", authenticateToken, authorize(['Admin', 'Analyst']), (req, res) => {
    const { mineral_type, production_volume, export_volume, royalties, corporate_tax, dividend_tax, reserve_value, equity_stake, date_recorded } = req.body;
    const result = db.prepare(`
      INSERT INTO mining_data (mineral_type, production_volume, export_volume, royalties, corporate_tax, dividend_tax, reserve_value, equity_stake, date_recorded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(mineral_type, production_volume, export_volume, royalties, corporate_tax, dividend_tax, reserve_value, equity_stake, date_recorded || new Date().toISOString());
    res.status(201).json({ id: result.lastInsertRowid });
  });

  // Industry Data
  app.get("/api/industry", authenticateToken, (req, res) => {
    const rows = db.prepare('SELECT * FROM industry_data').all();
    res.json(rows);
  });

  app.post("/api/industry", authenticateToken, authorize(['Admin', 'Analyst']), (req, res) => {
    const { sector, production_volume, import_volume, export_volume, reporting_period } = req.body;
    const result = db.prepare('INSERT INTO industry_data (sector, production_volume, import_volume, export_volume, reporting_period) VALUES (?, ?, ?, ?, ?)')
      .run(sector, production_volume, import_volume, export_volume, reporting_period);
    res.status(201).json({ id: result.lastInsertRowid });
  });

  // Market Prices
  app.get("/api/prices", authenticateToken, (req, res) => {
    const rows = db.prepare('SELECT * FROM market_prices ORDER BY date_time DESC LIMIT 100').all();
    res.json(rows);
  });

  app.post("/api/prices", authenticateToken, authorize(['Admin', 'Analyst']), (req, res) => {
    const { commodity_name, price } = req.body;
    const result = db.prepare('INSERT INTO market_prices (commodity_name, price) VALUES (?, ?)').run(commodity_name, price);
    res.status(201).json({ id: result.lastInsertRowid });
  });

  // Dashboard Stats
  app.get("/api/stats", authenticateToken, (req, res) => {
    const totalStakeholders = db.prepare('SELECT count(*) as count FROM stakeholders').get() as any;
    const totalProduction = db.prepare('SELECT sum(production_volume) as total FROM mining_data').get() as any;
    const totalRoyalties = db.prepare('SELECT sum(royalties) as total FROM mining_data').get() as any;
    const latestPrices = db.prepare('SELECT * FROM market_prices ORDER BY date_time DESC LIMIT 5').all();
    
    res.json({
      stakeholders: totalStakeholders.count,
      production: totalProduction.total || 0,
      royalties: totalRoyalties.total || 0,
      latestPrices
    });
  });

  // Data Explorer (Flexible Query)
  // SECURITY NOTE: This is a demo. Raw SQL execution is dangerous.
  // We'll restrict this to Admin only and maybe validate table names.
  app.post("/api/explorer", authenticateToken, authorize(['Admin', 'Analyst']), (req, res) => {
    const { query } = req.body;
    try {
      // Very basic validation to prevent common destructive operations if not intended
      if (/DROP|DELETE|UPDATE|INSERT|TRUNCATE/i.test(query) && (req as any).user.role !== 'Admin') {
        return res.status(403).json({ error: "Only Admins can perform destructive queries" });
      }
      const rows = db.prepare(query).all();
      res.json(rows);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
