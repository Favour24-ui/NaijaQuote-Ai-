import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// -------------------------------------------------------------------------
// DATABASE STORAGE ENGINE (JSON File-based)
// -------------------------------------------------------------------------
const DB_FILE = path.join(process.cwd(), "database.json");

interface DbSchema {
  users: any[];
  passwords: Record<string, string>; // userId -> hashedPassword
  customers: any[];
  quotations: any[];
}

function initDb(): DbSchema {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData: DbSchema = {
      users: [],
      passwords: {},
      customers: [
        {
          id: "cust_1",
          userId: "system",
          name: "Chinedu Okafor",
          company: "Okafor & Sons Logistics",
          email: "chinedu@okaforsons.ng",
          phone: "+234 803 123 4567",
          address: "15 Marina Road, Lagos Island, Lagos",
          createdAt: new Date().toISOString()
        },
        {
          id: "cust_2",
          userId: "system",
          name: "Fatima Yusuf",
          company: "Arewa Agro Allied Ltd",
          email: "fatima@arewaagro.com.ng",
          phone: "+234 812 987 6543",
          address: "42 Gombe Road, Kano, Kano State",
          createdAt: new Date().toISOString()
        },
        {
          id: "cust_3",
          userId: "system",
          name: "Olumide Adebayo",
          company: "Eko Tech Ventures",
          email: "olumide@ekotech.io",
          phone: "+234 905 555 1234",
          address: "7b Admiralty Way, Lekki Phase 1, Lagos",
          createdAt: new Date().toISOString()
        }
      ],
      quotations: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf8");
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database.json, resetting to default", err);
    return { users: [], passwords: {}, customers: [], quotations: [] };
  }
}

function saveDb(data: DbSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

const dbData = initDb();

// In-memory sessions store (token -> userId)
const activeSessions: Record<string, string> = {};

// Simple SHA256 hashing for password safety
function hashPassword(password: string): string {
  const salt = "nigerian_ai_quotation_salt_2026_secure";
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

// Cookie and session parser helpers
function getSessionToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, c: string) => {
    const parts = c.trim().split("=");
    if (parts.length === 2) {
      acc[parts[0]] = parts[1];
    }
    return acc;
  }, {});
  return cookies["session_token"] || null;
}

// -------------------------------------------------------------------------
// SECURE AUTH MIDDLEWARE
// -------------------------------------------------------------------------
function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getSessionToken(req);
  if (!token || !activeSessions[token]) {
    return res.status(401).json({ error: "Unauthorized. Please log in securely." });
  }
  (req as any).userId = activeSessions[token];
  next();
}

// -------------------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------------------
app.post("/api/auth/register", (req, res) => {
  const { email, password, businessName, businessPhone, businessAddress, bankName, bankAccountName, bankAccountNumber } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required fields." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: "Invalid email address format." });
  }

  const existingUser = dbData.users.find(u => u.email === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: "A user with this email address already exists." });
  }

  const userId = "user_" + crypto.randomUUID();
  const newUser = {
    id: userId,
    email: normalizedEmail,
    businessName: businessName?.trim() || "",
    businessPhone: businessPhone?.trim() || "",
    businessAddress: businessAddress?.trim() || "",
    bankName: bankName?.trim() || "",
    bankAccountName: bankAccountName?.trim() || "",
    bankAccountNumber: bankAccountNumber?.trim() || "",
    createdAt: new Date().toISOString()
  };

  dbData.users.push(newUser);
  dbData.passwords[userId] = hashPassword(password);
  saveDb(dbData);

  // Auto log-in on register
  const token = crypto.randomBytes(32).toString("hex");
  activeSessions[token] = userId;

  res.cookie("session_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 86400000 });
  res.json({ token, user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required fields." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = dbData.users.find(u => u.email === normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const hashedPassword = hashPassword(password);
  const correctPassword = dbData.passwords[user.id];

  if (hashedPassword !== correctPassword) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  activeSessions[token] = user.id;

  res.cookie("session_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 86400000 });
  res.json({ token, user });
});

app.post("/api/auth/logout", (req, res) => {
  const token = getSessionToken(req);
  if (token) {
    delete activeSessions[token];
  }
  res.clearCookie("session_token");
  res.json({ success: true, message: "Logged out successfully" });
});

app.get("/api/auth/session", (req, res) => {
  const token = getSessionToken(req);
  if (!token || !activeSessions[token]) {
    return res.status(401).json({ authenticated: false });
  }
  const userId = activeSessions[token];
  const user = dbData.users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, user });
});

app.put("/api/auth/update-profile", authenticateUser, (req, res) => {
  const userId = (req as any).userId;
  const { businessName, businessPhone, businessAddress, bankName, bankAccountName, bankAccountNumber } = req.body;

  const userIdx = dbData.users.findIndex(u => u.id === userId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "User profile not found." });
  }

  dbData.users[userIdx] = {
    ...dbData.users[userIdx],
    businessName: businessName?.trim() || "",
    businessPhone: businessPhone?.trim() || "",
    businessAddress: businessAddress?.trim() || "",
    bankName: bankName?.trim() || "",
    bankAccountName: bankAccountName?.trim() || "",
    bankAccountNumber: bankAccountNumber?.trim() || "",
  };

  saveDb(dbData);
  res.json({ success: true, user: dbData.users[userIdx] });
});

// -------------------------------------------------------------------------
// CUSTOMER ENDPOINTS
// -------------------------------------------------------------------------
app.get("/api/customers", authenticateUser, (req, res) => {
  const userId = (req as any).userId;
  // Include global systems examples for initial templates as well, but filter by user or system
  const userCustomers = dbData.customers.filter(c => c.userId === userId || c.userId === "system");
  res.json(userCustomers);
});

app.post("/api/customers", authenticateUser, (req, res) => {
  const userId = (req as any).userId;
  const { name, company, email, phone, address } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Customer name is a required field." });
  }

  const newCustomer = {
    id: "cust_" + crypto.randomUUID(),
    userId,
    name: name.trim(),
    company: company?.trim() || "",
    email: email?.trim() || "",
    phone: phone?.trim() || "",
    address: address?.trim() || "",
    createdAt: new Date().toISOString()
  };

  dbData.customers.push(newCustomer);
  saveDb(dbData);

  res.status(201).json(newCustomer);
});

app.put("/api/customers/:id", authenticateUser, (req, res) => {
  const userId = (req as any).userId;
  const customerId = req.params.id;
  const { name, company, email, phone, address } = req.body;

  const customerIdx = dbData.customers.findIndex(c => c.id === customerId && c.userId === userId);
  if (customerIdx === -1) {
    return res.status(404).json({ error: "Customer not found or access denied." });
  }

  dbData.customers[customerIdx] = {
    ...dbData.customers[customerIdx],
    name: name?.trim() || dbData.customers[customerIdx].name,
    company: company?.trim() !== undefined ? company.trim() : dbData.customers[customerIdx].company,
    email: email?.trim() !== undefined ? email.trim() : dbData.customers[customerIdx].email,
    phone: phone?.trim() !== undefined ? phone.trim() : dbData.customers[customerIdx].phone,
    address: address?.trim() !== undefined ? address.trim() : dbData.customers[customerIdx].address,
  };

  saveDb(dbData);
  res.json(dbData.customers[customerIdx]);
});

app.delete("/api/customers/:id", authenticateUser, (req, res) => {
  const userId = (req as any).userId;
  const customerId = req.params.id;

  const customerIdx = dbData.customers.findIndex(c => c.id === customerId && c.userId === userId);
  if (customerIdx === -1) {
    return res.status(404).json({ error: "Customer not found or access denied." });
  }

  dbData.customers.splice(customerIdx, 1);
  saveDb(dbData);

  res.json({ success: true, message: "Customer deleted successfully" });
});

// -------------------------------------------------------------------------
// QUOTATION ENDPOINTS
// -------------------------------------------------------------------------
app.get("/api/quotations", authenticateUser, (req, res) => {
  const userId = (req as any).userId;
  const userQuotes = dbData.quotations.filter(q => q.userId === userId);
  res.json(userQuotes);
});

app.get("/api/quotations/:id", authenticateUser, (req, res) => {
  const userId = (req as any).userId;
  const quoteId = req.params.id;
  const quote = dbData.quotations.find(q => q.id === quoteId && q.userId === userId);
  if (!quote) {
    return res.status(404).json({ error: "Quotation not found or access denied." });
  }
  res.json(quote);
});

app.post("/api/quotations", authenticateUser, (req, res) => {
  const userId = (req as any).userId;
  const { quotationNumber, customerId, customerInfo, businessInfo, items, subtotal, discount, vatRate, vatAmount, total, terms, notes, status, validUntil } = req.body;

  if (!quotationNumber || !items || !items.length) {
    return res.status(400).json({ error: "Quotation number and items are required." });
  }

  const newQuotation = {
    id: "quote_" + crypto.randomUUID(),
    userId,
    quotationNumber: quotationNumber.trim(),
    customerId: customerId || null,
    customerInfo: customerInfo || {},
    businessInfo: businessInfo || {},
    items: items || [],
    subtotal: subtotal || 0,
    discount: discount || 0,
    vatRate: vatRate !== undefined ? vatRate : 7.5,
    vatAmount: vatAmount || 0,
    total: total || 0,
    terms: terms || "",
    notes: notes || "",
    status: status || "draft",
    validUntil: validUntil || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbData.quotations.push(newQuotation);
  saveDb(dbData);

  res.status(201).json(newQuotation);
});

app.put("/api/quotations/:id", authenticateUser, (req, res) => {
  const userId = (req as any).userId;
  const quoteId = req.params.id;
  const { quotationNumber, customerId, customerInfo, businessInfo, items, subtotal, discount, vatRate, vatAmount, total, terms, notes, status, validUntil } = req.body;

  const quoteIdx = dbData.quotations.findIndex(q => q.id === quoteId && q.userId === userId);
  if (quoteIdx === -1) {
    return res.status(404).json({ error: "Quotation not found or access denied." });
  }

  dbData.quotations[quoteIdx] = {
    ...dbData.quotations[quoteIdx],
    quotationNumber: quotationNumber?.trim() || dbData.quotations[quoteIdx].quotationNumber,
    customerId: customerId !== undefined ? customerId : dbData.quotations[quoteIdx].customerId,
    customerInfo: customerInfo || dbData.quotations[quoteIdx].customerInfo,
    businessInfo: businessInfo || dbData.quotations[quoteIdx].businessInfo,
    items: items || dbData.quotations[quoteIdx].items,
    subtotal: subtotal !== undefined ? subtotal : dbData.quotations[quoteIdx].subtotal,
    discount: discount !== undefined ? discount : dbData.quotations[quoteIdx].discount,
    vatRate: vatRate !== undefined ? vatRate : dbData.quotations[quoteIdx].vatRate,
    vatAmount: vatAmount !== undefined ? vatAmount : dbData.quotations[quoteIdx].vatAmount,
    total: total !== undefined ? total : dbData.quotations[quoteIdx].total,
    terms: terms !== undefined ? terms : dbData.quotations[quoteIdx].terms,
    notes: notes !== undefined ? notes : dbData.quotations[quoteIdx].notes,
    status: status || dbData.quotations[quoteIdx].status,
    validUntil: validUntil || dbData.quotations[quoteIdx].validUntil,
    updatedAt: new Date().toISOString()
  };

  saveDb(dbData);
  res.json(dbData.quotations[quoteIdx]);
});

app.delete("/api/quotations/:id", authenticateUser, (req, res) => {
  const userId = (req as any).userId;
  const quoteId = req.params.id;

  const quoteIdx = dbData.quotations.findIndex(q => q.id === quoteId && q.userId === userId);
  if (quoteIdx === -1) {
    return res.status(404).json({ error: "Quotation not found or access denied." });
  }

  dbData.quotations.splice(quoteIdx, 1);
  saveDb(dbData);

  res.json({ success: true, message: "Quotation deleted successfully" });
});

// -------------------------------------------------------------------------
// AI QUOTATION ESTIMATION ENGINE (Using Gemini-3.5-flash with Structured JSON)
// -------------------------------------------------------------------------
app.post("/api/quotations/ai-generate", authenticateUser, async (req, res) => {
  const { description, industry } = req.body;

  if (!description) {
    return res.status(400).json({ error: "A brief project description or items list is required for the AI assistant." });
  }

  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is not configured. Falling back to rule-based fallback generator.");
      return res.json(getFallbackAiEstimate(description, industry));
    }

    // Initialize Gemini API Client
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const promptText = `
    You are an expert financial consultant and operations manager in Nigeria specializing in generating accurate, highly professional business quotations.
    Generate a detailed quotation estimate in Nigerian Naira (NGN) for a customer requesting: "${description}"
    The industry is: "${industry || 'General Business Services'}"
    
    Ensure:
    1. Standard, realistic Nigerian pricing (e.g., website development ₦300,000 - ₦2,000,000, office painting ₦150,000 - ₦750,000, solar installation ₦600,000 - ₦3,500,000 depending on complexity).
    2. Quantities and unit prices must be realistic integer numbers.
    3. Suggested professional terms (such as: '70% mobilization fee, 30% upon completion', 'Validity: 30 days', 'Delivery: 2 weeks').
    4. Helpful professional Nigerian notes (e.g., mentioning logistics cost, material fluctuations, or local VAT context).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: "You are a professional business consultant for Nigerian SMEs. Your task is to output clean, structured, and realistic quotations with accurate NGN pricing.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            businessType: { type: Type.STRING, description: "Type of business or category" },
            estimatedScope: { type: Type.STRING, description: "A concise summary of the estimated scope" },
            suggestedTerms: { type: Type.STRING, description: "Recommended payment terms" },
            suggestedNotes: { type: Type.STRING, description: "Professional project notes or warranty details" },
            items: {
              type: Type.ARRAY,
              description: "Estimated line items for the quotation",
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: "Item name and description" },
                  quantity: { type: Type.NUMBER, description: "Count or quantity of the item" },
                  unitPrice: { type: Type.NUMBER, description: "Realistic unit price in Nigerian Naira (NGN)" }
                },
                required: ["description", "quantity", "unitPrice"]
              }
            }
          },
          required: ["businessType", "estimatedScope", "items", "suggestedTerms", "suggestedNotes"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini API.");
    }

    const result = JSON.parse(text);
    res.json(result);

  } catch (err: any) {
    console.error("Gemini AI API Error:", err);
    // Graceful fallback to maintain zero downtime even if API key is not active
    const fallback = getFallbackAiEstimate(description, industry);
    res.json({
      ...fallback,
      warning: "Note: Operating in optimized intelligent template mode. Please ensure GEMINI_API_KEY is active in Settings for deep AI reasoning."
    });
  }
});

// Highly tailored professional offline fallback generator for popular Nigerian business requests
function getFallbackAiEstimate(description: string, industry?: string) {
  const descLower = description.toLowerCase();
  
  if (descLower.includes("web") || descLower.includes("app") || descLower.includes("site") || descLower.includes("software")) {
    return {
      businessType: "Software & IT Services",
      estimatedScope: "Design, development, testing, and deployment of custom digital solution.",
      suggestedTerms: "60% Mobilization, 40% Final Launch & Handover. Valid for 30 days.",
      suggestedNotes: "Includes 3 months of complimentary hosting support, security patches, and minor bug fixes.",
      items: [
        { description: "System Architecture Design & UI/UX Wireframing", quantity: 1, unitPrice: 150000 },
        { description: "Core Backend & Database Development (Secure API)", quantity: 1, unitPrice: 350000 },
        { description: "Frontend Responsive App Integration (Mobile Ready)", quantity: 1, unitPrice: 250000 },
        { description: "Quality Assurance Testing & Cloud Deployment", quantity: 1, unitPrice: 100000 }
      ]
    };
  }

  if (descLower.includes("solar") || descLower.includes("power") || descLower.includes("inverter") || descLower.includes("battery")) {
    return {
      businessType: "Renewable Energy & Power Systems",
      estimatedScope: "Supply, installation, and commissioning of reliable backup solar inverter system.",
      suggestedTerms: "80% upfront material mobilization, 20% on commissioning. Valid for 14 days due to FX fluctuations.",
      suggestedNotes: "All solar panels come with a 5-year manufacturer warranty. Inverter and batteries come with a 1-year warranty.",
      items: [
        { description: "High-Efficiency Monocrystalline Solar Panels (450W)", quantity: 6, unitPrice: 110000 },
        { description: "Pure Sine Wave Hybrid Inverter System (3.5KVA 24V)", quantity: 1, unitPrice: 380000 },
        { description: "Smart Lithium-Ion Battery Pack (100Ah 24V)", quantity: 2, unitPrice: 420000 },
        { description: "Premium Installation, Solar Racks, Cabling & Surge Protection", quantity: 1, unitPrice: 150000 }
      ]
    };
  }

  if (descLower.includes("paint") || descLower.includes("renovat") || descLower.includes("build") || descLower.includes("interior")) {
    return {
      businessType: "Building & Construction Services",
      estimatedScope: "Professional wall preparation, painting, and interior styling of designated building structure.",
      suggestedTerms: "70% Material procurement advance, 30% upon completion. Valid for 30 days.",
      suggestedNotes: "Includes premium quality moisture-resistant paints (Dulux/Berger) and protective coverings for furniture.",
      items: [
        { description: "Premium Satin Emulsion Paint (Dulux - 20L Drum)", quantity: 4, unitPrice: 65000 },
        { description: "Screeding Plaster & Wall Prep Undercoat Materials", quantity: 2, unitPrice: 35000 },
        { description: "Skilled Painting & Surface Finishing Labor (per room average)", quantity: 5, unitPrice: 25000 },
        { description: "Logistics, Scaffolding, and Cleaning Post-Work", quantity: 1, unitPrice: 45000 }
      ]
    };
  }

  // Default smart estimate
  return {
    businessType: industry || "Business & Consulting Services",
    estimatedScope: "Professional supply, execution, and delivery of custom business request.",
    suggestedTerms: "50% mobilization fee, 50% balance upon final execution. Valid for 30 days.",
    suggestedNotes: "This estimate covers materials and standard labor. Any scope variation is subject to budget review.",
    items: [
      { description: "Project Management, Strategy & Consultation Phase", quantity: 1, unitPrice: 120000 },
      { description: "Primary Materials, Consumables & Logistics Support", quantity: 1, unitPrice: 250000 },
      { description: "Expert Technical Labor and Execution Fee", quantity: 1, unitPrice: 180000 }
    ]
  };
}

// -------------------------------------------------------------------------
// VITE OR STATIC FRONTEND SERVING
// -------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Quotation Generator server successfully running on port ${PORT}`);
  });
}

startServer();
