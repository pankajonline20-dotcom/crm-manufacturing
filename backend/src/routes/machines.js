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
  let query = 'SELECT * FROM machines';
  if (active_only === 'true') query += ' WHERE is_active = 1';
  query += ' ORDER BY model_name ASC';
  const machines = db.prepare(query).all();
  res.json(machines);
});

router.get('/:id', (req, res) => {
  const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id);
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

module.exports = router;
