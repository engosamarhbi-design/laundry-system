// =====================================================
// نظام إدارة المغاسل - API الأصناف والخدمات
// =====================================================

const express = require('express');
const router = express.Router();
const db = require('../database/mockData');

// =====================================================
// تصنيفات الخدمات
// =====================================================

// جلب جميع التصنيفات
router.get('/categories', (req, res) => {
  try {
    const { laundry_id = 1 } = req.query;
    const categories = db.serviceCategories.filter(c => c.laundry_id == laundry_id);
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إضافة تصنيف جديد
router.post('/categories', (req, res) => {
  try {
    const { name, name_en, icon, color, laundry_id = 1 } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'اسم التصنيف مطلوب' });
    }
    
    const newCategory = {
      id: db.getNextId(db.serviceCategories),
      laundry_id: parseInt(laundry_id),
      name,
      name_en: name_en || name,
      icon: icon || 'folder',
      color: color || '#6B7280',
      sort_order: db.serviceCategories.length + 1,
      is_active: true
    };
    
    db.serviceCategories.push(newCategory);
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة التصنيف بنجاح',
      data: newCategory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث تصنيف
router.put('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.serviceCategories.findIndex(c => c.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'التصنيف غير موجود' });
    }
    
    db.serviceCategories[index] = { ...db.serviceCategories[index], ...req.body };
    
    res.json({
      success: true,
      message: 'تم تحديث التصنيف بنجاح',
      data: db.serviceCategories[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// حذف تصنيف
router.delete('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.serviceCategories.findIndex(c => c.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'التصنيف غير موجود' });
    }
    
    // التحقق من وجود خدمات مرتبطة
    const linkedServices = db.services.filter(s => s.category_id == id);
    if (linkedServices.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف التصنيف لوجود ${linkedServices.length} خدمة مرتبطة به` 
      });
    }
    
    db.serviceCategories.splice(index, 1);
    
    res.json({
      success: true,
      message: 'تم حذف التصنيف بنجاح'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================================
// الخدمات
// =====================================================

// جلب جميع الخدمات
router.get('/', (req, res) => {
  try {
    const { laundry_id = 1, category_id, is_active, search, page = 1, limit = 50 } = req.query;
    
    let filteredServices = db.services.filter(s => s.laundry_id == laundry_id);
    
    // فلترة حسب التصنيف
    if (category_id) {
      filteredServices = filteredServices.filter(s => s.category_id == category_id);
    }
    
    // فلترة حسب الحالة
    if (is_active !== undefined) {
      filteredServices = filteredServices.filter(s => s.is_active === (is_active === 'true'));
    }
    
    // البحث
    if (search) {
      const searchLower = search.toLowerCase();
      filteredServices = filteredServices.filter(s => 
        s.name.toLowerCase().includes(searchLower) || 
        s.name_en.toLowerCase().includes(searchLower)
      );
    }
    
    // إضافة معلومات التصنيف
    const servicesWithCategory = filteredServices.map(service => {
      const category = db.serviceCategories.find(c => c.id === service.category_id);
      return {
        ...service,
        category_name: category?.name || '',
        category_name_en: category?.name_en || ''
      };
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedServices = servicesWithCategory.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedServices,
      pagination: {
        total: filteredServices.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredServices.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// جلب خدمة واحدة
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const service = db.services.find(s => s.id == id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'الخدمة غير موجودة' });
    }
    
    const category = db.serviceCategories.find(c => c.id === service.category_id);
    
    res.json({
      success: true,
      data: {
        ...service,
        category_name: category?.name || '',
        category_name_en: category?.name_en || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// إضافة خدمة جديدة
router.post('/', (req, res) => {
  try {
    const { 
      name, 
      name_en, 
      category_id, 
      price, 
      unit = 'piece', 
      description,
      description_en,
      estimated_time,
      barcode,
      laundry_id = 1 
    } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!name || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'اسم الخدمة والسعر مطلوبان' 
      });
    }
    
    // التحقق من السعر
    if (price <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'السعر يجب أن يكون أكبر من صفر' 
      });
    }
    
    const newService = {
      id: db.getNextId(db.services),
      laundry_id: parseInt(laundry_id),
      category_id: category_id ? parseInt(category_id) : null,
      name,
      name_en: name_en || name,
      description: description || '',
      description_en: description_en || '',
      price: parseFloat(price),
      unit,
      estimated_time: estimated_time ? parseInt(estimated_time) : null,
      barcode: barcode || null,
      image: null,
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    db.services.push(newService);
    
    // تسجيل في سجل التدقيق
    db.auditLogs.push({
      id: db.getNextId(db.auditLogs),
      laundry_id: parseInt(laundry_id),
      branch_id: null,
      user_id: 1, // سيتم استبداله بالمستخدم الفعلي
      action_type: 'create',
      entity_type: 'service',
      entity_id: newService.id,
      old_value: null,
      new_value: newService,
      description: `تم إضافة خدمة جديدة: ${name}`,
      risk_level: 'low',
      is_flagged: false,
      created_at: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة الخدمة بنجاح',
      data: newService
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تحديث خدمة
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.services.findIndex(s => s.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الخدمة غير موجودة' });
    }
    
    const oldService = { ...db.services[index] };
    const updatedService = { ...oldService, ...req.body, updated_at: new Date().toISOString() };
    
    // التحقق من تغيير السعر لتسجيله في رادار الاحتيال
    if (req.body.price && req.body.price !== oldService.price) {
      db.auditLogs.push({
        id: db.getNextId(db.auditLogs),
        laundry_id: oldService.laundry_id,
        branch_id: null,
        user_id: 1,
        action_type: 'price_change',
        entity_type: 'service',
        entity_id: parseInt(id),
        old_value: { price: oldService.price },
        new_value: { price: req.body.price },
        description: `تم تغيير سعر "${oldService.name}" من ${oldService.price} إلى ${req.body.price} ريال`,
        risk_level: 'medium',
        is_flagged: true,
        created_at: new Date().toISOString()
      });
    }
    
    db.services[index] = updatedService;
    
    res.json({
      success: true,
      message: 'تم تحديث الخدمة بنجاح',
      data: updatedService
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// حذف خدمة
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.services.findIndex(s => s.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الخدمة غير موجودة' });
    }
    
    // التحقق من استخدام الخدمة في فواتير
    const usedInInvoices = db.invoiceItems.some(item => item.service_id == id);
    if (usedInInvoices) {
      // تعطيل بدلاً من الحذف
      db.services[index].is_active = false;
      return res.json({
        success: true,
        message: 'تم تعطيل الخدمة (لا يمكن حذفها لارتباطها بفواتير سابقة)',
        data: db.services[index]
      });
    }
    
    const deletedService = db.services.splice(index, 1)[0];
    
    res.json({
      success: true,
      message: 'تم حذف الخدمة بنجاح',
      data: deletedService
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// تفعيل/تعطيل خدمة
router.patch('/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const index = db.services.findIndex(s => s.id == id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'الخدمة غير موجودة' });
    }
    
    db.services[index].is_active = !db.services[index].is_active;
    
    res.json({
      success: true,
      message: db.services[index].is_active ? 'تم تفعيل الخدمة' : 'تم تعطيل الخدمة',
      data: db.services[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================================
// إحصائيات الخدمات
// =====================================================

router.get('/stats/overview', (req, res) => {
  try {
    const { laundry_id = 1 } = req.query;
    
    const services = db.services.filter(s => s.laundry_id == laundry_id);
    const activeServices = services.filter(s => s.is_active);
    
    // حساب الخدمات الأكثر استخداماً
    const serviceUsage = {};
    db.invoiceItems.forEach(item => {
      if (item.service_id) {
        serviceUsage[item.service_id] = (serviceUsage[item.service_id] || 0) + item.quantity;
      }
    });
    
    const topServices = Object.entries(serviceUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([serviceId, usage]) => {
        const service = db.services.find(s => s.id == serviceId);
        return {
          id: parseInt(serviceId),
          name: service?.name || 'غير معروف',
          name_en: service?.name_en || 'Unknown',
          usage: usage
        };
      });
    
    res.json({
      success: true,
      data: {
        total: services.length,
        active: activeServices.length,
        inactive: services.length - activeServices.length,
        categories: db.serviceCategories.filter(c => c.laundry_id == laundry_id).length,
        topServices
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
