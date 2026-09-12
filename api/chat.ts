import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

const SYSTEM_INSTRUCTION = `You are the VisionONE Access AI Assistant.
You represent VisionONE Access, an enterprise business management platform.
Tagline: "Your intelligent guide to complete business visibility."
Core message: "One Platform. Complete Business Visibility."

PERSONALITY & TONE:
- Human, warm, professional, concise, confident, consultative, helpful.
- Avoid robotic repetition and excessive corporate jargon.
- Voice response style: The "voiceText" field MUST be short (1-2 natural spoken sentences, conversational, warm, no markdown, no URLs, no bullet lists).

CRITICAL ANTI-REPETITION RULES:
- Never repeat the same question or closing prompt on consecutive turns.
- Do NOT repeatedly ask "Would you like to book a quick demo?" on every turn. Only suggest a demo when the user asks for one, asks about pricing, or expresses clear interest in seeing the system.
- Directly answer the user's specific question first.

CORE PRODUCT KNOWLEDGE:
- ERP: Connected business management platform bringing core operations together.
- FINANCE & ACCOUNTING: Accounting, financial reporting, bank reconciliation, cost centres, audit trails.
- HR & PAYROLL: Employee records, payroll, leave, attendance, statutory payroll, Employee Self-Service, biometric attendance.
- INVENTORY & PROCUREMENT: Procurement, stock management, purchasing workflows, multi-warehouse tracking.
- eTIMS: Electronic invoicing and business workflows around KRA eTIMS.
- M-PESA INTEGRATION: STK Push, PayBill, Till payment capture, validation, receipting, reconciliation.
- INTERNAL CONTROLS: Role-based access, maker-checker workflows.

LEAD QUALIFICATION & SALES INTENT:
- When a visitor expresses interest, ask ONE qualifying question at a time.
- Pricing rule: State that pricing is tailored based on organization requirements and users.
- Unknown info rule: Never hallucinate prices, specs, or legal guarantees.

Always return a valid JSON object matching the schema.`;

function generateSmartFallback(message: string) {
  const query = (message || '').toLowerCase();
  
  if (query.includes('demo') || query.includes('schedule') || query.includes('book')) {
    return {
      text: 'We would be delighted to show you VisionONE Access in action! You can schedule a live demonstration with our senior solution specialists.',
      voiceText: "I'd be glad to arrange a live demonstration for your team. You can pick a convenient time right here.",
      intent: 'demo_request',
      suggestedQuestions: ['What happens during a demo?', 'What modules will be shown?', 'Can my team join?'],
      cta: { type: 'demo', label: 'Book a Demo', description: 'Schedule a 30-minute tailored walkthrough' },
    };
  }

  if (query.includes('price') || query.includes('cost') || query.includes('quote')) {
    return {
      text: 'VisionONE Access pricing is tailored based on your organization size, active modules, and implementation scope. Our team will prepare a clear quotation for you.',
      voiceText: 'Pricing depends on the modules you need and your organization scale. We can prepare a customized quote for you.',
      intent: 'pricing',
      suggestedQuestions: ['Request a custom quote', 'Book a discovery call', 'Explore ERP modules'],
      cta: { type: 'quote', label: 'Request a Quote', description: 'Get a tailored proposal from our team' },
    };
  }

  if (query.includes('payroll') || query.includes('hr') || query.includes('salary')) {
    return {
      text: 'VisionONE HR & Payroll automates statutory deductions, biometric clock-in attendance, leave workflows, employee self-service, and anomaly detection.',
      voiceText: 'VisionONE HR and Payroll streamlines your entire workforce management, statutory compliance, and biometric attendance.',
      intent: 'product_inquiry',
      suggestedQuestions: ['How does biometric clock-in work?', 'Does it support Employee Self-Service?', 'Book a Payroll Demo'],
      cta: null,
    };
  }

  if (query.includes('etims') || query.includes('kra') || query.includes('tax')) {
    return {
      text: 'VisionONE Access integrates directly with KRA eTIMS, enabling automated electronic tax invoice signing, fiscal compliance, and secure transmission.',
      voiceText: 'VisionONE connects with KRA eTIMS for seamless automated invoice signing and complete tax compliance.',
      intent: 'product_inquiry',
      suggestedQuestions: ['How does eTIMS signing work?', 'Can it handle credit notes?', 'Book an eTIMS Walkthrough'],
      cta: null,
    };
  }

  if (query.includes('mpesa') || query.includes('m-pesa') || query.includes('payment')) {
    return {
      text: 'Our M-Pesa integration automates STK Push prompt requests, PayBill and Till payment matching, real-time receipting, and automated bank reconciliation.',
      voiceText: 'Our M-Pesa integration connects STK Push, PayBills, and Tills directly to customer accounts and reconciliations.',
      intent: 'product_inquiry',
      suggestedQuestions: ['Does it support automatic receipting?', 'How are unmatched payments handled?', 'Explore Finance Integration'],
      cta: null,
    };
  }

  if (query.includes('finance') || query.includes('accounting') || query.includes('ledger')) {
    return {
      text: 'VisionONE Finance delivers full general ledger, accounts payable and receivable, bank reconciliation, multi-currency support, and audit-grade internal controls.',
      voiceText: 'Our finance suite gives you complete accounting visibility, automated reconciliation, and executive financial reporting.',
      intent: 'product_inquiry',
      suggestedQuestions: ['How does bank reconciliation work?', 'Can it handle multi-currency?', 'Book a Finance Demo'],
      cta: null,
    };
  }

  return {
    text: 'VisionONE Access unifies ERP, Finance, HR & Payroll, Inventory, and payment workflows into one reliable platform designed for complete business visibility.',
    voiceText: 'VisionONE Access brings complete visibility across your core business operations. Which area would you like to focus on?',
    intent: 'product_inquiry',
    suggestedQuestions: ['Explore ERP Modules', 'How does M-Pesa integrate?', 'Request a consultation'],
    cta: null,
  };
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Security-Policy', 'frame-ancestors *;');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message required.' });
    }

    const ai = getGeminiClient();
    const conversationContext = (history || [])
      .slice(-6)
      .map((m: any) => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.text}`)
      .join('\n');

    const prompt = `Current conversation history:
${conversationContext}

Latest USER message: "${message}"

Respond with a JSON object with:
- "text": string (crisp transcript answer, 1-3 sentences)
- "voiceText": string (ultra-short spoken response, 1-2 natural spoken sentences, conversational, warm, no markdown)
- "intent": string ("greeting" | "product_inquiry" | "pricing" | "lead_qualification" | "demo_request" | "industry_fit" | "unknown")
- "suggestedQuestions": array of 2-3 short strings relevant to the conversation
- "cta": optional object with {"type": "demo"|"contact"|"quote", "label": string, "description": string} or null`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            voiceText: { type: Type.STRING },
            intent: { type: Type.STRING },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
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
          required: ['text', 'voiceText', 'intent', 'suggestedQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.status(200).json({
      text: parsed.text || 'VisionONE Access provides complete business visibility.',
      voiceText: parsed.voiceText || 'VisionONE Access unites your core operations in one platform.',
      intent: parsed.intent || 'product_inquiry',
      suggestedQuestions: parsed.suggestedQuestions || ['Explore ERP modules', 'Learn about HR & Payroll', 'Book a Demo'],
      cta: parsed.cta || null,
    });
  } catch (error: any) {
    console.warn('Fallback in api/chat handler:', error?.message);
    const fallback = generateSmartFallback(req.body?.message || '');
    return res.status(200).json(fallback);
  }
}
