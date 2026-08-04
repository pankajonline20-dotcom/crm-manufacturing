const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password',
  },
});

function generateDispatchEmailHTML(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; background: #F4F5F7; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #1B3A6B; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .header p { color: #93C5FD; margin: 8px 0 0; font-size: 14px; }
    .badge { background: #10B981; color: #fff; padding: 6px 20px; border-radius: 20px; font-size: 13px; font-weight: 700; display: inline-block; margin-top: 12px; }
    .content { padding: 32px; }
    .greeting { font-size: 16px; color: #111827; margin-bottom: 20px; line-height: 1.6; }
    .info-box { background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6B7280; font-weight: 500; }
    .info-value { color: #111827; font-weight: 600; text-align: right; }
    .machine-box { background: #EEF2FF; border-left: 4px solid #1B3A6B; padding: 16px 20px; border-radius: 0 12px 12px 0; margin: 20px 0; }
    .machine-name { font-size: 18px; font-weight: 700; color: #1B3A6B; }
    .machine-model { font-size: 13px; color: #6B7280; margin-top: 4px; }
    .driver-box { background: #E1F5EE; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .driver-title { font-size: 12px; font-weight: 700; color: #0F6E56; margin-bottom: 8px; }
    .driver-name { font-size: 15px; font-weight: 700; color: #111827; }
    .driver-phone { font-size: 14px; color: #0F6E56; margin-top: 4px; }
    .note-box { background: #FAEEDA; border-radius: 12px; padding: 16px 20px; margin: 20px 0; font-size: 14px; color: #374151; line-height: 1.6; }
    .footer { background: #1B3A6B; padding: 24px; text-align: center; }
    .footer p { color: #93C5FD; font-size: 12px; margin: 4px 0; }
    .footer .company { color: #fff; font-size: 15px; font-weight: 700; margin-bottom: 8px; }
    .cta { background: #E8500A; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚚 Machine Dispatched!</h1>
      <p>Your order is on its way</p>
      <span class="badge">✓ OUT FOR DELIVERY</span>
    </div>

    <div class="content">
      <p class="greeting">
        Dear <strong>${data.customerName}</strong>,<br><br>
        Great news! Your machine has been dispatched from our factory today.
        Please find the complete dispatch details below.
      </p>

      <div class="machine-box">
        <div class="machine-name">${data.machineName}</div>
        <div class="machine-model">Model: ${data.machineModel} &nbsp;·&nbsp; Order: #${data.orderId}</div>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Dispatch Date</span>
          <span class="info-value">${data.dispatchDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Estimated Arrival</span>
          <span class="info-value">${data.estimatedArrival || 'Will be confirmed'}</span>
        </div>
        ${data.transportCompany ? `
        <div class="info-row">
          <span class="info-label">Transport Company</span>
          <span class="info-value">${data.transportCompany}</span>
        </div>` : ''}
        ${data.vehicleNumber ? `
        <div class="info-row">
          <span class="info-label">Vehicle Number</span>
          <span class="info-value">${data.vehicleNumber}</span>
        </div>` : ''}
        ${data.trackingInfo ? `
        <div class="info-row">
          <span class="info-label">Tracking Info</span>
          <span class="info-value">${data.trackingInfo}</span>
        </div>` : ''}
      </div>

      ${data.driverName ? `
      <div class="driver-box">
        <div class="driver-title">🚛 DELIVERY CONTACT</div>
        <div class="driver-name">${data.driverName}</div>
        <div class="driver-phone">📞 ${data.driverPhone || 'Will be shared'}</div>
      </div>` : ''}

      ${data.dispatchNotes ? `
      <div class="note-box">
        <strong>Note from our team:</strong><br>
        ${data.dispatchNotes}
      </div>` : ''}

      <p style="font-size: 14px; color: #6B7280; line-height: 1.6;">
        Please ensure someone is available at the delivery address to receive the machine.
        For any questions, contact us anytime.
      </p>

      <div style="text-align: center;">
        <a href="tel:+91${data.businessPhone}" class="cta">📞 Call Us Now</a>
      </div>
    </div>

    <div class="footer">
      <div class="company">${data.businessName}</div>
      <p>📞 ${data.businessPhone}</p>
      <p>📧 ${data.businessEmail}</p>
      <p style="margin-top: 12px; font-size: 11px; color: #60A5FA;">
        This is an automated delivery notification. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

async function sendDispatchEmail({ to, customerName, machineData, dispatchData, businessInfo }) {
  const html = generateDispatchEmailHTML({
    customerName,
    ...machineData,
    ...dispatchData,
    ...businessInfo,
  });

  try {
    await transporter.sendMail({
      from: `"${businessInfo.businessName}" <${process.env.EMAIL_FROM}>`,
      to,
      subject: `🚚 Your Machine is Dispatched — ${machineData.machineName} | ${businessInfo.businessName}`,
      html,
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}

module.exports = { sendDispatchEmail };
