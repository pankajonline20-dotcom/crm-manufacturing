const express = require('express');
const multer = require('multer');
const path = require('path');
const { db } = require('../database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const { active_only } = req.query;
  let query = `SELECT
    m.*,
    COUNT(CASE WHEN mm.media_type = 'image' THEN 1 END) as imageCount,
    COUNT(CASE WHEN mm.media_type = 'video' THEN 1 END) as videoCount,
    MIN(CASE WHEN mm.media_type = 'image' THEN mm.file_url END) as firstImage
  FROM machines m
  LEFT JOIN machine_media mm ON mm.machine_id = m.id`;
  if (active_only === 'true') query += ' WHERE m.is_active = 1';
  query += ' GROUP BY m.id ORDER BY m.model_name ASC';
  const machines = db.prepare(query).all();
  res.json(machines);
});

router.get('/:id/full', (req, res) => {
  const machine = db.prepare(`
    SELECT
      m.*,
      COUNT(CASE WHEN mm.media_type = 'image' THEN 1 END) as imageCount,
      COUNT(CASE WHEN mm.media_type = 'video' THEN 1 END) as videoCount
    FROM machines m
    LEFT JOIN machine_media mm ON mm.machine_id = m.id
    WHERE m.id = ?
    GROUP BY m.id
  `).get(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const media = db.prepare(`
    SELECT id, file_name, file_url, media_type, uploaded_at
    FROM machine_media
    WHERE machine_id = ?
    ORDER BY media_type DESC, uploaded_at ASC
  `).all(req.params.id);

  let faqs = [];
  try {
    faqs = JSON.parse(machine.faqs || '[]');
  } catch {}

  let specs = {};
  try {
    specs = JSON.parse(machine.specifications || '{}');
  } catch {}

  res.json({ ...machine, media, faqs, specs });
});

router.get('/:id', (req, res) => {
  const machine = db.prepare(`
    SELECT
      m.*,
      COUNT(CASE WHEN mm.media_type = 'image' THEN 1 END) as imageCount,
      COUNT(CASE WHEN mm.media_type = 'video' THEN 1 END) as videoCount
    FROM machines m
    LEFT JOIN machine_media mm ON mm.machine_id = m.id
    WHERE m.id = ?
    GROUP BY m.id
  `).get(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const media = db.prepare('SELECT * FROM machine_media WHERE machine_id = ? ORDER BY uploaded_at DESC').all(req.params.id);
  res.json({ ...machine, media });
});

router.post('/', adminOnly, (req, res) => {
  const { model_name, category, price, gst_percent, description, specifications, faqs } = req.body;
  if (!model_name) return res.status(400).json({ error: 'Model name required' });

  const result = db.prepare(`
    INSERT INTO machines (model_name, category, price, gst_percent, description, specifications, faqs)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    model_name, category || null, price || null, gst_percent || 18,
    description || null,
    typeof specifications === 'object' ? JSON.stringify(specifications) : specifications || null,
    typeof faqs === 'object' ? JSON.stringify(faqs) : faqs || null
  );

  const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(machine);
});

router.put('/:id', adminOnly, (req, res) => {
  const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const { model_name, category, price, gst_percent, description, specifications, faqs, is_active } = req.body;

  db.prepare(`
    UPDATE machines SET
      model_name = ?, category = ?, price = ?, gst_percent = ?,
      description = ?, specifications = ?, faqs = ?, is_active = ?
    WHERE id = ?
  `).run(
    model_name ?? machine.model_name, category ?? machine.category,
    price ?? machine.price, gst_percent ?? machine.gst_percent,
    description ?? machine.description,
    typeof specifications === 'object' ? JSON.stringify(specifications) : (specifications ?? machine.specifications),
    typeof faqs === 'object' ? JSON.stringify(faqs) : (faqs ?? machine.faqs),
    is_active !== undefined ? (is_active ? 1 : 0) : machine.is_active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/media', adminOnly, upload.array('files', 20), (req, res) => {
  const machine = db.prepare('SELECT id FROM machines WHERE id = ?').get(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const insertMedia = db.prepare(`
    INSERT INTO machine_media (machine_id, file_name, file_url, media_type)
    VALUES (?, ?, ?, ?)
  `);

  const uploaded = req.files.map(file => {
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    const fileUrl = `/uploads/${file.filename}`;
    insertMedia.run(req.params.id, file.originalname, fileUrl, mediaType);
    return { file_name: file.originalname, file_url: fileUrl, media_type: mediaType };
  });

  res.json(uploaded);
});

router.delete('/:machineId/media/:mediaId', adminOnly, (req, res) => {
  db.prepare('DELETE FROM machine_media WHERE id = ? AND machine_id = ?').run(req.params.mediaId, req.params.machineId);
  res.json({ message: 'Media deleted' });
});

router.post('/:id/whatsapp-message', (req, res) => {
  const { lead_id, language = 'hindi', include_faqs = false } = req.body;

  const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const media = db.prepare(`
    SELECT file_name, file_url, media_type
    FROM machine_media WHERE machine_id = ?
    ORDER BY media_type DESC, uploaded_at ASC
  `).all(req.params.id);

  const lead = db.prepare('SELECT name, phone FROM leads WHERE id = ?').get(lead_id);
  if (!lead) return res.status(404).json({ error: 'Customer not found' });

  const settings = db.prepare('SELECT * FROM settings LIMIT 1').get() || {};

  let specs = {};
  try { specs = JSON.parse(machine.specifications || '{}'); } catch {}

  let faqs = [];
  try { faqs = JSON.parse(machine.faqs || '[]'); } catch {}

  const specLines = Object.entries(specs)
    .filter(([, v]) => v)
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `• ${label}: *${v}*`;
    })
    .join('\n');

  const images = media.filter(m => m.media_type === 'image');
  const videos = media.filter(m => m.media_type === 'video');

  const price = machine.price
    ? `₹${Number(machine.price).toLocaleString('en-IN')} + GST`
    : 'Price on request';

  const faqText = include_faqs && faqs.length > 0
    ? '\n\n❓ *Frequently Asked Questions:*\n' +
      faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
    : '';

  let message = '';

  if (language === 'english') {
    const parts = [
      `Hello *${lead.name}*! 👋`,
      ``,
      `Here are the details for *${machine.model_name}*:`,
      ``,
      `💰 *Price:* ${price}`,
      machine.category ? `📋 *Category:* ${machine.category}` : null,
      machine.description ? `\n📝 ${machine.description}` : null,
      specLines ? `\n⚙️ *Specifications:*\n${specLines}` : null,
      faqText || null,
      ``,
      images.length > 0 || videos.length > 0
        ? [
            `🖼️ *Photos & Videos:*`,
            images.length > 0 ? `📸 ${images.length} photo${images.length > 1 ? 's' : ''} attached` : null,
            videos.length > 0 ? `🎥 ${videos.length} video${videos.length > 1 ? 's' : ''} attached` : null,
          ].filter(Boolean).join('\n')
        : null,
      ``,
      `For orders or queries:`,
      `📞 *${settings.phone || ''}*`,
      `— *${settings.business_name || 'Clerbulk Printing Machines'}*`,
    ];
    message = parts.filter(v => v !== null).join('\n');
  } else {
    const parts = [
      `Namaste *${lead.name}* ji! 🙏`,
      ``,
      `*${machine.model_name}* ki poori details:`,
      ``,
      `💰 *Price:* ${price}`,
      machine.category ? `📋 *Category:* ${machine.category}` : null,
      machine.description ? `\n📝 ${machine.description}` : null,
      specLines ? `\n⚙️ *Specifications:*\n${specLines}` : null,
      faqText || null,
      ``,
      images.length > 0 || videos.length > 0
        ? [
            `🖼️ *Photos aur Videos:*`,
            images.length > 0 ? `📸 ${images.length} photo${images.length > 1 ? 's' : ''} attach ki hain` : null,
            videos.length > 0 ? `🎥 ${videos.length} video${videos.length > 1 ? 's' : ''} attach ki hain` : null,
          ].filter(Boolean).join('\n')
        : null,
      ``,
      `Order ya sawaal ke liye call karein:`,
      `📞 *${settings.phone || ''}*`,
      `— *${settings.business_name || 'Clerbulk Printing Machines'}*`,
    ];
    message = parts.filter(v => v !== null).join('\n');
  }

  const cleanMessage = message.replace(/\n{3,}/g, '\n\n').trim();

  const cleanPhone = lead.phone
    .replace(/[\s\-\+]/g, '')
    .replace(/^91/, '')
    .replace(/^0/, '');

  const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(cleanMessage)}`;

  db.prepare(`
    INSERT INTO call_logs (lead_id, user_id, notes, called_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(lead_id, req.user.id,
    `Product shared on WhatsApp: ${machine.model_name} (${images.length} photos, ${videos.length} videos)`
  );

  res.json({
    success: true,
    waLink,
    message: cleanMessage,
    mediaUrls: media.map(m => ({ url: m.file_url, type: m.media_type, name: m.file_name })),
    imageCount: images.length,
    videoCount: videos.length,
  });
});

router.post('/:id/whatsapp-share', (req, res) => {
  const { lead_id, language = 'hindi' } = req.body;

  const machine = db.prepare(`
    SELECT m.*, GROUP_CONCAT(mm.file_name, '|||') as media_files,
           GROUP_CONCAT(mm.media_type, '|||') as media_types
    FROM machines m
    LEFT JOIN machine_media mm ON mm.machine_id = m.id
    WHERE m.id = ?
    GROUP BY m.id
  `).get(req.params.id);

  if (!machine) return res.status(404).json({ error: 'Machine not found' });

  const lead = db.prepare('SELECT name, phone FROM leads WHERE id = ?').get(lead_id);
  if (!lead) return res.status(404).json({ error: 'Customer not found' });

  const settings = db.prepare('SELECT * FROM settings LIMIT 1').get() || {};

  let specsText = '';
  try {
    const specs = JSON.parse(machine.specifications || '{}');
    specsText = Object.entries(specs)
      .filter(([, v]) => v)
      .map(([k, v]) => `• ${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${v}`)
      .join('\n');
  } catch {
    specsText = '—';
  }

  const mediaFiles = machine.media_files ? machine.media_files.split('|||') : [];
  const mediaTypes = machine.media_types ? machine.media_types.split('|||') : [];
  const imageCount = mediaTypes.filter(t => t === 'image').length;
  const videoCount = mediaTypes.filter(t => t === 'video').length;

  let mediaListText = '';
  if (imageCount > 0) mediaListText += `📸 ${imageCount} photo${imageCount > 1 ? 's' : ''}\n`;
  if (videoCount > 0) mediaListText += `🎥 ${videoCount} video${videoCount > 1 ? 's' : ''}\n`;
  if (!mediaListText) mediaListText = 'Media available on request';
  else mediaListText += '(Neeche attach kar rahe hain / Attaching below)';

  const price = machine.price
    ? `₹${Number(machine.price).toLocaleString('en-IN')}`
    : 'Price on request';

  let message = '';

  if (language === 'english') {
    message = `Hello *${lead.name}*! 👋

Here are the complete details for *${machine.model_name}*:

💰 *Price:* ${price} + GST (${machine.gst_percent || 18}%)
📋 *Category:* ${machine.category || '—'}${specsText ? `\n\n⚙️ *Specifications:*\n${specsText}` : ''}${machine.description ? `\n\n📝 *Description:*\n${machine.description}` : ''}

🖼️ *Photos & Videos:*
${mediaListText}

For more info or to place an order, call us:
📞 *${settings.phone || ''}*
— *${settings.business_name || 'Clerbulk Printing Machines'}*`;
  } else {
    message = `Namaste *${lead.name}* ji! 🙏

*${machine.model_name}* ki poori details yahan hai:

💰 *Price:* ${price} + GST (${machine.gst_percent || 18}%)
📋 *Category:* ${machine.category || '—'}${specsText ? `\n\n⚙️ *Specifications:*\n${specsText}` : ''}${machine.description ? `\n\n📝 *Description:*\n${machine.description}` : ''}

🖼️ *Photos aur Videos:*
${mediaListText}

Zyada jaankari ya order ke liye call karein:
📞 *${settings.phone || ''}*
— *${settings.business_name || 'Clerbulk Printing Machines'}*`;
  }

  const cleanPhone = lead.phone.replace(/[\s\-\+]/g, '').replace(/^91/, '').replace(/^0/, '');
  const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message.trim())}`;

  db.prepare(`
    INSERT INTO call_logs (lead_id, user_id, notes, called_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(lead_id, req.user.id, `Catalogue shared: ${machine.model_name} sent via WhatsApp`);

  res.json({
    success: true,
    waLink,
    previewMessage: message.trim(),
    mediaCount: { images: imageCount, videos: videoCount },
    customerName: lead.name,
    customerPhone: lead.phone,
  });
});

router.delete('/:id', adminOnly, (req, res) => {
  try {
    const machine = db.prepare('SELECT id FROM machines WHERE id = ?').get(req.params.id);
    if (!machine) return res.status(404).json({ error: 'Machine not found' });

    // Delete in order of dependencies
    db.prepare('DELETE FROM machine_media WHERE machine_id = ?').run(req.params.id);
    db.prepare('DELETE FROM deliveries WHERE machine_id = ?').run(req.params.id);
    db.prepare('DELETE FROM knowledge_base WHERE machine_id = ?').run(req.params.id);
    db.prepare('DELETE FROM machines WHERE id = ?').run(req.params.id);

    res.json({ success: true, message: 'Machine deleted' });
  } catch (err) {
    console.error('Delete machine error:', err);
    res.status(500).json({ error: 'Failed to delete machine: ' + err.message });
  }
});

module.exports = router;
