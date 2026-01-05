// =====================================================
// نظام إدارة المغاسل - إدارة الصندوق (فتح/إغلاق وردية)
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../database/mockData');
const { authMiddleware, requireLaundryAccess } = require('../middleware/auth');

router.use(authMiddleware);
router.use(requireLaundryAccess);

const parseDateSafe = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  const str = String(value).trim();

  // ISO should work.
  const isoTry = new Date(str);
  if (!Number.isNaN(isoTry.getTime())) return isoTry;

  // Try "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
  const normalized = str.replace(' ', 'T');
  const dt = new Date(normalized);
  if (!Number.isNaN(dt.getTime())) return dt;

  return null;
};

const computeExpected = ({ laundryId, branchId, userId, from, to }) => {
  const fromDate = parseDateSafe(from);
  const toDate = parseDateSafe(to) || new Date();

  const sums = {
    cash: 0,
    card: 0,
    transfer: 0,
    other: 0,
    total: 0,
    count: 0,
  };

  const invoices = (db.invoices || []).filter((inv) => {
    if (inv.laundry_id != laundryId) return false;
    if (branchId != null && inv.branch_id != branchId) return false;
    if (userId != null && inv.user_id != userId) return false;
    if (inv.payment_status !== 'paid') return false;

    const createdAt = parseDateSafe(inv.created_at);
    if (!createdAt) return false;
    if (fromDate && createdAt < fromDate) return false;
    if (toDate && createdAt > toDate) return false;
    return true;
  });

  for (const inv of invoices) {
    const amount = Number(inv.total) || 0;
    sums.total += amount;
    sums.count += 1;

    const method = String(inv.payment_method || '').toLowerCase();
    if (method === 'cash') sums.cash += amount;
    else if (method === 'card') sums.card += amount;
    else if (method === 'transfer') sums.transfer += amount;
    else sums.other += amount;
  }

  // round
  Object.keys(sums).forEach((k) => {
    if (typeof sums[k] === 'number') sums[k] = Math.round(sums[k] * 100) / 100;
  });

  return sums;
};

const getActiveSession = ({ laundryId, branchId, userId }) => {
  return (db.cashDrawerSessions || []).find(
    (s) => s.laundry_id == laundryId && s.branch_id == branchId && s.user_id == userId && s.status === 'open'
  );
};

router.get('/current', (req, res) => {
  try {
    const laundryId = req.user.laundry_id;
    const branchId = req.user.branch_id;
    const userId = req.user.id;

    if (!branchId) {
      return res.status(400).json({ success: false, message: 'الحساب غير مرتبط بفرع' });
    }

    const session = getActiveSession({ laundryId, branchId, userId });
    if (!session) {
      return res.json({ success: true, data: { active: false } });
    }

    const expected = computeExpected({
      laundryId,
      branchId,
      userId,
      from: session.opened_at,
      to: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: {
        active: true,
        session,
        expected,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/open', (req, res) => {
  try {
    const laundryId = req.user.laundry_id;
    const branchId = req.user.branch_id;
    const userId = req.user.id;

    if (!branchId) {
      return res.status(400).json({ success: false, message: 'الحساب غير مرتبط بفرع' });
    }

    const existing = getActiveSession({ laundryId, branchId, userId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'يوجد وردية مفتوحة بالفعل' });
    }

    const openingCash = Number(req.body.opening_cash);
    if (Number.isNaN(openingCash) || openingCash < 0) {
      return res.status(400).json({ success: false, message: 'مبلغ الافتتاح غير صحيح' });
    }

    const session = {
      id: db.getNextId(db.cashDrawerSessions || []),
      laundry_id: laundryId,
      branch_id: branchId,
      user_id: userId,
      status: 'open',
      opened_at: new Date().toISOString(),
      opening_cash: Math.round(openingCash * 100) / 100,
      open_notes: req.body.notes || null,
      closed_at: null,
      close_notes: null,
      counted_cash: null,
      counted_card: null,
      counted_transfer: null,
      expected_cash: 0,
      expected_card: 0,
      expected_transfer: 0,
      expected_other: 0,
      expected_total: 0,
      variance_cash: null,
      variance_card: null,
      variance_transfer: null,
      variance_total: null,
    };

    if (!db.cashDrawerSessions) db.cashDrawerSessions = [];
    db.cashDrawerSessions.push(session);

    res.status(201).json({ success: true, message: 'تم فتح الوردية', data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/close', (req, res) => {
  try {
    const laundryId = req.user.laundry_id;
    const branchId = req.user.branch_id;
    const userId = req.user.id;

    if (!branchId) {
      return res.status(400).json({ success: false, message: 'الحساب غير مرتبط بفرع' });
    }

    const session = getActiveSession({ laundryId, branchId, userId });
    if (!session) {
      return res.status(400).json({ success: false, message: 'لا توجد وردية مفتوحة لإغلاقها' });
    }

    const countedCash = Number(req.body.counted_cash);
    const countedCard = Number(req.body.counted_card);
    const countedTransfer = Number(req.body.counted_transfer);

    if ([countedCash, countedCard, countedTransfer].some((v) => Number.isNaN(v) || v < 0)) {
      return res.status(400).json({ success: false, message: 'القيم المدخلة غير صحيحة' });
    }

    const expected = computeExpected({
      laundryId,
      branchId,
      userId,
      from: session.opened_at,
      to: new Date().toISOString(),
    });

    const varianceCash = Math.round((countedCash - expected.cash) * 100) / 100;
    const varianceCard = Math.round((countedCard - expected.card) * 100) / 100;
    const varianceTransfer = Math.round((countedTransfer - expected.transfer) * 100) / 100;

    const countedTotal = Math.round((countedCash + countedCard + countedTransfer) * 100) / 100;
    const expectedTotal = Math.round((expected.cash + expected.card + expected.transfer) * 100) / 100;
    const varianceTotal = Math.round((countedTotal - expectedTotal) * 100) / 100;

    session.status = 'closed';
    session.closed_at = new Date().toISOString();
    session.close_notes = req.body.notes || null;

    session.counted_cash = Math.round(countedCash * 100) / 100;
    session.counted_card = Math.round(countedCard * 100) / 100;
    session.counted_transfer = Math.round(countedTransfer * 100) / 100;

    session.expected_cash = expected.cash;
    session.expected_card = expected.card;
    session.expected_transfer = expected.transfer;
    session.expected_other = expected.other;
    session.expected_total = expected.total;

    session.variance_cash = varianceCash;
    session.variance_card = varianceCard;
    session.variance_transfer = varianceTransfer;
    session.variance_total = varianceTotal;

    res.json({
      success: true,
      message: 'تم إغلاق الوردية',
      data: {
        session,
        expected: {
          cash: expected.cash,
          card: expected.card,
          transfer: expected.transfer,
          other: expected.other,
          total: expected.total,
          count: expected.count,
        },
        counted: {
          cash: session.counted_cash,
          card: session.counted_card,
          transfer: session.counted_transfer,
          total: countedTotal,
        },
        variance: {
          cash: varianceCash,
          card: varianceCard,
          transfer: varianceTransfer,
          total: varianceTotal,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
