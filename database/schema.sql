-- =====================================================
-- نظام إدارة المغاسل - مخطط قاعدة البيانات
-- Laundry Management System - Database Schema
-- =====================================================

-- جدول المغاسل (للـ SaaS متعدد المستأجرين)
CREATE TABLE laundries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    logo VARCHAR(500),
    tax_number VARCHAR(50),
    commercial_register VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    tax_rate DECIMAL(5,2) DEFAULT 15.00,
    currency VARCHAR(10) DEFAULT 'SAR',
    zatca_device_id VARCHAR(100),
    zatca_certificate TEXT,
    zatca_status ENUM('connected', 'disconnected', 'pending') DEFAULT 'pending',
    subscription_plan ENUM('trial', 'basic', 'pro', 'enterprise') DEFAULT 'trial',
    subscription_start DATE,
    subscription_end DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول الفروع
CREATE TABLE branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_id INT,
    working_hours JSON,
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE
);

-- جدول الأدوار
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    permissions JSON,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE
);

-- جدول المستخدمين
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    branch_id INT,
    role_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    UNIQUE KEY unique_email_per_laundry (laundry_id, email)
);

-- تحديث مدير الفرع
ALTER TABLE branches ADD FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- جدول تصنيفات الخدمات
CREATE TABLE service_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    icon VARCHAR(100),
    color VARCHAR(20),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE
);

-- جدول الخدمات/الأصناف
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description TEXT,
    description_en TEXT,
    price DECIMAL(10,2) NOT NULL,
    unit ENUM('piece', 'kg', 'sqm', 'package', 'hour') DEFAULT 'piece',
    estimated_time INT COMMENT 'بالدقائق',
    image VARCHAR(500),
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

-- جدول أسعار الفروع (لكل فرع سعر مختلف)
CREATE TABLE branch_prices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    service_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_branch_service (branch_id, service_id)
);

-- جدول العملاء
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    notes TEXT,
    preferences JSON,
    is_vip BOOLEAN DEFAULT FALSE,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    whatsapp_opted_in BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
    UNIQUE KEY unique_phone_per_laundry (laundry_id, phone)
);

-- جدول باقات الاشتراكات للعملاء
CREATE TABLE subscription_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT DEFAULT 30,
    items_limit INT COMMENT 'عدد القطع المسموحة',
    kg_limit DECIMAL(10,2) COMMENT 'عدد الكيلوات المسموحة',
    discount_percent DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE
);

-- جدول اشتراكات العملاء
CREATE TABLE customer_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    plan_id INT NOT NULL,
    branch_id INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    items_used INT DEFAULT 0,
    kg_used DECIMAL(10,2) DEFAULT 0,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- جدول الفواتير
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    branch_id INT NOT NULL,
    customer_id INT,
    user_id INT NOT NULL COMMENT 'الكاشير',
    invoice_number VARCHAR(50) NOT NULL,
    
    -- المبالغ
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 15.00,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- الحالة
    status ENUM('draft', 'pending', 'processing', 'ready', 'delivered', 'paid', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid',
    payment_method ENUM('cash', 'card', 'transfer', 'online', 'subscription') DEFAULT 'cash',
    
    -- التواريخ
    due_date DATETIME,
    delivered_at DATETIME,
    paid_at DATETIME,
    
    -- ZATCA
    zatca_uuid VARCHAR(100),
    zatca_hash VARCHAR(500),
    zatca_qr_code TEXT,
    zatca_status ENUM('pending', 'reported', 'cleared', 'rejected') DEFAULT 'pending',
    
    -- معلومات إضافية
    notes TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_invoice_number (laundry_id, invoice_number)
);

-- جدول عناصر الفاتورة
CREATE TABLE invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    service_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- جدول المدفوعات
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'transfer', 'online') NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    received_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- جدول سجل التدقيق (رادار الاحتيال)
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    branch_id INT,
    user_id INT,
    
    -- نوع العملية
    action_type ENUM('create', 'update', 'delete', 'login', 'logout', 'price_change', 'discount_change', 'tax_change', 'invoice_cancel', 'invoice_modify', 'refund') NOT NULL,
    
    -- تفاصيل
    entity_type VARCHAR(50) COMMENT 'invoice, service, customer, etc.',
    entity_id INT,
    old_value JSON,
    new_value JSON,
    description TEXT,
    
    -- معلومات الجهاز
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    -- تصنيف المخاطر
    risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    is_flagged BOOLEAN DEFAULT FALSE,
    reviewed_by INT,
    reviewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- جدول الإشعارات
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    user_id INT,
    type ENUM('order', 'payment', 'alert', 'system', 'whatsapp') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول رسائل الواتساب
CREATE TABLE whatsapp_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    customer_id INT,
    invoice_id INT,
    phone VARCHAR(20) NOT NULL,
    message_type ENUM('invoice_created', 'ready_pickup', 'payment_received', 'reminder', 'custom') NOT NULL,
    message_content TEXT,
    status ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

-- جدول الإعدادات
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    laundry_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (laundry_id) REFERENCES laundries(id) ON DELETE CASCADE,
    UNIQUE KEY unique_setting (laundry_id, setting_key)
);

-- =====================================================
-- الفهارس لتحسين الأداء
-- =====================================================

CREATE INDEX idx_services_laundry ON services(laundry_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_customers_laundry ON customers(laundry_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_invoices_laundry ON invoices(laundry_id);
CREATE INDEX idx_invoices_branch ON invoices(branch_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(created_at);
CREATE INDEX idx_audit_laundry ON audit_logs(laundry_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
CREATE INDEX idx_audit_risk ON audit_logs(risk_level, is_flagged);

-- =====================================================
-- البيانات الافتراضية
-- =====================================================

-- إدراج الأدوار الافتراضية (سيتم إنشاؤها لكل مغسلة جديدة)
-- owner: كل الصلاحيات
-- manager: إدارة الفرع
-- cashier: الفواتير فقط
-- staff: عرض فقط
