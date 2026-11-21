// YaadProof enquiry form -> hello@yaadproof.com via Hostinger SMTP.
// Needs env var SMTP_PASS (the hello@yaadproof.com mailbox password), set in Vercel.
const nodemailer = require('nodemailer');

const clean = (v, max = 2000) =>
  String(v || '').replace(/[\r\0]/g, '').trim().slice(0, max);

module.exports = async (req, res) => {
  const go = (path) => { res.statusCode = 303; res.setHeader('Location', path); res.end(); };
  if (req.method !== 'POST') return go('/');

  const b = req.body || {};
  if (clean(b.website)) return go('/thanks.html'); // honeypot: bots fill it, quietly drop

  const name = clean(b.name, 120).replace(/\n/g, ' ');
  const whatsapp = clean(b.whatsapp, 40).replace(/\n/g, ' ');
  const email = clean(b.email, 160).replace(/\n/g, ' ');
  const parish = clean(b.parish, 80).replace(/\n/g, ' ');
  const stage = clean(b.stage, 80).replace(/\n/g, ' ');
  const message = clean(b.message, 4000);

  if (!name || !whatsapp || !message) return go('/error.html');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return go('/error.html');
  if (!process.env.SMTP_PASS) return go('/error.html');

  const user = process.env.SMTP_USER || 'hello@yaadproof.com';
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: 465, secure: true,
    auth: { user, pass: process.env.SMTP_PASS },
  });

  const text = [
    `Name: ${name}`, `WhatsApp: ${whatsapp}`, `Email: ${email || '-'}`,
    `Parish / area: ${parish || '-'}`, `Stage: ${stage || '-'}`, '', message,
  ].join('\n');

  try {
    await t.sendMail({
      from: `"YaadProof website" <${user}>`,
      to: process.env.SMTP_TO || user,
      replyTo: email || undefined,
      subject: `New enquiry: ${name}`,
      text,
    });
    return go('/thanks.html');
  } catch (e) {
    console.error('mail failed', e && e.message);
    return go('/error.html');
  }
};
