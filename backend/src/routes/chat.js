const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt() {
  const machines = db.prepare('SELECT * FROM machines WHERE is_active = 1').all();

  const machineData = machines.map(m => {
    const specs = m.specifications ? (() => { try { return JSON.parse(m.specifications); } catch { return {}; } })() : {};
    const faqs = m.faqs ? (() => { try { return JSON.parse(m.faqs); } catch { return []; } })() : [];
    return {
      id: m.id,
      model: m.model_name,
      category: m.category,
      price: m.price,
      gst: m.gst_percent,
      price_with_gst: m.price ? Math.round(m.price * (1 + m.gst_percent / 100)) : null,
      description: m.description,
      specs,
      faqs
    };
  });

  return `You are an internal sales assistant for SalesSaathi, a manufacturer and seller of heat press and garment printing machines based in Surat, India.

You have complete knowledge of all machines in our catalog:
${JSON.stringify(machineData, null, 2)}

Answer any question a team member asks about:
- Machine prices (always mention + GST separately)
- Technical specifications (power, platen size, weight, production capacity)
- Delivery time and installation
- Warranty terms
- Which machine is best for which use case
- Comparison between models
- Payment terms we offer

Rules:
- Answer in the same language the person uses (Hindi, English, or Hinglish)
- Be concise and direct — team members are busy
- Always mention GST separately when quoting price
- If you don't know something, say "Yeh detail mujhe nahi pata, owner se confirm karo"
- Never make up prices or specs that aren't in the catalog
- Format prices in Indian format (e.g., ₹18,500 + 18% GST = ₹21,830 total)`;
}

router.post('/', async (req, res) => {
  const { message, conversation_history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    return res.status(503).json({
      error: 'API key not configured',
      message: 'Anthropic API key is not set. Please configure ANTHROPIC_API_KEY in .env file.'
    });
  }

  try {
    const systemPrompt = buildSystemPrompt();
    const messages = [
      ...conversation_history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat service error', details: err.message });
  }
});

module.exports = router;
