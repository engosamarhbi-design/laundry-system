// =====================================================
// قاعدة بيانات وهمية للتطوير
// Mock Database for Development
// =====================================================

// تصنيفات الخدمات
let serviceCategories = [
  { id: 1, laundry_id: 1, name: 'غسيل', name_en: 'Washing', icon: 'washing-machine', color: '#10B981', sort_order: 1, is_active: true },
  { id: 2, laundry_id: 1, name: 'تنظيف جاف', name_en: 'Dry Clean', icon: 'sparkles', color: '#6366F1', sort_order: 2, is_active: true },
  { id: 3, laundry_id: 1, name: 'كوي', name_en: 'Ironing', icon: 'iron', color: '#F59E0B', sort_order: 3, is_active: true },
  { id: 4, laundry_id: 1, name: 'خدمات خاصة', name_en: 'Special', icon: 'star', color: '#EC4899', sort_order: 4, is_active: true },
  { id: 5, laundry_id: 1, name: 'اشتراكات', name_en: 'Subscriptions', icon: 'credit-card', color: '#8B5CF6', sort_order: 5, is_active: true },
];

// الخدمات
let services = [
  { id: 1, laundry_id: 1, category_id: 1, name: 'غسيل عادي', name_en: 'Regular Wash', price: 15, unit: 'piece', estimated_time: 60, is_active: true, created_at: '2024-01-01' },
  { id: 2, laundry_id: 1, category_id: 2, name: 'غسيل جاف', name_en: 'Dry Clean', price: 25, unit: 'piece', estimated_time: 120, is_active: true, created_at: '2024-01-01' },
  { id: 3, laundry_id: 1, category_id: 3, name: 'كوي فقط', name_en: 'Iron Only', price: 8, unit: 'piece', estimated_time: 30, is_active: true, created_at: '2024-01-01' },
  { id: 4, laundry_id: 1, category_id: 1, name: 'غسيل بالكيلو', name_en: 'Wash by KG', price: 12, unit: 'kg', estimated_time: 90, is_active: true, created_at: '2024-01-01' },
  { id: 5, laundry_id: 1, category_id: 4, name: 'تنظيف سجاد', name_en: 'Carpet Cleaning', price: 20, unit: 'sqm', estimated_time: 180, is_active: true, created_at: '2024-01-01' },
  { id: 6, laundry_id: 1, category_id: 5, name: 'باقة شهرية', name_en: 'Monthly Package', price: 299, unit: 'package', estimated_time: null, is_active: true, created_at: '2024-01-01' },
  { id: 7, laundry_id: 1, category_id: 4, name: 'تنظيف ستائر', name_en: 'Curtain Cleaning', price: 35, unit: 'piece', estimated_time: 240, is_active: true, created_at: '2024-01-01' },
  { id: 8, laundry_id: 1, category_id: 2, name: 'تنظيف بدلة', name_en: 'Suit Cleaning', price: 45, unit: 'piece', estimated_time: 180, is_active: true, created_at: '2024-01-01' },
  { id: 9, laundry_id: 1, category_id: 1, name: 'غسيل بياضات', name_en: 'Bedding Wash', price: 30, unit: 'piece', estimated_time: 120, is_active: true, created_at: '2024-01-01' },
  { id: 10, laundry_id: 1, category_id: 3, name: 'كوي قمصان', name_en: 'Shirt Ironing', price: 5, unit: 'piece', estimated_time: 15, is_active: true, created_at: '2024-01-01' },
];

// العملاء
let customers = [
  { id: 1, laundry_id: 1, name: 'أحمد محمد العتيبي', phone: '0551234567', email: 'ahmed@email.com', address: 'الرياض - حي النرجس', city: 'الرياض', is_vip: true, total_orders: 45, total_spent: 3250, whatsapp_opted_in: true, created_at: '2024-01-15' },
  { id: 2, laundry_id: 1, name: 'فاطمة عبدالله', phone: '0559876543', email: 'fatima@email.com', address: 'الرياض - حي الملقا', city: 'الرياض', is_vip: false, total_orders: 23, total_spent: 1890, whatsapp_opted_in: true, created_at: '2024-02-20' },
  { id: 3, laundry_id: 1, name: 'خالد السعيد', phone: '0541112233', email: 'khaled@email.com', address: 'الرياض - حي الياسمين', city: 'الرياض', is_vip: true, total_orders: 67, total_spent: 5420, whatsapp_opted_in: true, created_at: '2023-11-10' },
  { id: 4, laundry_id: 1, name: 'نورة الحربي', phone: '0533445566', email: 'noura@email.com', address: 'الرياض - حي الصحافة', city: 'الرياض', is_vip: false, total_orders: 12, total_spent: 890, whatsapp_opted_in: false, created_at: '2024-03-05' },
  { id: 5, laundry_id: 1, name: 'محمد الدوسري', phone: '0567788990', email: 'mohammed@email.com', address: 'الرياض - حي الورود', city: 'الرياض', is_vip: false, total_orders: 34, total_spent: 2150, whatsapp_opted_in: true, created_at: '2024-01-28' },
  { id: 6, laundry_id: 1, name: 'سارة القحطاني', phone: '0512345678', email: 'sara@email.com', address: 'الرياض - حي العليا', city: 'الرياض', is_vip: true, total_orders: 89, total_spent: 7890, whatsapp_opted_in: true, created_at: '2023-09-15' },
  { id: 7, laundry_id: 1, name: 'عبدالرحمن المطيري', phone: '0598765432', email: 'abdulrahman@email.com', address: 'الرياض - حي الربوة', city: 'الرياض', is_vip: false, total_orders: 8, total_spent: 450, whatsapp_opted_in: true, created_at: '2024-04-10' },
];

// الفواتير
let invoices = [
  { id: 1, laundry_id: 1, branch_id: 1, customer_id: 1, user_id: 3, invoice_number: 'INV-001', subtotal: 125, discount_amount: 0, discount_percent: 0, tax_rate: 15, tax_amount: 18.75, total: 143.75, status: 'paid', payment_status: 'paid', payment_method: 'card', created_at: '2024-12-01 10:30:00', paid_at: '2024-12-01 10:35:00' },
  { id: 2, laundry_id: 1, branch_id: 2, customer_id: 2, user_id: 3, invoice_number: 'INV-002', subtotal: 75, discount_amount: 0, discount_percent: 0, tax_rate: 15, tax_amount: 11.25, total: 86.25, status: 'pending', payment_status: 'unpaid', payment_method: 'cash', created_at: '2024-12-02 14:20:00', paid_at: null },
  { id: 3, laundry_id: 1, branch_id: 1, customer_id: 3, user_id: 3, invoice_number: 'INV-003', subtotal: 220, discount_amount: 22, discount_percent: 10, tax_rate: 15, tax_amount: 29.70, total: 227.70, status: 'paid', payment_status: 'paid', payment_method: 'transfer', created_at: '2024-12-03 09:15:00', paid_at: '2024-12-03 09:20:00' },
  { id: 4, laundry_id: 1, branch_id: 3, customer_id: 4, user_id: 3, invoice_number: 'INV-004', subtotal: 45, discount_amount: 0, discount_percent: 0, tax_rate: 15, tax_amount: 6.75, total: 51.75, status: 'cancelled', payment_status: 'unpaid', payment_method: 'cash', created_at: '2024-12-04 16:45:00', paid_at: null },
  { id: 5, laundry_id: 1, branch_id: 1, customer_id: 5, user_id: 3, invoice_number: 'INV-005', subtotal: 180, discount_amount: 0, discount_percent: 0, tax_rate: 15, tax_amount: 27, total: 207, status: 'ready', payment_status: 'paid', payment_method: 'card', created_at: '2024-12-05 11:00:00', paid_at: '2024-12-05 11:05:00' },
  { id: 6, laundry_id: 1, branch_id: 1, customer_id: 6, user_id: 3, invoice_number: 'INV-006', subtotal: 350, discount_amount: 35, discount_percent: 10, tax_rate: 15, tax_amount: 47.25, total: 362.25, status: 'processing', payment_status: 'paid', payment_method: 'card', created_at: '2024-12-05 14:30:00', paid_at: '2024-12-05 14:35:00' },
  { id: 7, laundry_id: 1, branch_id: 2, customer_id: 7, user_id: 3, invoice_number: 'INV-007', subtotal: 65, discount_amount: 0, discount_percent: 0, tax_rate: 15, tax_amount: 9.75, total: 74.75, status: 'pending', payment_status: 'unpaid', payment_method: 'cash', created_at: '2024-12-05 15:45:00', paid_at: null },
];

// عناصر الفواتير
let invoiceItems = [
  { id: 1, invoice_id: 1, service_id: 1, name: 'غسيل عادي', quantity: 5, unit_price: 15, discount_amount: 0, total: 75 },
  { id: 2, invoice_id: 1, service_id: 3, name: 'كوي فقط', quantity: 5, unit_price: 8, discount_amount: 0, total: 40 },
  { id: 3, invoice_id: 1, service_id: 10, name: 'كوي قمصان', quantity: 2, unit_price: 5, discount_amount: 0, total: 10 },
  { id: 4, invoice_id: 2, service_id: 2, name: 'غسيل جاف', quantity: 3, unit_price: 25, discount_amount: 0, total: 75 },
  { id: 5, invoice_id: 3, service_id: 8, name: 'تنظيف بدلة', quantity: 2, unit_price: 45, discount_amount: 0, total: 90 },
  { id: 6, invoice_id: 3, service_id: 9, name: 'غسيل بياضات', quantity: 3, unit_price: 30, discount_amount: 0, total: 90 },
  { id: 7, invoice_id: 3, service_id: 3, name: 'كوي فقط', quantity: 5, unit_price: 8, discount_amount: 0, total: 40 },
];

// الفروع
let branches = [
  { id: 1, laundry_id: 1, name: 'الفرع الرئيسي', name_en: 'Main Branch', address: 'الرياض - طريق الملك فهد', phone: '0112345678', manager_id: 2, is_main: true, is_active: true, employees_count: 8 },
  { id: 2, laundry_id: 1, name: 'فرع الملقا', name_en: 'Malqa Branch', address: 'الرياض - حي الملقا', phone: '0112345679', manager_id: null, is_main: false, is_active: true, employees_count: 5 },
  { id: 3, laundry_id: 1, name: 'فرع الياسمين', name_en: 'Yasmin Branch', address: 'الرياض - حي الياسمين', phone: '0112345680', manager_id: null, is_main: false, is_active: true, employees_count: 4 },
];

// المستخدمين
let users = [
  { id: 1, laundry_id: 1, branch_id: null, role_id: 1, name: 'عبدالله المالك', email: 'owner@laundry.com', phone: '0500000001', is_active: true, last_login: '2024-12-05 09:30:00', created_at: '2024-01-01' },
  { id: 2, laundry_id: 1, branch_id: 1, role_id: 2, name: 'سعود المالكي', email: 'manager@laundry.com', phone: '0500000002', is_active: true, last_login: '2024-12-05 08:15:00', created_at: '2024-01-15' },
  { id: 3, laundry_id: 1, branch_id: 1, role_id: 3, name: 'محمد الكاشير', email: 'cashier@laundry.com', phone: '0500000003', is_active: true, last_login: '2024-12-05 10:00:00', created_at: '2024-02-01' },
  { id: 4, laundry_id: 1, branch_id: 2, role_id: 4, name: 'أحمد الموظف', email: 'staff@laundry.com', phone: '0500000004', is_active: false, last_login: '2024-12-01 14:20:00', created_at: '2024-03-01' },
  { id: 5, laundry_id: 1, branch_id: 1, role_id: 5, name: 'مندوب التوصيل', email: 'courier@laundry.com', phone: '0500000005', is_active: true, last_login: null, created_at: '2024-12-10' },
  { id: 6, laundry_id: 1, branch_id: 2, role_id: 5, name: 'مندوب فرع الملقا', email: 'courier.malqa@laundry.com', phone: '0500000006', is_active: true, last_login: null, created_at: '2024-12-10' },
  { id: 7, laundry_id: 1, branch_id: 3, role_id: 5, name: 'مندوب فرع الياسمين', email: 'courier.yasmin@laundry.com', phone: '0500000007', is_active: true, last_login: null, created_at: '2024-12-10' },
];

// الأدوار
let roles = [
  { id: 1, laundry_id: 1, name: 'مالك', name_en: 'Owner', is_system: true, permissions: { all: true } },
  { id: 2, laundry_id: 1, name: 'مدير', name_en: 'Manager', is_system: true, permissions: { dashboard: true, services: true, customers: true, invoices: true, reports: true, cash_drawer: true, users: false, settings: false } },
  { id: 3, laundry_id: 1, name: 'كاشير', name_en: 'Cashier', is_system: true, permissions: { dashboard: true, services: { view: true }, customers: true, invoices: { view: true, create: true }, cash_drawer: true, reports: false } },
  { id: 4, laundry_id: 1, name: 'موظف', name_en: 'Staff', is_system: true, permissions: { dashboard: true, services: { view: true }, customers: { view: true }, invoices: { view: true } } },
  { id: 5, laundry_id: 1, name: 'مندوب توصيل', name_en: 'Courier', is_system: true, permissions: { dashboard: true, services: { view: true }, customers: { view: true }, invoices: { view: true, create: true }, reports: false, cash_drawer: false } },
];

// ورديات الصندوق (Cash Drawer Sessions)
let cashDrawerSessions = [];

// سجل التدقيق
let auditLogs = [
  { id: 1, laundry_id: 1, branch_id: 1, user_id: 3, action_type: 'price_change', entity_type: 'service', entity_id: 1, old_value: { price: 12 }, new_value: { price: 15 }, description: 'تم تغيير سعر "غسيل عادي" من 12 إلى 15 ريال', risk_level: 'medium', is_flagged: true, created_at: '2024-12-05 11:30:00' },
  { id: 2, laundry_id: 1, branch_id: 1, user_id: 3, action_type: 'discount_change', entity_type: 'invoice', entity_id: 3, old_value: { discount: 0 }, new_value: { discount: 10 }, description: 'تم إضافة خصم 10% على فاتورة INV-003', risk_level: 'medium', is_flagged: true, created_at: '2024-12-05 10:15:00' },
  { id: 3, laundry_id: 1, branch_id: 3, user_id: 2, action_type: 'invoice_cancel', entity_type: 'invoice', entity_id: 4, old_value: { status: 'pending' }, new_value: { status: 'cancelled' }, description: 'تم إلغاء الفاتورة INV-004', risk_level: 'high', is_flagged: true, created_at: '2024-12-04 16:45:00' },
  { id: 4, laundry_id: 1, branch_id: 1, user_id: 3, action_type: 'tax_change', entity_type: 'invoice', entity_id: 5, old_value: { tax: 15 }, new_value: { tax: 10 }, description: 'محاولة تعديل نسبة الضريبة', risk_level: 'critical', is_flagged: true, created_at: '2024-12-04 14:20:00' },
];

// باقات الاشتراكات
let subscriptionPlans = [
  { id: 1, laundry_id: 1, name: 'باقة شهرية', name_en: 'Monthly Plan', price: 299, duration_days: 30, items_limit: 50, discount_percent: 10, is_active: true },
  { id: 2, laundry_id: 1, name: 'باقة ذهبية', name_en: 'Gold Plan', price: 499, duration_days: 30, items_limit: 100, discount_percent: 15, is_active: true },
  { id: 3, laundry_id: 1, name: 'باقة بلاتينية', name_en: 'Platinum Plan', price: 899, duration_days: 30, items_limit: 200, discount_percent: 20, is_active: true },
];

// اشتراكات العملاء
let customerSubscriptions = [
  { id: 1, customer_id: 1, plan_id: 2, branch_id: 1, start_date: '2024-11-20', end_date: '2024-12-20', items_used: 35, status: 'active' },
  { id: 2, customer_id: 3, plan_id: 3, branch_id: 1, start_date: '2024-11-15', end_date: '2024-12-15', items_used: 120, status: 'active' },
  { id: 3, customer_id: 6, plan_id: 2, branch_id: 1, start_date: '2024-12-01', end_date: '2024-12-31', items_used: 25, status: 'active' },
];

// الإعدادات
let settings = [
  { id: 1, laundry_id: 1, setting_key: 'laundry_name', setting_value: 'مغسلة النظافة' },
  { id: 2, laundry_id: 1, setting_key: 'laundry_name_en', setting_value: 'Al-Nazafa Laundry' },
  { id: 3, laundry_id: 1, setting_key: 'tax_number', setting_value: '300012345600003' },
  { id: 4, laundry_id: 1, setting_key: 'tax_rate', setting_value: '15' },
  { id: 5, laundry_id: 1, setting_key: 'currency', setting_value: 'SAR' },
  { id: 6, laundry_id: 1, setting_key: 'whatsapp_invoice_created', setting_value: 'true' },
  { id: 7, laundry_id: 1, setting_key: 'whatsapp_ready_pickup', setting_value: 'true' },
  { id: 8, laundry_id: 1, setting_key: 'whatsapp_payment_received', setting_value: 'false' },
  { id: 9, laundry_id: 1, setting_key: 'zatca_status', setting_value: 'connected' },
  { id: 10, laundry_id: 1, setting_key: 'zatca_device_id', setting_value: 'DEVICE-001-2024' },
];

// =====================================================
// تصدير البيانات
// =====================================================

module.exports = {
  serviceCategories,
  services,
  customers,
  invoices,
  invoiceItems,
  branches,
  users,
  roles,
  cashDrawerSessions,
  auditLogs,
  subscriptionPlans,
  customerSubscriptions,
  settings,
  
  // دوال مساعدة
  getNextId: (array) => Math.max(...array.map(item => item.id), 0) + 1,
};
