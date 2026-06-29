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

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

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
  // Only allow SELECT queries for the data explorer
  app.post("/api/explorer", authenticateToken, authorize(['Admin', 'Analyst']), (req, res) => {
    const { query } = req.body;
    try {
      const trimmed = query.trim();
      if (!/^SELECT\b/i.test(trimmed)) {
        return res.status(403).json({ error: "Only SELECT queries are allowed" });
      }
      const rows = db.prepare(query).all();
      res.json(rows);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // AI Assistant Proxy - forwards requests to Gemini API securely (server-side)
  app.post("/api/ai", authenticateToken, async (req, res) => {
    const systemPrompt = `You are the MIU Intelligence Agent (MIA), an AI assistant for the Mining & Industry Unit Database.
Your goal is to help users query, analyze, and understand mining and industry data.

DATABASE SCHEMA:
- stakeholders: id, full_name, position, organization, email, phone, category
- mining_data: id, mineral_type, production_volume, export_volume, royalties, corporate_tax, dividend_tax, reserve_value, equity_stake, date_recorded
- industry_data: id, sector, production_volume, import_volume, export_volume, reporting_period
- market_prices: id, commodity_name, price, date_time

CAPABILITIES:
1. Query Data: You can fetch real-time data from the database using natural language.
2. Summarization: You can provide summaries of production, exports, and market trends.
3. SQL Conversion: If asked for a query, you can generate and execute it.

GUIDELINES:
- Be professional, technical yet accessible.
- Always provide units (e.g., Tons, USD) if available.
- If you don't know something, ask for clarification or use the search tool.
- Use the tools provided to fetch REAL data. Do not make up numbers.`;

    try {
      const { message } = req.body;
      const { GoogleGenAI, Type } = await import("@google/genai");

      const schemaTools = [
        {
          name: "executeQuery",
          description: "Executes a SQL SELECT query against the Mining & Industry Database and returns the results.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              sql: {
                type: Type.STRING,
                description: "The SQL SELECT query to execute. Example: 'SELECT * FROM mining_data WHERE mineral_type = \"Gold\"'"
              }
            },
            required: ["sql"]
          }
        },
        {
          name: "getMarketStatus",
          description: "Fetches current market prices for key minerals.",
          parameters: {
            type: Type.OBJECT,
            properties: {}
          }
        }
      ];

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: schemaTools }]
        }
      });

      let response = await chat.sendMessage({ message });
      let toolInvocations = response.functionCalls;

      while (toolInvocations && toolInvocations.length > 0) {
        const toolResponses = await Promise.all(toolInvocations.map(async (call) => {
          if (call.name === 'executeQuery') {
            try {
              const data = db.prepare((call.args as any).sql).all();
              return { name: call.name, response: { content: data } };
            } catch (err: any) {
              return { name: call.name, response: { error: err.message } };
            }
          }
          if (call.name === 'getMarketStatus') {
            const data = db.prepare('SELECT * FROM market_prices ORDER BY date_time DESC LIMIT 100').all();
            return { name: call.name, response: { content: data } };
          }
          return { name: call.name, response: { error: "Unknown tool" } };
        }));

        response = await chat.sendMessage({
          message: toolResponses.map(r => ({ functionResponse: r })) as any
        });
        toolInvocations = response.functionCalls;
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('AI proxy error:', error);
      res.status(500).json({ error: error.message });
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
