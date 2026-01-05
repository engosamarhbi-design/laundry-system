const crypto = require('crypto');
const QRCode = require('qrcode');

function getSetting(db, laundryId, key, fallback = '') {
  const row = db.settings.find((s) => s.laundry_id == laundryId && s.setting_key === key);
  return row ? String(row.setting_value ?? '') : fallback;
}

function tlvEncode(tag, value) {
  const valueBuf = Buffer.from(String(value ?? ''), 'utf8');
  const tagBuf = Buffer.from([tag]);
  const lenBuf = Buffer.from([valueBuf.length]);
  return Buffer.concat([tagBuf, lenBuf, valueBuf]);
}

function buildZatcaTlvBase64({ sellerName, vatNumber, timestamp, invoiceTotal, vatTotal }) {
  const parts = [
    tlvEncode(1, sellerName),
    tlvEncode(2, vatNumber),
    tlvEncode(3, timestamp),
    tlvEncode(4, invoiceTotal),
    tlvEncode(5, vatTotal),
  ];
  return Buffer.concat(parts).toString('base64');
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value ?? ''), 'utf8').digest('hex');
}

async function tlvToQrDataUrl(tlvBase64) {
  if (!tlvBase64) return '';
  return QRCode.toDataURL(tlvBase64, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6,
  });
}

function formatIsoTimestamp(input) {
  if (!input) return new Date().toISOString();
  const d = new Date(input);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

async function attachZatcaFields(db, invoice, laundryId = 1) {
  const sellerName = getSetting(db, laundryId, 'laundry_name', 'Laundry');
  const vatNumber = getSetting(db, laundryId, 'tax_number', '');

  const timestamp = formatIsoTimestamp(invoice.created_at);
  const invoiceTotal = Number(invoice.total ?? 0).toFixed(2);
  const vatTotal = Number(invoice.tax_amount ?? 0).toFixed(2);

  const tlvBase64 = buildZatcaTlvBase64({ sellerName, vatNumber, timestamp, invoiceTotal, vatTotal });
  const qrImage = await tlvToQrDataUrl(tlvBase64);

  // هذا ليس هاش زاتكا الحقيقي (UBL hash). مجرد بصمة محلية لمتابعة التغييرات.
  const pseudoHash = sha256Hex(`${invoice.invoice_number || invoice.id}|${timestamp}|${invoiceTotal}|${vatTotal}|${vatNumber}`);

  return {
    seller_name: sellerName,
    vat_number: vatNumber,
    tlv_base64: tlvBase64,
    qr_image: qrImage,
    pseudo_hash: pseudoHash,
  };
}

module.exports = {
  attachZatcaFields,
};
