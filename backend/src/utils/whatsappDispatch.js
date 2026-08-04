function generateDispatchWALink({ phone, language = 'hindi', data }) {
  const { customerName, machineName, transporterPhone, businessName, businessPhone } = data;

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  let message = '';

  if (language === 'english') {
    message = `🚚 *Machine Dispatched!*

Dear *${customerName}*,

Your *${machineName}* has been dispatched today.

📅 *Date:* ${today}
🚛 *Transporter:* ${transporterPhone}

Bilty and machine photos are attached below.

For any queries, call us:
📞 *${businessPhone}*
— *${businessName}*`;
  } else {
    // Hindi (default)
    message = `🚚 *Machine Dispatch Ho Gayi!*

*${customerName}* ji,

Aapki *${machineName}* aaj dispatch ho gayi hai.

📅 *Date:* ${today}
🚛 *Transporter:* ${transporterPhone}

Bilty aur machine ki photo neeche attach kar rahe hain.

Koi sawaal ho toh call karein.
📞 *${businessPhone}*
— *${businessName}*`;
  }

  const cleanPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '').replace(/^0/, '');
  const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message.trim())}`;

  return { waLink, previewMessage: message.trim() };
}

module.exports = { generateDispatchWALink };
