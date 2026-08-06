const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { sendDispatchEmail } = require('../services/emailService');
const { generateDispatchWALink } = require('../utils/whatsappDispatch');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const deliveries = db.prepare(`
    SELECT d.*, l.name as lead_name, l.phone as lead_phone, m.model_name,
      CAST((julianday('now') - julianday(d.delivered_at)) AS INTEGER) as days_since_delivery
    FROM deliveries d
    LEFT JOIN leads l ON d.lead_id = l.id
    LEFT JOIN machines m ON d.machine_id = m.id
    ORDER BY d.delivered_at DESC
  `).all();
  res.json(deliveries);
});

router.post('/', (req, res) => {
  const { lead_id, machine_id, delivered_at, notes } = req.body;
  if (!lead_id || !machine_id) return res.status(400).json({ error: 'lead_id and machine_id required' });

  const result = db.prepare(`
    INSERT INTO deliveries (lead_id, machine_id, delivered_at, notes)
    VALUES (?, ?, ?, ?)
  `).run(lead_id, machine_id, delivered_at || new Date().toISOString().split('T')[0], notes || null);

  db.prepare(`UPDATE leads SET status = 'won', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(lead_id);

  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(delivery);
});

router.put('/:id', (req, res) => {
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id);
  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

  const { installation_done, followup_7day_sent, followup_30day_sent, notes } = req.body;
  db.prepare(`
    UPDATE deliveries SET installation_done = ?, followup_7day_sent = ?, followup_30day_sent = ?, notes = ? WHERE id = ?
  `).run(
    installation_done !== undefined ? (installation_done ? 1 : 0) : delivery.installation_done,
    followup_7day_sent !== undefined ? (followup_7day_sent ? 1 : 0) : delivery.followup_7day_sent,
    followup_30day_sent !== undefined ? (followup_30day_sent ? 1 : 0) : delivery.followup_30day_sent,
    notes ?? delivery.notes,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/send-followup', (req, res) => {
  const delivery = db.prepare(`
    SELECT d.*, l.name as lead_name, l.phone as lead_phone, m.model_name
    FROM deliveries d
    LEFT JOIN leads l ON d.lead_id = l.id
    LEFT JOIN machines m ON d.machine_id = m.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

  const message = `Hi ${delivery.lead_name}, ${delivery.model_name} kaisi chal rahi hai? Koi problem toh nahi? Hum hamesha available hain. - SalesSaathi Team`;
  const waLink = `https://wa.me/91${delivery.lead_phone}?text=${encodeURIComponent(message)}`;

  res.json({ wa_link: waLink, message });
});

router.post('/:id/dispatch', async (req, res) => {
  const {
    transport_company, vehicle_number, driver_name, driver_phone,
    tracking_info, dispatch_notes, estimated_arrival_date,
    send_email, customer_email,
  } = req.body;

  const delivery = db.prepare(`
    SELECT d.*, l.name as customer_name, l.phone as customer_phone, l.email as customer_email,
           m.model_name, m.category
    FROM deliveries d
    JOIN leads l ON d.lead_id = l.id
    LEFT JOIN machines m ON d.machine_id = m.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

  await db.prepare(`
    UPDATE deliveries SET
      dispatched_at = CURRENT_TIMESTAMP,
      transport_company = ?,
      vehicle_number = ?,
      driver_name = ?,
      driver_phone = ?,
      tracking_info = ?,
      dispatch_notes = ?,
      estimated_arrival_date = ?
    WHERE id = ?
  `).run(
    transport_company, vehicle_number, driver_name, driver_phone,
    tracking_info, dispatch_notes, estimated_arrival_date, req.params.id
  );

  db.prepare("UPDATE leads SET status = 'dispatched' WHERE id = ?").run(delivery.lead_id);

  let emailSent = false;
  const emailAddress = customer_email || delivery.customer_email;

  if (send_email && emailAddress) {
    const dispatchDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const estArrival = estimated_arrival_date
      ? new Date(estimated_arrival_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : null;

    emailSent = await sendDispatchEmail({
      to: emailAddress,
      customerName: delivery.customer_name,
      machineData: {
        machineName: delivery.model_name || 'Machine',
        machineModel: delivery.model_name || '—',
        orderId: delivery.id,
      },
      dispatchData: {
        dispatchDate,
        estimatedArrival: estArrival,
        transportCompany: transport_company,
        vehicleNumber: vehicle_number,
        driverName: driver_name,
        driverPhone: driver_phone,
        trackingInfo: tracking_info,
        dispatchNotes: dispatch_notes,
      },
      businessInfo: {
        businessName: 'Clerbulk Printing Machines',
        businessPhone: '9876543210',
        businessEmail: process.env.EMAIL_FROM || 'noreply@clerbulk.com',
      },
    });

    if (emailSent) {
      db.prepare('UPDATE deliveries SET dispatch_email_sent=1, dispatch_email_sent_at=CURRENT_TIMESTAMP WHERE id=?').run(req.params.id);
    }
  }

  const waText = encodeURIComponent(
    `🚚 *Machine Dispatched!*\n\n` +
    `Dear ${delivery.customer_name},\n\n` +
    `Your *${delivery.model_name}* has been dispatched today.\n\n` +
    (transport_company ? `🚛 Transport: ${transport_company}\n` : '') +
    (vehicle_number ? `🔢 Vehicle No: ${vehicle_number}\n` : '') +
    (driver_name ? `👤 Driver: ${driver_name}\n` : '') +
    (driver_phone ? `📞 Driver Phone: ${driver_phone}\n` : '') +
    (estimated_arrival_date ? `📅 Est. Arrival: ${new Date(estimated_arrival_date).toLocaleDateString('en-IN')}\n` : '') +
    (tracking_info ? `📦 Tracking: ${tracking_info}\n` : '') +
    `\nFor any questions, please call us. Thank you!`
  );

  const waLink = `https://wa.me/91${delivery.customer_phone}?text=${waText}`;

  res.json({ success: true, emailSent, waLink });
});

router.post('/:id/whatsapp-dispatch', (req, res) => {
  const { language, transporter_phone } = req.body;

  if (!transporter_phone) {
    return res.status(400).json({ error: 'transporter_phone required' });
  }

  const delivery = db.prepare(`
    SELECT d.*, l.name AS customer_name, l.phone AS customer_phone,
           m.model_name AS machine_name
    FROM deliveries d
    JOIN leads l ON d.lead_id = l.id
    LEFT JOIN machines m ON d.machine_id = m.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

  const { waLink, previewMessage } = generateDispatchWALink({
    phone: delivery.customer_phone,
    language: language || 'hindi',
    data: {
      customerName: delivery.customer_name,
      machineName: delivery.machine_name || 'Machine',
      transporterPhone: transporter_phone,
      businessName: 'Clerbulk Printing Machines',
      businessPhone: '9876543210',
    },
  });

  db.prepare(`
    UPDATE deliveries SET
      transporter_phone = ?,
      dispatched_at = COALESCE(dispatched_at, CURRENT_TIMESTAMP),
      wa_dispatch_sent = 1,
      wa_dispatch_sent_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(transporter_phone, req.params.id);

  res.json({ success: true, waLink, previewMessage });
});

module.exports = router;
