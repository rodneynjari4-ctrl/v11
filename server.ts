import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS and iframe embedding
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.removeHeader("X-Frame-Options");
  res.header("Content-Security-Policy", "frame-ancestors *;");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found in environment variables. Running in fallback mode.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// In-memory leads storage for demo bookings & quote requests
const leadsStore: Array<any> = [];

const SYSTEM_INSTRUCTION = `You are the VisionONE Access AI Assistant.
You represent VisionONE Access, an enterprise business management platform.
Tagline: "Your intelligent guide to complete business visibility."
Core message: "One Platform. Complete Business Visibility."

PERSONALITY & TONE:
- Human, warm, professional, concise, confident, consultative, helpful.
- Avoid robotic repetition and excessive corporate jargon.
- Voice response style: The "voiceText" field MUST be short (1-2 natural spoken sentences, conversational, warm, no markdown, no URLs, no bullet lists). The "text" field can provide crisp transcript details.

CRITICAL ANTI-REPETITION RULES:
- Never repeat the same question or closing prompt on consecutive turns.
- Do NOT repeatedly ask "Would you like to book a quick demo?" on every turn. Only suggest a demo when the user asks for one, asks about pricing, or expresses clear interest in seeing the system.
- Directly answer the user's specific question first before offering follow-up guidance.
- Keep the tone varied, helpful, and natural.

CORE PRODUCT KNOWLEDGE:
- ERP: Connected business management platform bringing core operations together and improving management visibility.
- FINANCE & ACCOUNTING: Accounting, financial reporting, bank reconciliation, cost centres, project accounting, multi-company accounting, management reporting, internal controls, audit trails.
- HR & PAYROLL: Employee records, payroll, leave, attendance, statutory payroll processes, Employee Self-Service, time management, biometric attendance, payroll controls, duplicate/anomaly detection.
- INVENTORY & PROCUREMENT: Procurement, stock management, inventory visibility, purchasing workflows, approvals, supplier management, inventory reporting.
- eTIMS: Electronic invoicing and business workflows around eTIMS (never invent unsupported compliance claims).
- M-PESA INTEGRATION: STK Push, PayBill, Till payment capture, payment validation, customer/invoice matching, receipts, notifications, unmatched payments, reversals and exceptions, reconciliation, reporting.
- INTERNAL CONTROLS: Role-based access, maker-checker workflows, segregation of duties.

INDUSTRY INTELLIGENCE:
- Manufacturing: Production, inventory, procurement, costs, finance, operations.
- Construction: Projects, cost centres, procurement, inventory, payroll, project expenses.
- Agriculture: Operations, procurement, inventory, cost tracking, finance.
- Distribution: Inventory, procurement, sales, finance, customer management.
- Property: Property management, finance, tenant-related processes, reporting.
- Professional Services: Finance, HR, payroll, projects, customer billing, reporting.

LEAD QUALIFICATION & SALES INTENT:
- When a visitor expresses interest, ask ONE qualifying question at a time.
- Recognize buying signals ("How much does it cost?", "Can I get a demo?", "Can someone contact me?", "How does implementation work?", "Can it integrate with M-Pesa?").
- Primary CTAs: "Book a Demo", "Talk to Our Team", "Request a Quote".
- Pricing rule: Never invent pricing! State: "Pricing depends on your business requirements, users, modules and implementation needs. The VisionONE team can recommend the right setup and provide a tailored quotation."
- Unknown info rule: Never hallucinate prices, clients, stats, specs, or legal guarantees.

Always return a valid JSON object strictly matching the schema.`;

// Intelligent dynamic fallback generator when Gemini API is rate-limited or unavailable
function generateSmartFallback(message: string, history: Array<any> = []) {
  const query = (message || "").toLowerCase();
  
  if (query.includes("demo") || query.includes("schedule") || query.includes("book") || query.includes("walkthrough")) {
    return {
      text: "We would be delighted to show you VisionONE Access in action! You can schedule a live demonstration with our senior solution specialists.",
      voiceText: "I'd be glad to arrange a live demonstration for your team. You can pick a convenient time right here.",
      intent: "demo_request",
      suggestedQuestions: ["What happens during a demo?", "What modules will be shown?", "Can my whole team join?"],
      cta: { type: "demo", label: "Book a Demo", description: "Schedule a 30-minute tailored walkthrough" },
    };
  }

  if (query.includes("price") || query.includes("cost") || query.includes("quote") || query.includes("license") || query.includes("fee")) {
    return {
      text: "VisionONE Access pricing is tailored based on your organization size, active modules, and implementation scope. Our team will prepare a clear, itemized quotation for you.",
      voiceText: "Pricing depends on the modules you need and the scale of your organization. We can prepare a customized quote for you.",
      intent: "pricing",
      suggestedQuestions: ["Request a custom quote", "Book a discovery call", "Explore ERP modules"],
      cta: { type: "quote", label: "Request a Quote", description: "Get a tailored proposal from our enterprise team" },
    };
  }

  if (query.includes("payroll") || query.includes("hr") || query.includes("salary") || query.includes("statutory") || query.includes("attendance")) {
    return {
      text: "VisionONE HR & Payroll automates statutory deductions, biometric clock-in attendance, leave workflows, employee self-service, and anomaly detection.",
      voiceText: "VisionONE HR and Payroll streamlines your entire workforce management, statutory compliance, and biometric attendance.",
      intent: "product_inquiry",
      suggestedQuestions: ["How does biometric clock-in work?", "Does it support Employee Self-Service?", "Book a Payroll Demo"],
      cta: null,
    };
  }

  if (query.includes("etims") || query.includes("kra") || query.includes("tax") || query.includes("invoice")) {
    return {
      text: "VisionONE Access integrates directly with KRA eTIMS, enabling automated electronic tax invoice signing, fiscal compliance, and secure transmission without manual re-entry.",
      voiceText: "VisionONE connects with KRA eTIMS for seamless automated invoice signing and complete tax compliance.",
      intent: "product_inquiry",
      suggestedQuestions: ["How does eTIMS signing work?", "Can it handle credit notes?", "Book an eTIMS Walkthrough"],
      cta: null,
    };
  }

  if (query.includes("mpesa") || query.includes("m-pesa") || query.includes("payment") || query.includes("stk") || query.includes("paybill") || query.includes("till")) {
    return {
      text: "Our M-Pesa integration automates STK Push prompt requests, PayBill and Till payment matching, real-time receipting, and automated bank reconciliation.",
      voiceText: "Our M-Pesa integration connects STK Push, PayBills, and Tills directly to customer accounts and reconciliations.",
      intent: "product_inquiry",
      suggestedQuestions: ["Does it support automatic receipting?", "How are unmatched payments handled?", "Explore Finance Integration"],
      cta: null,
    };
  }

  if (query.includes("finance") || query.includes("accounting") || query.includes("ledger") || query.includes("reconciliation")) {
    return {
      text: "VisionONE Finance delivers full general ledger, accounts payable and receivable, bank reconciliation, multi-currency support, cost centers, and audit-grade internal controls.",
      voiceText: "Our finance suite gives you complete accounting visibility, automated reconciliation, and executive financial reporting.",
      intent: "product_inquiry",
      suggestedQuestions: ["How does bank reconciliation work?", "Can it handle multi-currency?", "Book a Finance Demo"],
      cta: null,
    };
  }

  if (query.includes("inventory") || query.includes("stock") || query.includes("procurement") || query.includes("warehouse")) {
    return {
      text: "VisionONE Inventory & Procurement tracks real-time stock levels across multiple warehouses, triggers automated reorder thresholds, and routes purchase orders through approval workflows.",
      voiceText: "VisionONE tracks multi-warehouse inventory in real time and automates procurement approval workflows.",
      intent: "product_inquiry",
      suggestedQuestions: ["Does it support multiple warehouses?", "How do purchase approvals work?", "Can I see a demo?"],
      cta: null,
    };
  }

  if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("morning") || query.includes("afternoon")) {
    return {
      text: "Hello! I am your VisionONE Access guide. I can help you explore our ERP, finance, HR & payroll, inventory, eTIMS, and M-Pesa solutions.",
      voiceText: "Hello! I'm your VisionONE Access guide. Which business area would you like to explore today?",
      intent: "greeting",
      suggestedQuestions: ["Tell me about Core ERP", "How does HR & Payroll work?", "Explain eTIMS integration"],
      cta: null,
    };
  }

  // General intelligent response
  return {
    text: "VisionONE Access unifies ERP, Finance, HR & Payroll, Inventory, and payment workflows into one reliable platform designed for complete business visibility.",
    voiceText: "VisionONE Access brings complete visibility across your core business operations. Which area would you like to focus on?",
    intent: "product_inquiry",
    suggestedQuestions: ["Explore ERP Modules", "How does M-Pesa integrate?", "Request a consultation"],
    cta: null,
  };
}

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "VisionONE Access AI",
    time: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// 2. Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "A valid message is required." });
  }

  const conversationContext = (history || [])
    .slice(-6)
    .map((m: any) => `${m.role === "user" ? "USER" : "AI"}: ${m.text}`)
    .join("\n");

  const prompt = `Current conversation history:
${conversationContext}

Latest USER message: "${message}"

Respond with a JSON object containing:
- "text": string (crisp transcript answer, 1-3 sentences)
- "voiceText": string (ultra-short spoken response, 1-2 natural spoken sentences, conversational, warm, no markdown)
- "intent": string ("greeting" | "product_inquiry" | "pricing" | "lead_qualification" | "demo_request" | "industry_fit" | "unknown")
- "suggestedQuestions": array of 2-3 short strings relevant to this specific moment in the conversation
- "cta": optional object with {"type": "demo"|"contact"|"quote", "label": string, "description": string} if buying intent or demo requested, or null`;

  const ai = getGeminiClient();

  // Try gemini-3.1-flash-lite first (fast, reliable, active quota), then fallback to gemini-3.8-flash
  const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "The written response displayed in the chat transcript.",
              },
              voiceText: {
                type: Type.STRING,
                description: "A short, spoken conversational response for speech synthesis.",
              },
              intent: {
                type: Type.STRING,
                description: "Detected user intent category.",
              },
              suggestedQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 to 3 contextual follow-up questions.",
              },
              cta: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
              },
            },
            required: ["text", "voiceText", "intent", "suggestedQuestions"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.text && parsed.voiceText) {
        return res.json({
          text: parsed.text,
          voiceText: parsed.voiceText,
          intent: parsed.intent || "product_inquiry",
          suggestedQuestions: parsed.suggestedQuestions || [
            "Explore ERP modules",
            "How does HR & Payroll work?",
            "Can I schedule a demo?",
          ],
          cta: parsed.cta || null,
        });
      }
    } catch (modelError: any) {
      console.warn(`Model ${model} failed, attempting next option:`, modelError?.message?.slice(0, 100));
    }
  }

  // If all Gemini models are exhausted or network unavailable, use dynamic smart fallback
  console.log("Using smart dynamic knowledge fallback for message:", message);
  const fallback = generateSmartFallback(message, history);
  return res.json(fallback);
});

// 3. Lead capture endpoint
app.post("/api/lead", (req, res) => {
  try {
    const lead = req.body;
    if (!lead || !lead.name || (!lead.email && !lead.phone)) {
      return res.status(400).json({ error: "Name and at least email or phone are required." });
    }

    const newLead = {
      id: "lead-" + Date.now(),
      ...lead,
      createdAt: new Date().toISOString(),
      status: "new",
    };

    leadsStore.push(newLead);
    console.log("New VisionONE lead registered:", newLead);

    return res.json({
      success: true,
      message: "Lead recorded successfully. A VisionONE specialist will reach out.",
      leadId: newLead.id,
    });
  } catch (err: any) {
    console.error("Error in /api/lead:", err);
    return res.status(500).json({ error: "Failed to record lead." });
  }
});

async function startServer() {
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
    console.log(`VisionONE Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
