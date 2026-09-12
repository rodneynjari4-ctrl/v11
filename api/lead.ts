import type { Request, Response } from 'express';

const leadsStore: any[] = [];

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { name, email, phone, companyName, industry, employeeCount, modulesInterested, notes } = req.body || {};
    if (!name || (!email && !phone)) {
      return res.status(400).json({ error: 'Name and at least one contact method (email or phone) are required.' });
    }

    const lead = {
      id: 'lead_' + Date.now(),
      name,
      email,
      phone,
      companyName,
      industry: industry || 'General',
      employeeCount: employeeCount || '10-50',
      modulesInterested: modulesInterested || [],
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    leadsStore.push(lead);

    return res.status(200).json({
      success: true,
      message: 'Thank you! A VisionONE business consultant will be in touch with you shortly.',
      leadId: lead.id,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record lead.' });
  }
}
