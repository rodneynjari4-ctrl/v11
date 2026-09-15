import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Comprehensive CORS & Iframe embedding headers (supports WordPress, VP Iframe Assistant, Elementor)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.removeHeader("X-Frame-Options");
  res.header("Content-Security-Policy", "frame-ancestors *;");
  // Grant microphone, autoplay, and audio permissions to iframes embedding this widget
  res.header("Permissions-Policy", "microphone=*, autoplay=*, clipboard-write=*");
  res.header("Feature-Policy", "microphone *; autoplay *");

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
      console.warn("GEMINI_API_KEY not found in environment variables. Running in smart fallback mode.");
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
- Warm, human, consultative, concise, confident, professional.
- Avoid robotic repetition and corporate jargon.

CRITICAL VOICE NATURALNESS & PHONETIC PRONUNCIATION INSTRUCTIONS FOR "voiceText":
- The "voiceText" field is spoken aloud to the user using speech synthesis.
- It MUST be written for maximum spoken naturalness and correct human pronunciation:
  * Pronounce acronyms phonetically: write "E-R-P" (never "ERP", which synthesizers mispronounce as "urp").
  * Write "Em-Pesa" (never "M-Pesa" which synthesizers stumble on as "m minus pesa").
  * Write "ee-Tims" (never "eTIMS" which synthesizers mispronounce as "eh-tims").
  * Write "K-R-A" (never "krah").
  * Write "H-R and Payroll" (never "HR/Payroll").
  * Write "S-T-K Push" (never "stuck push").
  * Write "Pay Bill" (never "PayBill").
  * Write "Vision One" (never "VisionONE").
  * Write "and" instead of "&", "percent" instead of "%".
- Keep voiceText to 1 to 2 warm, conversational sentences that flow naturally when spoken out loud.
- Never include markdown, bullet points, numbered lists like "1.", URLs, parentheses, or emojis in voiceText.
- Use natural pauses (commas) between clauses so the voice breathes naturally.
- The "text" field can provide detailed transcript information with standard formatting.

CRITICAL ANTI-REPETITION RULES:
- Never repeat the same question or closing prompt on consecutive turns.
- Do NOT repeatedly ask "Would you like to book a quick demo?" on every turn. Only suggest a demo when the user asks for one, asks about pricing, or expresses clear interest in seeing the system.
- Directly answer the user's specific question first.
- If the user asks "What modules are in VisionONE ERP?", enumerate the core modules: Finance & Accounting, HR & Payroll, Inventory & Procurement, eTIMS compliance, and M-PESA integration.

CORE PRODUCT KNOWLEDGE:
- ERP: Connected business management platform bringing core operations together and improving management visibility.
- FINANCE & ACCOUNTING: Accounting, financial reporting, bank reconciliation, cost centres, project accounting, multi-company accounting, management reporting, internal controls, audit trails.
- HR & PAYROLL: Employee records, payroll, leave, attendance, statutory payroll processes, Employee Self-Service, time management, biometric attendance, payroll controls, duplicate/anomaly detection.
- INVENTORY & PROCUREMENT: Procurement, stock management, inventory visibility, purchasing workflows, approvals, supplier management, multi-warehouse tracking.
- eTIMS: Electronic invoicing and business workflows directly compliant with KRA eTIMS.
- M-PESA INTEGRATION: STK Push, PayBill, Till payment capture, payment validation, customer/invoice matching, receipts, notifications, unmatched payments, reversals, reconciliation, reporting.
- INTERNAL CONTROLS: Role-based access, maker-checker workflows, segregation of duties.

LEAD QUALIFICATION & SALES INTENT:
- When a visitor expresses interest, ask ONE qualifying question at a time.
- Pricing rule: Never invent pricing! State: "Pricing depends on your business requirements, users, modules and implementation needs. The VisionONE team can recommend the right setup and provide a tailored quotation."
- Unknown info rule: Never hallucinate prices, clients, stats, specs, or legal guarantees.

Always return a valid JSON object strictly matching the schema.`;

// Intelligent, varied dynamic fallback engine if API key is ever exhausted or offline
function generateSmartFallback(message: string, history: Array<any> = []) {
  const query = (message || "").toLowerCase().trim();
  const historyText = (history || []).map((h) => (h.text || "").toLowerCase()).join(" ");

  if (query.includes("demo") || query.includes("schedule") || query.includes("book") || query.includes("walkthrough") || query.includes("see it")) {
    return {
      text: "We would love to show you VisionONE Access in action! You can schedule a live 30-minute tailored walkthrough with our senior solution specialists.",
      voiceText: "I would be glad to arrange a live demonstration for your team. You can pick a convenient time right here.",
      intent: "demo_request",
      suggestedQuestions: ["What happens during a demo?", "Can multiple team members join?", "What modules will be shown?"],
      cta: { type: "demo", label: "Book a Demo", description: "Schedule a tailored 30-minute walkthrough" },
    };
  }

  if (query.includes("price") || query.includes("cost") || query.includes("quote") || query.includes("licens") || query.includes("fee") || query.includes("how much")) {
    return {
      text: "VisionONE Access pricing is structured according to your company size, active modules, and implementation scope. Our team will provide a tailored quotation with transparent terms.",
      voiceText: "Pricing depends on your organization size and which modules you need. Our team can prepare a custom quote for you.",
      intent: "pricing",
      suggestedQuestions: ["Request a tailored quote", "Book a discovery call", "Explore ERP modules"],
      cta: { type: "quote", label: "Request a Quote", description: "Get a tailored proposal from our enterprise team" },
    };
  }

  if (query.includes("module") || query.includes("erp") || query.includes("features") || query.includes("what does visionone do") || query.includes("what is visionone")) {
    return {
      text: "VisionONE ERP includes five core pillars:\n1. Finance & Accounting (ledger, bank reconciliation, multi-currency)\n2. HR & Payroll (statutory deductions, biometric clock-in, self-service)\n3. Inventory & Procurement (multi-warehouse, purchase approvals)\n4. KRA eTIMS Integration (automated electronic invoicing)\n5. M-Pesa Integration (STK Push, PayBill/Till reconciliation).",
      voiceText: "Vision One E-R-P unifies Finance, H-R and Payroll, Inventory, ee-Tims tax compliance, and automated Em-Pesa reconciliation into one connected platform.",
      intent: "product_inquiry",
      suggestedQuestions: ["Tell me about HR & Payroll", "How does eTIMS work?", "Explain M-Pesa integration"],
      cta: null,
    };
  }

  if (query.includes("payroll") || query.includes("hr") || query.includes("salary") || query.includes("statutory") || query.includes("attendance") || query.includes("biometric") || query.includes("leave")) {
    return {
      text: "VisionONE HR & Payroll automates monthly statutory deductions, biometric clock-in attendance tracking, leave management, and employee self-service payslips with built-in audit controls and anomaly detection.",
      voiceText: "Our H-R and Payroll module automates statutory deductions, biometric attendance, and employee self-service with complete accuracy.",
      intent: "product_inquiry",
      suggestedQuestions: ["How does biometric clock-in connect?", "Can staff access payslips on mobile?", "Book a Payroll Demo"],
      cta: null,
    };
  }

  if (query.includes("etims") || query.includes("kra") || query.includes("tax") || query.includes("invoice") || query.includes("fiscal")) {
    return {
      text: "VisionONE Access connects directly with KRA eTIMS, enabling automated electronic invoice signing, fiscal compliance, and secure transmission without manual re-entry.",
      voiceText: "Vision One connects directly to K-R-A ee-Tims for automated invoice signing and complete tax compliance.",
      intent: "product_inquiry",
      suggestedQuestions: ["How are credit notes handled?", "Does it work with existing sales invoices?", "Book an eTIMS Walkthrough"],
      cta: null,
    };
  }

  if (query.includes("mpesa") || query.includes("m-pesa") || query.includes("payment") || query.includes("stk") || query.includes("paybill") || query.includes("till")) {
    return {
      text: "Our M-Pesa integration connects STK Push prompts, PayBill, and Till numbers directly to customer ledgers with instant receipting and automated bank reconciliation.",
      voiceText: "Our Em-Pesa integration automates S-T-K Push and Pay Bill reconciliation directly into your customer ledger.",
      intent: "product_inquiry",
      suggestedQuestions: ["Does it support automated receipting?", "How are exceptions handled?", "Explore Finance Integration"],
      cta: null,
    };
  }

  if (query.includes("finance") || query.includes("accounting") || query.includes("ledger") || query.includes("reconciliation") || query.includes("audit") || query.includes("p&l")) {
    return {
      text: "VisionONE Finance delivers full general ledger, accounts payable and receivable, automated bank reconciliation, cost centers, multi-currency support, and audit-grade internal controls.",
      voiceText: "Our finance module gives you complete accounting visibility, automated reconciliation, and executive financial reports.",
      intent: "product_inquiry",
      suggestedQuestions: ["Can it handle multi-company accounts?", "How does bank reconciliation work?", "Book a Finance Demo"],
      cta: null,
    };
  }

  if (query.includes("inventory") || query.includes("stock") || query.includes("procurement") || query.includes("warehouse") || query.includes("purchase")) {
    return {
      text: "VisionONE Inventory & Procurement tracks real-time stock levels across multiple warehouses, triggers automated reorder alerts, and routes purchase orders through approval workflows.",
      voiceText: "Vision One tracks multi-warehouse inventory in real time and automates purchase order approval workflows.",
      intent: "product_inquiry",
      suggestedQuestions: ["Does it support multi-warehouse transfers?", "How do purchase approval chains work?", "Can I see a demo?"],
      cta: null,
    };
  }

  if (query.includes("maker") || query.includes("checker") || query.includes("security") || query.includes("permission") || query.includes("role") || query.includes("control")) {
    return {
      text: "VisionONE features enterprise internal controls including segregation of duties, multi-tier maker-checker approvals for payments and journal entries, and tamper-evident audit logs.",
      voiceText: "Vision One includes maker-checker approval workflows, role-based access, and detailed audit trails for internal security.",
      intent: "product_inquiry",
      suggestedQuestions: ["How do approval thresholds work?", "Can roles be customized?", "Explore Finance & Controls"],
      cta: null,
    };
  }

  if (query.includes("construction") || query.includes("manufacturing") || query.includes("agriculture") || query.includes("distribution") || query.includes("property")) {
    return {
      text: "VisionONE Access supports industry-specific workflows, including job costing and project accounting for construction, bill of materials for manufacturing, and produce tracking for agriculture.",
      voiceText: "Vision One supports specialized workflows for manufacturing, construction, distribution, and agriculture.",
      intent: "industry_fit",
      suggestedQuestions: ["Tell me about project costing", "How does batch tracking work?", "Schedule an industry consultation"],
      cta: null,
    };
  }

  if (query.includes("yes") || query.includes("tell me more") || query.includes("sure") || query.includes("okay") || query.includes("go on") || query.includes("continue")) {
    if (historyText.includes("hr") || historyText.includes("payroll")) {
      return {
        text: "In HR & Payroll, VisionONE automates PAYE, NSSF, NHIF/SHIF, and housing levy calculations. Employees can log in via Self-Service to view payslips and request leave.",
        voiceText: "Vision One automates all statutory payroll calculations and gives your team employee self-service access.",
        intent: "product_inquiry",
        suggestedQuestions: ["How does biometric clock-in work?", "Can staff view payslips on mobile?", "Book a live demo"],
        cta: null,
      };
    }
    if (historyText.includes("etims")) {
      return {
        text: "With eTIMS, every confirmed invoice is automatically signed with a cryptographically verified fiscal code and transmitted to KRA, avoiding manual reconciliation.",
        voiceText: "Every confirmed invoice is cryptographically signed and submitted to ee-Tims without manual steps.",
        intent: "product_inquiry",
        suggestedQuestions: ["Can I see an eTIMS invoice sample?", "How does it connect to accounting?", "Schedule a demo"],
        cta: null,
      };
    }
    return {
      text: "VisionONE Access gives executives and managers complete visibility across operations, eliminating data silos between departments. Would you like to explore Finance, HR, or Operations next?",
      voiceText: "Vision One eliminates data silos across departments. Would you like to look closer at Finance, H-R, or Inventory next?",
      intent: "product_inquiry",
      suggestedQuestions: ["Explore Finance & Accounting", "Learn about HR & Payroll", "See Inventory & Procurement"],
      cta: null,
    };
  }

  if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("morning") || query.includes("afternoon")) {
    return {
      text: "Hello! Welcome to VisionONE Access. I am your intelligent guide to achieving complete business visibility across your entire organization. How can I help you today?",
      voiceText: "Hello! Welcome to Vision One Access. What operational area would you like to explore today?",
      intent: "greeting",
      suggestedQuestions: ["What modules are in VisionONE ERP?", "How does HR & Payroll work?", "Explain eTIMS tax compliance"],
      cta: null,
    };
  }

  // Dynamic context-aware default
  return {
    text: "VisionONE Access is an integrated cloud business platform unifying ERP, Finance, HR & Payroll, Inventory, and payment reconciliations into a single real-time source of truth.",
    voiceText: "Vision One Access brings complete business visibility to your operations. Which area would you like to explore?",
    intent: "product_inquiry",
    suggestedQuestions: ["What modules does VisionONE offer?", "How does M-Pesa integrate?", "Can I book a demo?"],
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

  // Try gemini-3.1-flash-lite first (active quota, fast and responsive), then fallback to gemini-3.8-flash
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
        console.log(`[Gemini SUCCESS] Model: ${model}, Response: "${parsed.text.slice(0, 60)}..."`);
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
      console.warn(`Model ${model} failed, checking next option:`, modelError?.message?.slice(0, 120));
    }
  }

  // If external AI generation is unavailable, use rich multi-domain dynamic fallback
  console.log(`[Smart Fallback] Query: "${message}"`);
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
