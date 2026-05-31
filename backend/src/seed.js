const bcrypt = require('bcryptjs');
const { db } = require('./database');

async function seedDatabase() {
  try {
    const existingAdmin = await db.prepare('SELECT id FROM users WHERE email = ?').get('admin@heatpresscrm.com');
    if (existingAdmin) {
      console.log('Database already seeded.');
      return;
    }

    // Users
    const adminHash = bcrypt.hashSync('admin123', 10);
    const agentHash = bcrypt.hashSync('agent123', 10);

    await db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`).run('Pankaj Mehta', 'admin@heatpresscrm.com', adminHash, 'admin');
    await db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`).run('Rahul Shah', 'rahul@heatpresscrm.com', agentHash, 'agent');
    await db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`).run('Priya Patel', 'priya@heatpresscrm.com', agentHash, 'agent');

    // Machines
    const machines = [
      {
        model_name: 'T-500 Swing Away',
        category: 'T-Shirt Heat Press',
        price: 18500,
        gst_percent: 18,
        description: 'Professional swing-away heat press machine for T-shirts. Ideal for startups and home businesses.',
        specifications: JSON.stringify({
          power: '1800W',
          platen_size: '38cm x 38cm',
          weight: '18 kg',
          warranty: '1 Year',
          delivery_days: '5-7 days',
          temperature_range: '0-250°C',
          timer: '0-999 seconds'
        }),
        faqs: JSON.stringify([
          { question: 'T-500 kitni T-shirts per hour press kar sakta hai?', answer: '60-80 T-shirts per hour' },
          { question: 'Iska power consumption kitna hai?', answer: '1800W, approximately 1.5-2 units per hour' },
          { question: 'Kya isme mug printing ho sakti hai?', answer: 'Nahi, yeh sirf flat surfaces ke liye hai. Mug ke liye Mug Press lena padega.' }
        ])
      },
      {
        model_name: 'T-800 Clamshell Pro',
        category: 'T-Shirt Heat Press',
        price: 24500,
        gst_percent: 18,
        description: 'Heavy-duty clamshell heat press with digital controls. For medium volume production.',
        specifications: JSON.stringify({
          power: '2200W',
          platen_size: '40cm x 50cm',
          weight: '22 kg',
          warranty: '2 Years',
          delivery_days: '5-7 days',
          temperature_range: '0-280°C',
          timer: '0-999 seconds'
        }),
        faqs: JSON.stringify([
          { question: 'T-800 aur T-500 mein kya difference hai?', answer: 'T-800 mein bada platen (40x50) aur 2 saal ki warranty hai. Production volume bhi zyada hai.' },
          { question: 'Installation ke liye koi technician chahiye?', answer: 'Nahi, plug and play hai. Sirf power connection chahiye.' }
        ])
      },
      {
        model_name: 'MG-100 Mug Press',
        category: 'Mug Press',
        price: 8500,
        gst_percent: 18,
        description: 'Dedicated mug sublimation press. Compatible with 11oz and 15oz mugs.',
        specifications: JSON.stringify({
          power: '350W',
          platen_size: '11oz / 15oz mugs',
          weight: '3.5 kg',
          warranty: '1 Year',
          delivery_days: '3-5 days',
          temperature_range: '150-230°C',
          timer: '0-999 seconds'
        }),
        faqs: JSON.stringify([
          { question: 'Konse mugs compatible hain?', answer: '11oz aur 15oz standard sublimation mugs' },
          { question: 'Per mug printing time kitna hai?', answer: 'Approximately 3-4 minutes at 200°C' }
        ])
      },
      {
        model_name: 'CAP-200 Cap Press',
        category: 'Cap Press',
        price: 12000,
        gst_percent: 18,
        description: 'Curved platen cap press for hats and caps. Professional grade.',
        specifications: JSON.stringify({
          power: '900W',
          platen_size: 'Curved 6cm x 11cm',
          weight: '6 kg',
          warranty: '1 Year',
          delivery_days: '5-7 days',
          temperature_range: '0-250°C',
          timer: '0-999 seconds'
        }),
        faqs: JSON.stringify([
          { question: 'Kitne types ke caps isme fit hote hain?', answer: 'Standard baseball caps, trucker caps aur most structured hats' },
          { question: 'Sublimation aur HTV dono ho sakta hai?', answer: 'Haan, dono methods support karta hai' }
        ])
      },
      {
        model_name: 'X-1000 Combo Press',
        category: 'Combo Press',
        price: 45000,
        gst_percent: 18,
        description: '5-in-1 combo heat press: flat platen, mug, cap, plate, and hat. Best value for new businesses.',
        specifications: JSON.stringify({
          power: '1800W',
          platen_size: '38cm x 38cm (flat), + 4 attachments',
          weight: '25 kg',
          warranty: '2 Years',
          delivery_days: '7-10 days',
          temperature_range: '0-250°C',
          timer: '0-999 seconds'
        }),
        faqs: JSON.stringify([
          { question: 'X-1000 mein 5 attachments kya kya hain?', answer: 'Flat platen (T-shirt), mug press, cap press, plate press, hat press' },
          { question: 'Kya ek baar mein sirf ek hi attachment use ho sakti hai?', answer: 'Haan, ek baar mein ek. Swap karne mein 2-3 minute lagte hain.' },
          { question: 'Delivery ke saath installation bhi milti hai?', answer: 'Haan, Surat aur nearby areas mein free installation hai.' }
        ])
      }
    ];

    for (const m of machines) {
      await db.prepare(`
        INSERT INTO machines (model_name, category, price, gst_percent, description, specifications, faqs)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(m.model_name, m.category, m.price, m.gst_percent, m.description, m.specifications, m.faqs);
    }

    // Leads
    const leads = [
      {
        name: 'Kaushik Chaudhary',
        phone: '9876543210',
        email: 'kaushik@gmail.com',
        city: 'Surat',
        source: 'facebook',
        requirement: 'T-shirt printing business shuru karna hai. 2 machines chahiye.',
        status: 'interested',
        assigned_to: 1,
        next_followup_date: new Date().toISOString().split('T')[0]
      },
      {
        name: 'Snehal Patel',
        phone: '9123456780',
        email: 'snehal@business.com',
        city: 'Valsad',
        source: 'whatsapp',
        requirement: 'Mug printing ke liye machine chahiye. Budget 10k ke andar.',
        status: 'quoted',
        assigned_to: 2,
        next_followup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      },
      {
        name: 'Ramdev Enterprises',
        phone: '9988776655',
        email: null,
        city: 'Rajkot',
        source: 'indiamart',
        requirement: 'Bulk order - 5 T-shirt press machines for factory',
        status: 'negotiating',
        assigned_to: 1,
        next_followup_date: new Date(Date.now() + 172800000).toISOString().split('T')[0]
      },
      {
        name: 'Priya Boutique',
        phone: '9765432100',
        email: 'priya.boutique@gmail.com',
        city: 'Ahmedabad',
        source: 'referral',
        requirement: 'Combo machine chahiye. Mugs aur caps dono.',
        status: 'new',
        assigned_to: 3,
        next_followup_date: new Date().toISOString().split('T')[0]
      },
      {
        name: 'GD Goenka Sports',
        phone: '9871234560',
        email: 'gd@gdgoenka.com',
        city: 'Mumbai',
        source: 'facebook',
        requirement: 'Sports jersey printing. High volume. Need best machine.',
        status: 'won',
        assigned_to: 2,
        next_followup_date: null
      }
    ];

    for (const l of leads) {
      await db.prepare(`
        INSERT INTO leads (name, phone, email, city, source, requirement, status, assigned_to, next_followup_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(l.name, l.phone, l.email, l.city, l.source, l.requirement, l.status, l.assigned_to, l.next_followup_date);
    }

    // Call logs
    await db.prepare(`INSERT INTO call_logs (lead_id, user_id, notes, duration_minutes) VALUES (1, 1, 'Customer interested in T-500 aur T-800. Budget around 40k for 2 machines. Will call back Thursday.', 8)`).run();
    await db.prepare(`INSERT INTO call_logs (lead_id, user_id, notes, duration_minutes) VALUES (2, 2, 'Sent MG-100 quote. Customer comparing with another supplier. Follow up Friday.', 5)`).run();
    await db.prepare(`INSERT INTO call_logs (lead_id, user_id, notes, duration_minutes) VALUES (3, 1, 'Bulk order of 5 units T-800. Negotiating on price. Asking for 10% discount.', 15)`).run();

    // Sample quotation
    const quoteItems = JSON.stringify([
      { machine_id: 1, model_name: 'T-500 Swing Away', qty: 2, unit_price: 18500, gst: 18 }
    ]);
    const subtotal = 37000;
    const gstAmount = 37000 * 0.18;
    const total = subtotal + gstAmount;

    await db.prepare(`
      INSERT INTO quotations (lead_id, user_id, quote_number, items, subtotal, gst_amount, total_amount, payment_terms, validity_days, notes, status)
      VALUES (1, 1, 'QT-2025-001', ?, ?, ?, ?, '50% advance, 50% on delivery', 15, 'Free installation in Surat', 'sent')
    `).run(quoteItems, subtotal, gstAmount, total);

    // Sample delivery
    await db.prepare(`
      INSERT INTO deliveries (lead_id, machine_id, delivered_at, installation_done)
      VALUES (5, 2, '2025-12-20', 1)
    `).run();

    // Sample payment
    await db.prepare(`
      INSERT INTO payments (lead_id, quotation_id, amount, payment_date, mode, status, notes)
      VALUES (1, 1, ?, null, null, 'pending', 'Awaiting 50% advance payment')
    `).run(total);

    console.log('Database seeded successfully!');
    console.log('Admin login: admin@heatpresscrm.com / admin123');
    console.log('Agent login: rahul@heatpresscrm.com / agent123');
  } catch (err) {
    console.error('Seeding error:', err.message);
    throw err;
  }
}

module.exports = { seedDatabase };
