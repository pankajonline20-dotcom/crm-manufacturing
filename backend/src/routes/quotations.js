const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const last = db.prepare(`SELECT quote_number FROM quotations WHERE quote_number LIKE 'QT-${year}-%' ORDER BY id DESC LIMIT 1`).get();
  if (!last) return `QT-${year}-001`;
  const num = parseInt(last.quote_number.split('-')[2]) + 1;
  return `QT-${year}-${String(num).padStart(3, '0')}`;
}

router.get('/', (req, res) => {
  const { lead_id } = req.query;
  let query = `
    SELECT q.*, l.name as lead_name, l.phone as lead_phone, l.city as lead_city, u.name as agent_name
    FROM quotations q
    LEFT JOIN leads l ON q.lead_id = l.id
    LEFT JOIN users u ON q.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (lead_id) { query += ' AND q.lead_id = ?'; params.push(lead_id); }
  if (req.user.role === 'agent') { query += ' AND q.user_id = ?'; params.push(req.user.id); }

  query += ' ORDER BY q.created_at DESC';
  const quotations = db.prepare(query).all(...params);
  res.json(quotations);
});

router.get('/:id', (req, res) => {
  const quotation = db.prepare(`
    SELECT q.*, l.name as lead_name, l.phone as lead_phone, l.city as lead_city, l.email as lead_email, u.name as agent_name
    FROM quotations q
    LEFT JOIN leads l ON q.lead_id = l.id
    LEFT JOIN users u ON q.user_id = u.id
    WHERE q.id = ?
  `).get(req.params.id);

  if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
  res.json(quotation);
});

router.post('/', (req, res) => {
  const { lead_id, items, payment_terms, validity_days, notes, status } = req.body;
  if (!lead_id || !items) return res.status(400).json({ error: 'lead_id and items required' });

  const itemsArr = typeof items === 'string' ? JSON.parse(items) : items;
  let subtotal = 0;
  let gstAmount = 0;

  for (const item of itemsArr) {
    const lineTotal = item.unit_price * item.qty;
    subtotal += lineTotal;
    gstAmount += lineTotal * (item.gst / 100);
  }
  const totalAmount = subtotal + gstAmount;
  const quoteNumber = generateQuoteNumber();

  const result = db.prepare(`
    INSERT INTO quotations (lead_id, user_id, quote_number, items, subtotal, gst_amount, total_amount, payment_terms, validity_days, notes, status, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(lead_id, req.user.id, quoteNumber, JSON.stringify(itemsArr), subtotal, gstAmount, totalAmount,
    payment_terms || '50% advance, 50% on delivery', validity_days || 15, notes || null, status || 'sent');

  // Update lead status to 'quoted'
  db.prepare(`UPDATE leads SET status = 'quoted', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status NOT IN ('negotiating','won','lost')`).run(lead_id);

  // Create payment record
  db.prepare(`INSERT INTO payments (lead_id, quotation_id, amount, status) VALUES (?, ?, ?, 'pending')`).run(lead_id, result.lastInsertRowid, totalAmount);

  const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(quotation);
});

router.put('/:id', (req, res) => {
  const q = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
  if (!q) return res.status(404).json({ error: 'Quotation not found' });

  const { status, notes, payment_terms, validity_days } = req.body;
  db.prepare(`
    UPDATE quotations SET status = ?, notes = ?, payment_terms = ?, validity_days = ? WHERE id = ?
  `).run(status ?? q.status, notes ?? q.notes, payment_terms ?? q.payment_terms, validity_days ?? q.validity_days, req.params.id);

  const updated = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/generate-pdf', (req, res) => {
  const q = db.prepare(`
    SELECT q.*, l.name as lead_name, l.phone as lead_phone, l.city as lead_city, l.email as lead_email
    FROM quotations q LEFT JOIN leads l ON q.lead_id = l.id WHERE q.id = ?
  `).get(req.params.id);

  if (!q) return res.status(404).json({ error: 'Quotation not found' });

  const items = typeof q.items === 'string' ? JSON.parse(q.items) : q.items;
  const pdfDir = path.join(__dirname, '../../uploads/pdfs');
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

  const fileName = `${q.quote_number}.pdf`;
  const filePath = path.join(pdfDir, fileName);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill('#1B3A6B');
  doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('HEAT PRESS CRM', 50, 25);
  doc.fontSize(10).font('Helvetica').text('Surat, Gujarat, India | +91 98765 43210', 50, 52);
  doc.fillColor('#1B3A6B');

  // Quote info
  doc.moveDown(3);
  doc.fontSize(18).font('Helvetica-Bold').text('QUOTATION', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');

  const infoY = doc.y;
  doc.text(`Quote No: ${q.quote_number}`, 50, infoY);
  doc.text(`Date: ${new Date(q.created_at).toLocaleDateString('en-IN')}`, 50, infoY + 15);
  doc.text(`Valid for: ${q.validity_days} days`, 50, infoY + 30);

  doc.text(`To: ${q.lead_name}`, 350, infoY);
  doc.text(`Phone: +91 ${q.lead_phone}`, 350, infoY + 15);
  if (q.lead_city) doc.text(`City: ${q.lead_city}`, 350, infoY + 30);

  doc.moveDown(4);

  // Table header
  const tableTop = doc.y;
  doc.rect(50, tableTop, 495, 25).fill('#1B3A6B');
  doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
  doc.text('Machine Model', 55, tableTop + 8, { width: 200 });
  doc.text('Qty', 255, tableTop + 8, { width: 50, align: 'center' });
  doc.text('Unit Price', 305, tableTop + 8, { width: 80, align: 'right' });
  doc.text('GST%', 385, tableTop + 8, { width: 50, align: 'center' });
  doc.text('Total', 435, tableTop + 8, { width: 80, align: 'right' });
  doc.fillColor('#1B3A6B');

  // Table rows
  let rowY = tableTop + 25;
  items.forEach((item, i) => {
    const lineTotal = item.unit_price * item.qty;
    const bg = i % 2 === 0 ? '#F8FAFF' : 'white';
    doc.rect(50, rowY, 495, 22).fill(bg);
    doc.fillColor('#333').fontSize(9).font('Helvetica');
    doc.text(item.model_name, 55, rowY + 7, { width: 200 });
    doc.text(String(item.qty), 255, rowY + 7, { width: 50, align: 'center' });
    doc.text(`₹${lineTotal.toLocaleString('en-IN')}`, 305, rowY + 7, { width: 80, align: 'right' });
    doc.text(`${item.gst}%`, 385, rowY + 7, { width: 50, align: 'center' });
    const total = lineTotal + lineTotal * (item.gst / 100);
    doc.text(`₹${total.toLocaleString('en-IN')}`, 435, rowY + 7, { width: 80, align: 'right' });
    rowY += 22;
  });

  // Totals
  rowY += 10;
  doc.rect(350, rowY, 195, 22).fill('#F0F4FF');
  doc.fillColor('#333').fontSize(9).font('Helvetica');
  doc.text('Subtotal:', 355, rowY + 7);
  doc.text(`₹${q.subtotal.toLocaleString('en-IN')}`, 435, rowY + 7, { width: 80, align: 'right' });
  rowY += 22;

  doc.rect(350, rowY, 195, 22).fill('#F0F4FF');
  doc.text('GST Amount:', 355, rowY + 7);
  doc.text(`₹${q.gst_amount.toLocaleString('en-IN')}`, 435, rowY + 7, { width: 80, align: 'right' });
  rowY += 22;

  doc.rect(350, rowY, 195, 25).fill('#1B3A6B');
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
  doc.text('TOTAL AMOUNT:', 355, rowY + 8);
  doc.text(`₹${q.total_amount.toLocaleString('en-IN')}`, 435, rowY + 8, { width: 80, align: 'right' });
  doc.fillColor('#1B3A6B');

  // Terms
  rowY += 40;
  if (q.payment_terms) {
    doc.fontSize(9).font('Helvetica-Bold').text('Payment Terms:', 50, rowY);
    doc.font('Helvetica').text(q.payment_terms, 150, rowY);
    rowY += 20;
  }
  if (q.notes) {
    doc.fontSize(9).font('Helvetica-Bold').text('Notes:', 50, rowY);
    doc.font('Helvetica').text(q.notes, 150, rowY);
    rowY += 20;
  }

  // Footer
  doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill('#1B3A6B');
  doc.fillColor('white').fontSize(9).font('Helvetica')
    .text('Thank you for your business! | SalesSaathi | Surat, Gujarat', 50, doc.page.height - 32, { align: 'center' });

  doc.end();

  stream.on('finish', () => {
    const pdfUrl = `/uploads/pdfs/${fileName}`;
    db.prepare('UPDATE quotations SET pdf_url = ? WHERE id = ?').run(pdfUrl, q.id);
    res.json({ pdf_url: pdfUrl, message: 'PDF generated' });
  });
});

module.exports = router;
