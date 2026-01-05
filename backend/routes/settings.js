// =====================================================
// نظام إدارة المغاسل - API الإعدادات
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../database/mockData');

// جلب جميع الإعدادات
router.get('/', (req, res) => {
  try {
    const { laundry_id = 1 } = req.query;
    
    const settings = db.settings.filter(s => s.laundry_id == laundry_id);
    
    // تحويل إلى كائن
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.setting_key] = s.setting_value;
    });
    
    res.json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب إعداد واحد
router.get('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { laundry_id = 1 } = req.query;
    
    const setting = db.settings.find(s => s.laundry_id == laundry_id && s.setting_key === key);
    
    if (!setting) {
      return res.status(404).json({ success: false, message: 'الإعداد غير موجود' });
    }
    
    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث إعداد
router.put('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value, laundry_id = 1 } = req.body;
    
    const index = db.settings.findIndex(s => s.laundry_id == laundry_id && s.setting_key === key);
    
    if (index === -1) {
      // إنشاء إعداد جديد
      const newSetting = {
        id: db.getNextId(db.settings),
        laundry_id: parseInt(laundry_id),
        setting_key: key,
        setting_value: value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.settings.push(newSetting);
      
      return res.status(201).json({
        success: true,
        message: 'تم إنشاء الإعداد',
        data: newSetting
      });
    }
    
    db.settings[index].setting_value = value;
    db.settings[index].updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'تم تحديث الإعداد',
      data: db.settings[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث عدة إعدادات
router.post('/bulk', (req, res) => {
  try {
    const { settings, laundry_id = 1 } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'الإعدادات مطلوبة' });
    }
    
    Object.entries(settings).forEach(([key, value]) => {
      const index = db.settings.findIndex(s => s.laundry_id == laundry_id && s.setting_key === key);
      
      if (index === -1) {
        db.settings.push({
          id: db.getNextId(db.settings),
          laundry_id: parseInt(laundry_id),
          setting_key: key,
          setting_value: String(value),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        db.settings[index].setting_value = String(value);
        db.settings[index].updated_at = new Date().toISOString();
      }
    });
    
    res.json({
      success: true,
      message: 'تم تحديث الإعدادات'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
