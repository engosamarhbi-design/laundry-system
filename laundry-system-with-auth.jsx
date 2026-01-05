import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import JsBarcode from './frontend/src/utils/jsbarcode.js';
import { 
  LayoutDashboard, Package, Users, FileText, Building2, BarChart3, 
  Shield, Settings, Bell, Search, Plus, Edit, Trash2, Eye, 
  Menu, X, LogOut, User, Globe, AlertTriangle, TrendingUp, TrendingDown,
  DollarSign, ShoppingCart, Clock, Check, Printer, CreditCard,
  Lock, Star, RefreshCw, Loader2, Save, Mail, Phone, Building,
  KeyRound, UserPlus, ArrowRight, CheckCircle2, XCircle, EyeOff
} from 'lucide-react';

// =====================================================
// إعدادات API
// =====================================================
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://127.0.0.1:3001/api';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const config = {
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers 
    },
    ...options,
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    // إذا انتهت الجلسة
    if (response.status === 401 && token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
      return;
    }
    
    if (!response.ok) throw new Error(data.message || 'حدث خطأ');
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// =====================================================
// API Services
// =====================================================
const api = {
  auth: {
    login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
    verify: () => apiRequest('/auth/verify'),
    me: () => apiRequest('/auth/me'),
    changePassword: (data) => apiRequest('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  },
  services: {
    getAll: (params = {}) => apiRequest(`/services?${new URLSearchParams(params)}`),
    create: (data) => apiRequest('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/services/${id}`, { method: 'DELETE' }),
    toggle: (id) => apiRequest(`/services/${id}/toggle`, { method: 'PATCH' }),
    getCategories: () => apiRequest('/services/categories'),
    createCategory: (data) => apiRequest('/services/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id, data) => apiRequest(`/services/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id) => apiRequest(`/services/categories/${id}`, { method: 'DELETE' }),
    getStats: (params = {}) => apiRequest(`/services/stats/overview?${new URLSearchParams(params)}`),
  },
  customers: {
    getAll: (params = {}) => apiRequest(`/customers?${new URLSearchParams(params)}`),
    create: (data) => apiRequest('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getById: (id) => apiRequest(`/customers/${id}`),
    delete: (id) => apiRequest(`/customers/${id}`, { method: 'DELETE' }),
  },
  invoices: {
    getAll: (params = {}) => apiRequest(`/invoices?${new URLSearchParams(params)}`),
    getById: (id) => apiRequest(`/invoices/${id}`),
    create: (data) => apiRequest('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status) => apiRequest(`/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    recordPayment: (id, payload = {}) => apiRequest(`/invoices/${id}/payment`, { method: 'POST', body: JSON.stringify(payload) }),
    updateDiscount: (id, discount_percent) => apiRequest(`/invoices/${id}/discount`, { method: 'PATCH', body: JSON.stringify({ discount_percent }) }),
    getStats: (params = {}) => apiRequest(`/invoices/stats/overview?${new URLSearchParams(params)}`),
  },
  branches: {
    getAll: (params = {}) => apiRequest(`/branches?${new URLSearchParams(params)}`),
    getById: (id) => apiRequest(`/branches/${id}`),
    create: (data) => apiRequest('/branches', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggle: (id) => apiRequest(`/branches/${id}/toggle`, { method: 'PATCH' }),
  },
  users: {
    getAll: (params = {}) => apiRequest(`/users?${new URLSearchParams(params)}`),
    getById: (id) => apiRequest(`/users/${id}`),
    create: (data) => apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getRoles: () => apiRequest('/users/roles/list'),
    updateRole: (id, data) => apiRequest(`/users/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggle: (id) => apiRequest(`/users/${id}/toggle`, { method: 'PATCH' }),
    updatePassword: (id, newPassword) => apiRequest(`/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ current_password: '', new_password: newPassword }) }),
  },
  reports: {
    getDashboard: (params = {}) => apiRequest(`/reports/dashboard?${new URLSearchParams(params)}`),
    getSales: (params = {}) => apiRequest(`/reports/sales?${new URLSearchParams(params)}`),
    getCustomers: (params = {}) => apiRequest(`/reports/customers?${new URLSearchParams(params)}`),
    getServices: (params = {}) => apiRequest(`/reports/services?${new URLSearchParams(params)}`),
    getBranches: (params = {}) => apiRequest(`/reports/branches?${new URLSearchParams(params)}`),
    getPayments: (params = {}) => apiRequest(`/reports/payments?${new URLSearchParams(params)}`),
  },
  audit: {
    getAll: (params = {}) => apiRequest(`/audit?${new URLSearchParams(params)}`),
    getById: (id) => apiRequest(`/audit/${id}`),
    review: (id, payload = {}) => apiRequest(`/audit/${id}/review`, { method: 'PATCH', body: JSON.stringify(payload) }),
    getStats: (params = {}) => apiRequest(`/audit/stats/overview?${new URLSearchParams(params)}`),
    flag: (id, payload = {}) => apiRequest(`/audit/${id}/flag`, { method: 'PATCH', body: JSON.stringify(payload) }),
    getTypes: () => apiRequest('/audit/types/list'),
  },
  subscriptions: {
    getPlans: (params = {}) => apiRequest(`/subscriptions/plans?${new URLSearchParams(params)}`),
    createPlan: (data) => apiRequest('/subscriptions/plans', { method: 'POST', body: JSON.stringify(data) }),
    updatePlan: (id, data) => apiRequest(`/subscriptions/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    togglePlan: (id) => apiRequest(`/subscriptions/plans/${id}/toggle`, { method: 'PATCH' }),
    getAll: (params = {}) => apiRequest(`/subscriptions?${new URLSearchParams(params)}`),
    createSubscription: (data) => apiRequest('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
    use: (id, payload = {}) => apiRequest(`/subscriptions/${id}/use`, { method: 'POST', body: JSON.stringify(payload) }),
    cancel: (id) => apiRequest(`/subscriptions/${id}/cancel`, { method: 'PATCH' }),
    renew: (id) => apiRequest(`/subscriptions/${id}/renew`, { method: 'POST' }),
    getStats: (params = {}) => apiRequest(`/subscriptions/stats/overview?${new URLSearchParams(params)}`),
  },
  settings: { getAll: () => apiRequest('/settings'), updateBulk: (settings) => apiRequest('/settings/bulk', { method: 'POST', body: JSON.stringify({ settings }) }) },
  cashDrawer: {
    getCurrent: () => apiRequest('/cash-drawer/current'),
    open: (payload = {}) => apiRequest('/cash-drawer/open', { method: 'POST', body: JSON.stringify(payload) }),
    close: (payload = {}) => apiRequest('/cash-drawer/close', { method: 'POST', body: JSON.stringify(payload) }),
  },
};

const formatMoney = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const hasPermission = (user, key, action) => {
  const perms = user?.role?.permissions;
  if (!perms) return false;
  if (perms.all === true) return true;
  const value = perms[key];
  if (value === true) return true;
  if (typeof value === 'object' && value !== null) {
    if (!action) return true;
    return value[action] === true;
  }
  return false;
};

// ملاحظة: الخصم يُطبَّق على عناصر الفاتورة فقط (ليس على رسوم التوصيل)
const calcInvoicePreviewTotals = (items, discountPercent = 0, taxRate = 15, deliveryFee = 0) => {
  const itemsSubtotal = (items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const safeDeliveryFee = Math.max(0, Number(deliveryFee) || 0);
  const discount = itemsSubtotal * (Number(discountPercent) || 0) / 100;
  const taxable = Math.max(0, itemsSubtotal - discount) + safeDeliveryFee;
  const tax = taxable * (Number(taxRate) || 0) / 100;
  const total = taxable + tax;
  return {
    subtotal: Math.round(itemsSubtotal * 100) / 100,
    deliveryFee: Math.round(safeDeliveryFee * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

// =====================================================
// Auth Context
// =====================================================
const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // التحقق من صلاحية التوكن
      api.auth.verify().catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.auth.login(email, password);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response;
  };

  const register = async (data) => {
    const response = await api.auth.register(data);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response;
  };

  const logout = async () => {
    try { await api.auth.logout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// =====================================================
// Custom Hook for API
// =====================================================
function useApi(apiFunc, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFunc();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}

// =====================================================
// مكونات مشتركة
// =====================================================
const LoadingSpinner = ({ fullScreen }) => (
  <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'p-8'}`}>
    <div className="text-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
      <p className="mt-2 text-slate-500">جاري التحميل...</p>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, title, value, change, changeType, color }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
    <div className="flex items-start justify-between">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <Icon size={24} className="text-white" />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${changeType === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {changeType === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {change}%
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-slate-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  </div>
);

// =====================================================
// صفحة تسجيل الدخول
// =====================================================
const LoginPage = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // بيانات تجريبية للاختبار
  const demoAccounts = [
    { role: 'مالك', email: 'owner@laundry.com', password: 'password123' },
    { role: 'مدير', email: 'manager@laundry.com', password: 'password123' },
    { role: 'كاشير', email: 'cashier@laundry.com', password: 'password123' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center p-4" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); * { font-family: 'Tajawal', sans-serif; }`}</style>
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🧺</span>
          </div>
          <h1 className="text-3xl font-bold text-white">نظام إدارة المغاسل</h1>
          <p className="text-emerald-100 mt-2">مرحباً بعودتك!</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">تسجيل الدخول</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <XCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  required
                  dir="ltr"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                <span className="text-slate-600">تذكرني</span>
              </label>
              <button type="button" className="text-emerald-600 hover:text-emerald-700 font-medium">
                نسيت كلمة المرور؟
              </button>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <KeyRound size={20} />}
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-slate-600">
              ليس لديك حساب؟{' '}
              <button onClick={onSwitchToRegister} className="text-emerald-600 hover:text-emerald-700 font-bold">
                سجل الآن مجاناً
              </button>
            </p>
          </div>
        </div>
        
        {/* Demo Accounts */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-emerald-100 text-sm text-center mb-3">حسابات تجريبية للاختبار:</p>
          <div className="space-y-2">
            {demoAccounts.map((acc, i) => (
              <button
                key={i}
                onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                className="w-full flex items-center justify-between p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                <span className="font-medium">{acc.role}</span>
                <span className="text-emerald-200">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// صفحة التسجيل
// =====================================================
const RegisterPage = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    laundry_name: '',
    owner_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    setLoading(true);
    
    try {
      await register({
        laundry_name: formData.laundry_name,
        owner_name: formData.owner_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center p-4" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); * { font-family: 'Tajawal', sans-serif; }`}</style>
      
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🧺</span>
          </div>
          <h1 className="text-3xl font-bold text-white">نظام إدارة المغاسل</h1>
          <p className="text-emerald-100 mt-2">ابدأ فترتك التجريبية المجانية - 14 يوم</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">إنشاء حساب جديد</h2>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>1</div>
              <span className="text-sm font-medium">المغسلة</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>2</div>
              <span className="text-sm font-medium">الحساب</span>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <XCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم المغسلة</label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      name="laundry_name"
                      value={formData.laundry_name}
                      onChange={handleChange}
                      placeholder="مثال: مغسلة النظافة"
                      className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم المالك</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      name="owner_name"
                      value={formData.owner_name}
                      onChange={handleChange}
                      placeholder="الاسم الكامل"
                      className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">رقم الجوال</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="05xxxxxxxx"
                      className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    if (formData.laundry_name && formData.owner_name && formData.phone) {
                      setStep(2);
                    } else {
                      setError('جميع الحقول مطلوبة');
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  التالي
                  <ArrowRight size={20} />
                </button>
              </>
            )}
            
            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="6 أحرف على الأقل"
                      className="w-full pr-10 pl-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                      dir="ltr"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="أعد كتابة كلمة المرور"
                      className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-200 rounded-xl font-medium hover:bg-slate-50">
                    رجوع
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                    {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
                  </button>
                </div>
              </>
            )}
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-slate-600">
              لديك حساب بالفعل؟{' '}
              <button onClick={onSwitchToLogin} className="text-emerald-600 hover:text-emerald-700 font-bold">
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
        
        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: CheckCircle2, text: 'فترة تجريبية 14 يوم' },
            { icon: CheckCircle2, text: 'بدون بطاقة ائتمان' },
            { icon: CheckCircle2, text: 'دعم فني مجاني' }
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-white text-sm bg-white/10 rounded-xl p-2 justify-center">
              <f.icon size={16} className="text-emerald-200" />
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// الشريط الجانبي
// =====================================================
const Sidebar = ({ isOpen, setIsOpen, currentPage, setCurrentPage, lang, user }) => {
  const { logout } = useAuth();
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard' },
    { id: 'services', icon: Package, label: lang === 'ar' ? 'الأصناف' : 'Services' },
    { id: 'customers', icon: Users, label: lang === 'ar' ? 'العملاء' : 'Customers' },
    { id: 'invoices', icon: FileText, label: lang === 'ar' ? 'الفواتير' : 'Invoices' },
    { id: 'branches', icon: Building2, label: lang === 'ar' ? 'الفروع' : 'Branches' },
    { id: 'reports', icon: BarChart3, label: lang === 'ar' ? 'التقارير' : 'Reports' },
    { id: 'users', icon: Shield, label: lang === 'ar' ? 'المستخدمين' : 'Users', permissionKey: 'users' },
    { id: 'audit', icon: AlertTriangle, label: lang === 'ar' ? 'رادار الاحتيال' : 'Fraud', roles: [1, 2] },
    { id: 'subscriptions', icon: CreditCard, label: lang === 'ar' ? 'الاشتراكات' : 'Subscriptions' },
    { id: 'settings', icon: Settings, label: lang === 'ar' ? 'الإعدادات' : 'Settings', permissionKey: 'settings' },
  ];

  // فلترة الصفحات حسب الصلاحيات
  const filteredItems = menuItems.filter(item => {
    if (item.permissionKey) return hasPermission(user, item.permissionKey);
    return !item.roles || item.roles.includes(user?.role?.id);
  });

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed top-0 ${lang === 'ar' ? 'right-0' : 'left-0'} h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-50 transform transition-transform ${isOpen ? 'translate-x-0' : lang === 'ar' ? 'translate-x-full' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">🧺</div>
            <div>
              <h1 className="font-bold text-emerald-400">{lang === 'ar' ? 'نظام المغاسل' : 'Laundry Pro'}</h1>
              <p className="text-xs text-slate-400">{user?.role?.name || 'مستخدم'}</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-180px)]">
          {filteredItems.map((item) => (
            <button key={item.id} onClick={() => { setCurrentPage(item.id); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${currentPage === item.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-700/50'}`}>
              <item.icon size={18} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center font-bold">
              {user?.name?.charAt(0) || 'م'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors">
            <LogOut size={16} />
            <span className="text-sm">{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// =====================================================
// الهيدر
// =====================================================
const Header = ({ setIsOpen, lang, setLang, user }) => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
    <div className="flex items-center justify-between px-4 py-3">
      <button onClick={() => setIsOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl">
        <Menu size={24} />
      </button>
      <div className="flex-1 hidden md:block px-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="بحث..." className="w-full pr-10 pl-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm flex items-center gap-2">
          <Globe size={16} />
          {lang === 'ar' ? 'EN' : 'عربي'}
        </button>
        <button className="relative p-2 bg-slate-100 hover:bg-slate-200 rounded-xl">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
        </button>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0)}
          </div>
          <span className="text-sm font-medium text-emerald-700">{user?.name?.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  </header>
);

// =====================================================
// صفحة لوحة التحكم
// =====================================================
const CashDrawerCard = ({ lang, showToast }) => {
  const { user } = useAuth();

  const allowed = hasPermission(user, 'all') || hasPermission(user, 'cash_drawer');
  if (!allowed) return null;

  const branchId = user?.branch?.id;
  if (!branchId) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Lock size={18} className="text-slate-600" /></div>
          <div>
            <h2 className="font-bold">إدارة الصندوق</h2>
            <p className="text-sm text-slate-600 mt-1">لا يمكن استخدام الصندوق لأن الحساب غير مرتبط بفرع.</p>
            <p className="text-xs text-slate-500 mt-2">اذهب إلى صفحة المستخدمين وحدد الفرع للمستخدم (ولا تختار “جميع الفروع”) ثم سجّل خروج/دخول.</p>
          </div>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [session, setSession] = useState(null);
  const [expected, setExpected] = useState(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [openNotes, setOpenNotes] = useState('');
  const [countedCash, setCountedCash] = useState('0');
  const [countedCard, setCountedCard] = useState('0');
  const [countedTransfer, setCountedTransfer] = useState('0');
  const [closeNotes, setCloseNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastCloseResult, setLastCloseResult] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.cashDrawer.getCurrent();
      const data = res.data;
      setActive(!!data.active);
      setSession(data.session || null);
      setExpected(data.expected || null);
      setLastCloseResult(null);

      if (data.active && data.expected) {
        // convenience defaults: set counted to expected (can be edited)
        setCountedCash(String(data.expected.cash ?? 0));
        setCountedCard(String(data.expected.card ?? 0));
        setCountedTransfer(String(data.expected.transfer ?? 0));
      }
    } catch (err) {
      // backend requires auth + branch association
      showToast(err.message || (lang === 'ar' ? 'تعذر تحميل الصندوق' : 'Failed to load cash drawer'), 'error');
      setActive(false);
      setSession(null);
      setExpected(null);
    } finally {
      setLoading(false);
    }
  }, [lang, showToast]);

  useEffect(() => { refresh(); }, [refresh]);

  const openShift = async () => {
    try {
      setSaving(true);
      const opening = Number(openingCash);
      if (Number.isNaN(opening) || opening < 0) {
        showToast(lang === 'ar' ? 'مبلغ الافتتاح غير صحيح' : 'Invalid opening cash', 'error');
        return;
      }
      await api.cashDrawer.open({ opening_cash: opening, notes: openNotes || undefined });
      showToast(lang === 'ar' ? 'تم فتح الوردية' : 'Shift opened', 'success');
      setOpenNotes('');
      await refresh();
    } catch (err) {
      showToast(err.message || (lang === 'ar' ? 'فشل فتح الوردية' : 'Failed to open shift'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const closeShift = async () => {
    try {
      setSaving(true);
      const cCash = Number(countedCash);
      const cCard = Number(countedCard);
      const cTransfer = Number(countedTransfer);
      if ([cCash, cCard, cTransfer].some((v) => Number.isNaN(v) || v < 0)) {
        showToast(lang === 'ar' ? 'القيم المدخلة غير صحيحة' : 'Invalid amounts', 'error');
        return;
      }
      const res = await api.cashDrawer.close({
        counted_cash: cCash,
        counted_card: cCard,
        counted_transfer: cTransfer,
        notes: closeNotes || undefined,
      });
      setLastCloseResult(res.data);
      showToast(lang === 'ar' ? 'تم إغلاق الوردية' : 'Shift closed', 'success');
      setCloseNotes('');
      await refresh();
    } catch (err) {
      showToast(err.message || (lang === 'ar' ? 'فشل إغلاق الوردية' : 'Failed to close shift'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const money = (v) => `${formatMoney(v ?? 0)} ر.س`;

  return (
    <div className="bg-white rounded-2xl border p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">إدارة الصندوق</h2>
          <p className="text-sm text-slate-500 mt-1">فتح وردية/إغلاق وردية + ملخص نقدي/شبكة/تحويل + فروقات</p>
        </div>
        <button onClick={refresh} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl" title="تحديث">
          <RefreshCw size={18} />
        </button>
      </div>

      {loading ? (
        <div className="py-6"><LoadingSpinner /></div>
      ) : (
        <>
          {!user?.branch?.id && user?.branch !== null ? null : null}

          {!active ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رصيد افتتاح الصندوق (نقدي)</label>
                <input value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} className="w-full px-3 py-2 border rounded-xl" dir="ltr" type="number" min="0" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظة (اختياري)</label>
                <input value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button onClick={openShift} disabled={saving} className="h-11 px-5 bg-emerald-500 text-white rounded-xl disabled:opacity-60">
                  {saving ? <Loader2 className="inline w-4 h-4 animate-spin ml-2" /> : null}
                  فتح وردية
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">حالة الوردية</p>
                  <p className="font-bold mt-1 text-emerald-700">مفتوحة</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">وقت الفتح</p>
                  <p className="font-medium mt-1" dir="ltr">{session?.opened_at || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">رصيد الافتتاح (نقدي)</p>
                  <p className="font-bold mt-1" dir="ltr">{money(session?.opening_cash)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">عدد الفواتير (مدفوعة)</p>
                  <p className="font-bold mt-1" dir="ltr">{expected?.count ?? '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border rounded-2xl p-4">
                  <p className="font-medium">الملخص المتوقع</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">نقدي</span><span className="font-medium" dir="ltr">{money(expected?.cash)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">شبكة/بطاقة</span><span className="font-medium" dir="ltr">{money(expected?.card)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">تحويل</span><span className="font-medium" dir="ltr">{money(expected?.transfer)}</span></div>
                    <div className="flex justify-between font-bold pt-2 border-t"><span>الإجمالي</span><span className="text-emerald-700" dir="ltr">{money((expected?.cash ?? 0) + (expected?.card ?? 0) + (expected?.transfer ?? 0))}</span></div>
                  </div>
                </div>

                <div className="md:col-span-2 border rounded-2xl p-4">
                  <p className="font-medium">إغلاق الوردية (المعدود)</p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">نقدي</label>
                      <input value={countedCash} onChange={(e) => setCountedCash(e.target.value)} className="w-full px-3 py-2 border rounded-xl" dir="ltr" type="number" min="0" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">شبكة/بطاقة</label>
                      <input value={countedCard} onChange={(e) => setCountedCard(e.target.value)} className="w-full px-3 py-2 border rounded-xl" dir="ltr" type="number" min="0" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">تحويل</label>
                      <input value={countedTransfer} onChange={(e) => setCountedTransfer(e.target.value)} className="w-full px-3 py-2 border rounded-xl" dir="ltr" type="number" min="0" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs text-slate-500 mb-1">ملاحظة (اختياري)</label>
                      <input value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button onClick={closeShift} disabled={saving} className="h-11 px-5 bg-red-600 text-white rounded-xl disabled:opacity-60">
                      {saving ? <Loader2 className="inline w-4 h-4 animate-spin ml-2" /> : null}
                      إغلاق وردية
                    </button>
                  </div>

                  {lastCloseResult?.variance ? (
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border">
                      <p className="font-medium">الفروقات</p>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div className="flex justify-between md:block"><span className="text-slate-500">نقدي</span><span className={`${(lastCloseResult.variance.cash || 0) === 0 ? '' : (lastCloseResult.variance.cash > 0 ? 'text-emerald-700' : 'text-red-700')} font-medium`} dir="ltr">{formatMoney(lastCloseResult.variance.cash)} ر.س</span></div>
                        <div className="flex justify-between md:block"><span className="text-slate-500">شبكة</span><span className={`${(lastCloseResult.variance.card || 0) === 0 ? '' : (lastCloseResult.variance.card > 0 ? 'text-emerald-700' : 'text-red-700')} font-medium`} dir="ltr">{formatMoney(lastCloseResult.variance.card)} ر.س</span></div>
                        <div className="flex justify-between md:block"><span className="text-slate-500">تحويل</span><span className={`${(lastCloseResult.variance.transfer || 0) === 0 ? '' : (lastCloseResult.variance.transfer > 0 ? 'text-emerald-700' : 'text-red-700')} font-medium`} dir="ltr">{formatMoney(lastCloseResult.variance.transfer)} ر.س</span></div>
                        <div className="flex justify-between md:block"><span className="text-slate-500">الإجمالي</span><span className={`${(lastCloseResult.variance.total || 0) === 0 ? '' : (lastCloseResult.variance.total > 0 ? 'text-emerald-700' : 'text-red-700')} font-bold`} dir="ltr">{formatMoney(lastCloseResult.variance.total)} ر.س</span></div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const DashboardPage = ({ lang, showToast }) => {
  const { user } = useAuth();
  const { data: stats, loading, refetch } = useApi(() => api.reports.getDashboard());
  const { data: invoices } = useApi(() => api.invoices.getAll({ limit: 5 }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مرحباً، {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">إليك ملخص أداء مغسلتك</p>
        </div>
        <button onClick={refetch} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl"><RefreshCw size={18} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} title="مبيعات اليوم" value={`${stats?.today?.sales?.toLocaleString() || 0} ر.س`} change={12} changeType="up" color="from-emerald-400 to-teal-500" />
        <StatCard icon={ShoppingCart} title="طلبات اليوم" value={stats?.today?.orders || 0} change={8} changeType="up" color="from-blue-400 to-indigo-500" />
        <StatCard icon={Clock} title="معلقة" value={stats?.pending_orders || 0} color="from-amber-400 to-orange-500" />
        <StatCard icon={Users} title="العملاء" value={stats?.total_customers || 0} color="from-purple-400 to-pink-500" />
      </div>

      <CashDrawerCard lang={lang} showToast={showToast} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border">
          <h2 className="font-bold mb-4">ملخص الشهر</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{stats?.month?.sales?.toLocaleString() || 0}</p>
              <p className="text-sm text-slate-500">إيرادات الشهر</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{stats?.month?.orders || 0}</p>
              <p className="text-sm text-slate-500">طلبات الشهر</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border">
          <h2 className="font-bold mb-4">آخر الفواتير</h2>
          <div className="space-y-2">
            {invoices?.slice(0, 4).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-sm">{inv.customer_name || 'عميل نقدي'}</p>
                  <p className="text-xs text-slate-500">{inv.invoice_number}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-emerald-600">{inv.total} ر.س</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {inv.status === 'paid' ? 'مدفوعة' : 'معلقة'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// باقي الصفحات (مختصرة للإيجاز)
// =====================================================
const ServicesPage = ({ lang, showToast }) => {
  const { user } = useAuth();
  const canView = hasPermission(user, 'services', 'view') || hasPermission(user, 'services');
  const canCreate = hasPermission(user, 'services', 'create');
  const canUpdate = hasPermission(user, 'services', 'update');
  const canDelete = hasPermission(user, 'services', 'delete');

  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ category_id: '', is_active: '', page: 1, limit: 50 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const emptyServiceForm = {
    name: '',
    name_en: '',
    category_id: '',
    price: '',
    unit: 'piece',
    estimated_time: '',
    barcode: '',
    description: '',
    description_en: '',
  };
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [savingService, setSavingService] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const emptyCategoryForm = { name: '', name_en: '', icon: '', color: '', is_active: true };
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchAll = useCallback(async () => {
    if (!canView) return;
    try {
      setLoading(true);
      const params = {
        ...filters,
        ...(search ? { search } : {}),
      };
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k];
      });

      const [statsRes, catsRes, servicesRes] = await Promise.all([
        api.services.getStats(),
        api.services.getCategories(),
        api.services.getAll(params),
      ]);

      setStats(statsRes.data || null);
      setCategories(catsRes.data || []);
      setServices(servicesRes.data || []);
      setPagination(servicesRes.pagination || null);
    } catch (err) {
      showToast(err.message || 'حدث خطأ', 'error');
    } finally {
      setLoading(false);
    }
  }, [canView, filters, search, showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreateService = () => {
    setEditingService(null);
    setServiceForm(emptyServiceForm);
    setShowServiceModal(true);
  };

  const openEditService = (svc) => {
    setEditingService(svc);
    setServiceForm({
      ...emptyServiceForm,
      name: svc.name || '',
      name_en: svc.name_en || '',
      category_id: svc.category_id || '',
      price: svc.price ?? '',
      unit: svc.unit || 'piece',
      estimated_time: svc.estimated_time ?? '',
      barcode: svc.barcode || '',
      description: svc.description || '',
      description_en: svc.description_en || '',
    });
    setShowServiceModal(true);
  };

  const saveService = async () => {
    if (!serviceForm.name?.trim() || serviceForm.price === '') {
      showToast('اسم الخدمة والسعر مطلوبان', 'error');
      return;
    }
    try {
      setSavingService(true);
      const payload = {
        name: serviceForm.name.trim(),
        name_en: serviceForm.name_en?.trim() || serviceForm.name.trim(),
        category_id: serviceForm.category_id ? Number(serviceForm.category_id) : null,
        price: Number(serviceForm.price),
        unit: serviceForm.unit,
        estimated_time: serviceForm.estimated_time === '' ? null : Number(serviceForm.estimated_time),
        barcode: serviceForm.barcode?.trim() || null,
        description: serviceForm.description?.trim() || '',
        description_en: serviceForm.description_en?.trim() || '',
      };
      if (editingService) {
        await api.services.update(editingService.id, payload);
        showToast('تم تحديث الخدمة', 'success');
      } else {
        await api.services.create(payload);
        showToast('تم إضافة الخدمة', 'success');
      }
      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm(emptyServiceForm);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل الحفظ', 'error');
    } finally {
      setSavingService(false);
    }
  };

  const toggleService = async (svc) => {
    try {
      await api.services.toggle(svc.id);
      showToast('تم تحديث حالة الخدمة', 'success');
      fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل الإجراء', 'error');
    }
  };

  const deleteService = async (svc) => {
    const ok = window.confirm(`هل تريد حذف الخدمة "${svc.name}"؟`);
    if (!ok) return;
    try {
      await api.services.delete(svc.id);
      showToast('تم حذف الخدمة', 'success');
      fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل الحذف', 'error');
    }
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      ...emptyCategoryForm,
      name: cat.name || '',
      name_en: cat.name_en || '',
      icon: cat.icon || '',
      color: cat.color || '',
      is_active: cat.is_active !== false,
    });
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name?.trim()) {
      showToast('اسم التصنيف مطلوب', 'error');
      return;
    }
    try {
      setSavingCategory(true);
      const payload = {
        name: categoryForm.name.trim(),
        name_en: categoryForm.name_en?.trim() || categoryForm.name.trim(),
        icon: categoryForm.icon?.trim() || 'folder',
        color: categoryForm.color?.trim() || '#6B7280',
        is_active: !!categoryForm.is_active,
      };
      if (editingCategory) {
        await api.services.updateCategory(editingCategory.id, payload);
        showToast('تم تحديث التصنيف', 'success');
      } else {
        await api.services.createCategory(payload);
        showToast('تم إضافة التصنيف', 'success');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm(emptyCategoryForm);
      fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل الحفظ', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const deleteCategory = async (cat) => {
    const ok = window.confirm(`هل تريد حذف التصنيف "${cat.name}"؟`);
    if (!ok) return;
    try {
      await api.services.deleteCategory(cat.id);
      showToast('تم حذف التصنيف', 'success');
      fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل الحذف', 'error');
    }
  };

  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Lock size={18} className="text-slate-600" /></div>
          <div>
            <h2 className="font-bold">لا تملك صلاحية الوصول</h2>
            <p className="text-sm text-slate-600 mt-1">هذه الصفحة مقيدة حسب الصلاحيات.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
        <div>
          <h1 className="text-2xl font-bold">الأصناف والخدمات</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة الخدمات والتصنيفات مع إحصائيات الاستخدام.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="px-4 py-2 border rounded-xl flex items-center gap-2"><RefreshCw size={16} /> تحديث</button>
          {canCreate && (
            <>
              <button onClick={openCreateCategory} className="px-4 py-2 border rounded-xl flex items-center gap-2"><Plus size={16} />تصنيف</button>
              <button onClick={openCreateService} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2"><Plus size={16} />خدمة</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border p-4"><p className="text-sm text-slate-500">إجمالي الخدمات</p><p className="text-2xl font-bold mt-1">{stats?.total ?? '—'}</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-sm text-slate-500">نشطة</p><p className="text-2xl font-bold mt-1 text-emerald-600">{stats?.active ?? '—'}</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-sm text-slate-500">معطلة</p><p className="text-2xl font-bold mt-1">{stats?.inactive ?? '—'}</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-sm text-slate-500">التصنيفات</p><p className="text-2xl font-bold mt-1">{stats?.categories ?? (categories?.length || 0)}</p></div>
      </div>

      {stats?.topServices?.length ? (
        <div className="bg-white rounded-2xl border p-4">
          <h2 className="font-bold mb-3">الأكثر استخداماً</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {stats.topServices.map((s) => (
              <div key={s.id} className="bg-slate-50 rounded-xl p-3 border">
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-slate-500 mt-1">الاستخدام: {s.usage}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">بحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="بحث بالاسم..." className="w-full pr-9 pl-3 py-2 border rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">التصنيف</label>
            <select value={filters.category_id} onChange={(e) => setFilters({ ...filters, page: 1, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">كل التصنيفات</option>
              {(categories || []).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">الحالة</label>
            <select value={filters.is_active} onChange={(e) => setFilters({ ...filters, page: 1, is_active: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">الكل</option>
              <option value="true">نشط</option>
              <option value="false">معطل</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">التصنيفات</h2>
          <span className="text-sm text-slate-500">{categories?.length || 0}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700">التصنيف</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700">الحالة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(categories || []).map((c) => (
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-slate-500" dir="ltr">{c.name_en}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{c.is_active ? 'نشط' : 'معطل'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditCategory(c)} disabled={!canUpdate} className="p-2 border rounded-lg disabled:opacity-60"><Edit size={16} /></button>
                      <button onClick={() => deleteCategory(c)} disabled={!canDelete} className="p-2 border rounded-lg text-red-600 disabled:opacity-60"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!categories || categories.length === 0) && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-slate-500">لا توجد تصنيفات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">الخدمات</h2>
          <span className="text-sm text-slate-500">{pagination ? `${pagination.total} خدمة` : `${services?.length || 0} خدمة`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700">الخدمة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700">التصنيف</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700">الوحدة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700">السعر</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700">الوقت</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700">الحالة</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(services || []).map((s) => (
                <tr key={s.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-slate-500" dir="ltr">{s.name_en}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{s.category_name || '—'}</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">{s.unit}</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600" dir="ltr">{formatMoney(s.price)} SAR</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">{s.estimated_time ? `${s.estimated_time}m` : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleService(s)} disabled={!canUpdate} className={`px-2 py-1 rounded-full text-xs disabled:opacity-60 ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{s.is_active ? 'نشط' : 'معطل'}</button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditService(s)} disabled={!canUpdate} className="p-2 border rounded-lg disabled:opacity-60"><Edit size={16} /></button>
                      <button onClick={() => deleteService(s)} disabled={!canDelete} className="p-2 border rounded-lg text-red-600 disabled:opacity-60"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!services || services.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">لا توجد خدمات</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="p-4 border-t flex items-center justify-between">
            <button
              onClick={() => setFilters({ ...filters, page: Math.max(1, Number(filters.page) - 1) })}
              disabled={Number(filters.page) <= 1}
              className="px-4 py-2 border rounded-xl disabled:opacity-60"
            >السابق</button>
            <p className="text-sm text-slate-600" dir="ltr">{pagination.page} / {pagination.totalPages}</p>
            <button
              onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, Number(filters.page) + 1) })}
              disabled={Number(filters.page) >= pagination.totalPages}
              className="px-4 py-2 border rounded-xl disabled:opacity-60"
            >التالي</button>
          </div>
        )}
      </div>

      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{editingService ? 'تعديل خدمة' : 'إضافة خدمة'}</h3>
              <button onClick={() => setShowServiceModal(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الاسم (عربي)</label>
                  <input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الاسم (EN)</label>
                  <input value={serviceForm.name_en} onChange={(e) => setServiceForm({ ...serviceForm, name_en: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">التصنيف</label>
                  <select value={serviceForm.category_id} onChange={(e) => setServiceForm({ ...serviceForm, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                    <option value="">بدون تصنيف</option>
                    {(categories || []).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">السعر</label>
                  <input type="number" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الوحدة</label>
                  <select value={serviceForm.unit} onChange={(e) => setServiceForm({ ...serviceForm, unit: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                    <option value="piece">piece</option>
                    <option value="kg">kg</option>
                    <option value="sqm">sqm</option>
                    <option value="package">package</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الوقت التقديري (دقيقة)</label>
                  <input type="number" value={serviceForm.estimated_time} onChange={(e) => setServiceForm({ ...serviceForm, estimated_time: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Barcode (اختياري)</label>
                  <input value={serviceForm.barcode} onChange={(e) => setServiceForm({ ...serviceForm, barcode: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">وصف (اختياري)</label>
                  <input value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description (EN)</label>
                  <input value={serviceForm.description_en} onChange={(e) => setServiceForm({ ...serviceForm, description_en: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={() => setShowServiceModal(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={saveService} disabled={savingService || !(editingService ? canUpdate : canCreate)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60">
                {savingService ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{editingCategory ? 'تعديل تصنيف' : 'إضافة تصنيف'}</h3>
              <button onClick={() => setShowCategoryModal(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم التصنيف (عربي)</label>
                  <input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم التصنيف (EN)</label>
                  <input value={categoryForm.name_en} onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">icon (اختياري)</label>
                  <input value={categoryForm.icon} onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">color (اختياري)</label>
                  <input value={categoryForm.color} onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 border rounded-xl">
                <input type="checkbox" checked={!!categoryForm.is_active} onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })} />
                <div>
                  <p className="font-medium">تصنيف نشط</p>
                  <p className="text-xs text-slate-500">يمكن تعطيل التصنيف بدلاً من حذفه</p>
                </div>
              </label>
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={saveCategory} disabled={savingCategory || !(editingCategory ? canUpdate : canCreate)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60">
                {savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomersPage = ({ lang, showToast }) => {
  const emptyCustomerForm = {
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
    is_vip: false,
    whatsapp_opted_in: true,
  };

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [vipOnly, setVipOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: customers, loading, refetch } = useApi(
    () => {
      const params = { limit: 200 };
      if (search) params.search = search;
      if (vipOnly) params.is_vip = 'true';
      return api.customers.getAll(params);
    },
    [search, vipOnly]
  );

  const openCreate = () => {
    setEditingCustomer(null);
    setCustomerForm(emptyCustomerForm);
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      ...emptyCustomerForm,
      ...customer,
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const submitCustomer = async () => {
    try {
      if (!customerForm.name?.trim() || !customerForm.phone?.trim()) {
        showToast('اسم العميل ورقم الجوال مطلوبان', 'error');
        return;
      }

      setSaving(true);
      const payload = {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email?.trim() || null,
        address: customerForm.address?.trim() || null,
        city: customerForm.city?.trim() || null,
        notes: customerForm.notes?.trim() || null,
        is_vip: !!customerForm.is_vip,
        whatsapp_opted_in: !!customerForm.whatsapp_opted_in,
      };

      if (editingCustomer) {
        await api.customers.update(editingCustomer.id, payload);
        showToast('تم تحديث العميل', 'success');
      } else {
        await api.customers.create(payload);
        showToast('تم إضافة العميل', 'success');
      }

      setShowModal(false);
      setEditingCustomer(null);
      setCustomerForm(emptyCustomerForm);
      refetch();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async (customer) => {
    const ok = window.confirm(`هل تريد حذف العميل "${customer.name}"؟`);
    if (!ok) return;
    try {
      await api.customers.delete(customer.id);
      showToast('تم حذف العميل', 'success');
      refetch();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading && !customers) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">العملاء</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة العملاء وإضافة/تعديل البيانات</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl">
          <UserPlus size={18} />إضافة عميل
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="بحث بالاسم أو الجوال أو البريد"
              className="w-full pr-10 pl-3 py-2 border rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVipOnly(false)}
              className={`px-3 py-2 rounded-xl border text-sm ${!vipOnly ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white'}`}
            >
              الكل
            </button>
            <button
              onClick={() => setVipOnly(true)}
              className={`px-3 py-2 rounded-xl border text-sm ${vipOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white'}`}
            >
              VIP
            </button>
            <button onClick={refetch} className="px-3 py-2 rounded-xl border" title="تحديث">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          جاري تحديث البيانات...
        </div>
      )}

      {(!customers || customers.length === 0) ? (
        <div className="bg-white rounded-2xl border p-10 text-center">
          <Users className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 font-medium">لا يوجد عملاء</p>
          <p className="text-sm text-slate-500 mt-1">ابدأ بإضافة أول عميل.</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl">
            <UserPlus size={18} />إضافة عميل
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    {(c.name || '?').charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {c.name}
                      {c.is_vip && <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs"><Star size={12} className="fill-amber-500 text-amber-500" />VIP</span>}
                    </h3>
                    <p className="text-sm text-slate-500" dir="ltr">{c.phone}</p>
                    {c.email && <p className="text-xs text-slate-400" dir="ltr">{c.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-xl border hover:bg-slate-50" title="تعديل">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteCustomer(c)} className="p-2 rounded-xl border hover:bg-slate-50 text-red-600" title="حذف">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {(c.subscription?.plan_name) && (
                <div className="mb-3 p-3 rounded-xl bg-slate-50 border">
                  <p className="text-sm font-medium">اشتراك: {c.subscription.plan_name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    الاستخدام: {c.subscription.items_used}/{c.subscription.items_limit} • ينتهي: {c.subscription.end_date}
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t">
                <div>
                  <p className="font-bold">{c.total_orders}</p>
                  <p className="text-xs text-slate-500">طلب</p>
                </div>
                <div>
                  <p className="font-bold text-emerald-600">{formatMoney(c.total_spent)} ر.س</p>
                  <p className="text-xs text-slate-500">إجمالي</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{editingCustomer ? 'تعديل عميل' : 'إضافة عميل'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اسم العميل</label>
                <input
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="مثال: أحمد محمد"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">رقم الجوال</label>
                  <input
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني (اختياري)</label>
                  <input
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">المدينة (اختياري)</label>
                  <input
                    value={customerForm.city}
                    onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    placeholder="الرياض"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">العنوان (اختياري)</label>
                  <input
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                    placeholder="الحي - الشارع"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظات (اختياري)</label>
                <textarea
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl min-h-[90px]"
                  placeholder="ملاحظات خاصة عن العميل"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!customerForm.is_vip}
                    onChange={(e) => setCustomerForm({ ...customerForm, is_vip: e.target.checked })}
                  />
                  عميل VIP
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!customerForm.whatsapp_opted_in}
                    onChange={(e) => setCustomerForm({ ...customerForm, whatsapp_opted_in: e.target.checked })}
                  />
                  تفعيل إشعارات واتساب
                </label>
              </div>
            </div>

            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button
                onClick={submitCustomer}
                disabled={saving}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InvoicesPage = ({ lang, showToast }) => {
  const { user } = useAuth();
  const { data: customers } = useApi(() => api.customers.getAll({ limit: 200 }));
  const { data: services } = useApi(() => api.services.getAll({ limit: 200 }));
  const { data: branches } = useApi(() => api.branches.getAll());

  const isCourier = user?.role?.id === 5;

  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    branch_id: '',
    customer_id: '',
    status: '',
    payment_status: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 50,
  });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [statusDraft, setStatusDraft] = useState('pending');

  const [showPayment, setShowPayment] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: 'cash', reference_number: '', notes: '' });

  const [showDiscount, setShowDiscount] = useState(false);
  const [discountSaving, setDiscountSaving] = useState(false);
  const [discountDraft, setDiscountDraft] = useState('');

  const [printingId, setPrintingId] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '',
    branch_id: '1',
    discount_percent: 0,
    payment_method: 'cash',
    delivery_required: false,
    delivery_address: '',
    delivery_fee: '',
    courier_name: '',
    courier_phone: '',
    items: [{ service_id: '', quantity: 1, unit_price: '' }]
  });

  useEffect(() => {
    if (!isCourier) return;
    if (!user?.branch?.id) return;
    const bid = String(user.branch.id);

    setInvoiceForm((prev) => ({ ...prev, branch_id: bid }));
    setFilters((prev) => ({ ...prev, branch_id: bid }));
  }, [isCourier, user?.branch?.id]);

  const statusOptions = [
    { value: 'draft', label: 'مسودة' },
    { value: 'pending', label: 'معلقة' },
    { value: 'processing', label: 'قيد المعالجة' },
    { value: 'ready', label: 'جاهزة' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'paid', label: 'مدفوعة' },
    { value: 'cancelled', label: 'ملغاة' },
  ];

  const statusLabel = (status) => {
    const found = statusOptions.find((s) => s.value === status);
    return found ? found.label : status;
  };

  const paymentMethodLabel = (method) => {
    if (method === 'cash') return 'نقداً';
    if (method === 'card') return 'بطاقة';
    if (method === 'transfer') return 'تحويل';
    if (method === 'online') return 'إلكتروني';
    return method || '-';
  };

  const paymentStatusLabel = (status) => {
    if (status === 'paid') return 'مدفوع';
    if (status === 'unpaid') return 'غير مدفوع';
    return status || '-';
  };

  const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const buildBarcodeSvg = (value) => {
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, value, {
        format: 'CODE128',
        displayValue: false,
        height: 52,
        margin: 0,
      });
      return svg.outerHTML;
    } catch {
      return '';
    }
  };

  const buildInvoicePrintContext = (inv) => {
    const barcodeValue = String(inv.invoice_number || inv.id || '');
    const barcodeSvg = barcodeValue ? buildBarcodeSvg(barcodeValue) : '';
    const zatcaQrImg = inv.zatca_qr_image ? String(inv.zatca_qr_image) : '';
    const vatNumber = inv.zatca_vat_number || inv.zatcaVatNumber || inv.vat_number || '';

    const items = Array.isArray(inv.items) ? inv.items : [];
    const itemsRows = items
      .map((it) => {
        const name = escapeHtml(it.name || it.service_name || '—');
        const qty = escapeHtml(it.quantity ?? '');
        const price = escapeHtml(formatMoney(it.unit_price ?? 0));
        const total = escapeHtml(formatMoney(it.total ?? (Number(it.quantity) * Number(it.unit_price))));
        return `
          <tr>
            <td>${name}</td>
            <td class="ltr">${qty}</td>
            <td class="ltr">${price}</td>
            <td class="ltr"><b>${total}</b></td>
          </tr>
        `;
      })
      .join('');

    return { barcodeValue, barcodeSvg, zatcaQrImg, vatNumber, itemsRows };
  };

  const buildPrintHtmlPos = (inv) => {
    const { barcodeValue, barcodeSvg, zatcaQrImg, vatNumber, itemsRows } = buildInvoicePrintContext(inv);
    return `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>طباعة فاتورة ${escapeHtml(inv.invoice_number || inv.id || '')}</title>
  <style>
    :root { color-scheme: light; }
    /* POS / Thermal receipt (80mm) */
    @page { size: 80mm auto; margin: 0mm; }
    body { font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif; margin: 0; background: #fff; color: #0f172a; }
    .page { width: 80mm; margin: 0 auto; padding: 6mm 4mm; box-sizing: border-box; }
    .center { text-align: center; }
    .muted { color: #475569; font-size: 11px; }
    .title { font-size: 16px; font-weight: 900; margin: 0; }
    .sep { border-top: 1px dashed #94a3b8; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }
    .row .k { color: #475569; }
    .row .v { font-weight: 700; }
    .ltr { direction: ltr; text-align: left; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th, td { border-bottom: 1px dashed #cbd5e1; padding: 6px 2px; text-align: right; font-size: 12px; vertical-align: top; }
    th { font-weight: 800; }
    .totals { margin-top: 8px; }
    .totals .line { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; padding: 4px 0; }
    .totals .line strong { font-weight: 900; }
    .barcodeWrap { text-align: center; }
    .barcodeWrap svg { width: 100%; height: auto; }
    .barcodeWrap img { width: 42mm; height: 42mm; object-fit: contain; }
    .btns { display: flex; gap: 8px; justify-content: center; margin-bottom: 8px; }
    .btn { border: 1px solid #cbd5e1; background: #fff; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-size: 13px; }
    @media print {
      .btns { display: none; }
      body { background: #fff; }
      .page { width: 80mm; margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="btns">
      <button class="btn" onclick="window.print()">طباعة</button>
      <button class="btn" onclick="window.close()">إغلاق</button>
    </div>

    <div class="center">
      <div class="title">${escapeHtml(inv.zatca_seller_name || 'مغسلة')}</div>
      ${vatNumber ? `<div class="muted ltr" style="margin-top: 2px;">VAT: ${escapeHtml(vatNumber)}</div>` : ''}
    </div>

    <div class="sep"></div>

    <div class="row"><span class="k">رقم الفاتورة</span><span class="v ltr">${escapeHtml(inv.invoice_number || inv.id || '')}</span></div>
    <div class="row"><span class="k">التاريخ</span><span class="v ltr">${escapeHtml(inv.created_at || '')}</span></div>
    <div class="row"><span class="k">الفرع</span><span class="v">${escapeHtml(inv.branch?.name || inv.branch_name || '—')}</span></div>
    <div class="row"><span class="k">العميل</span><span class="v">${escapeHtml(inv.customer?.name || inv.customer_name || 'عميل نقدي')}</span></div>
    ${inv.customer?.phone || inv.customer_phone ? `<div class="row"><span class="k">الهاتف</span><span class="v ltr">${escapeHtml(inv.customer?.phone || inv.customer_phone)}</span></div>` : ''}
    ${inv.delivery_required ? `<div class="row"><span class="k">عنوان التوصيل</span><span class="v">${escapeHtml(inv.delivery_address || '—')}</span></div>` : ''}
    ${inv.delivery_required ? `<div class="row"><span class="k">رسوم التوصيل</span><span class="v ltr">${escapeHtml(formatMoney(inv.delivery_fee ?? 0))} ر.س</span></div>` : ''}
    ${inv.delivery_required && (inv.courier_name || inv.courier_phone) ? `<div class="row"><span class="k">المندوب</span><span class="v">${escapeHtml(inv.courier_name || '—')} ${inv.courier_phone ? `(<span class=\"ltr\">${escapeHtml(inv.courier_phone)}</span>)` : ''}</span></div>` : ''}
    <div class="row"><span class="k">الدفع</span><span class="v">${escapeHtml(paymentStatusLabel(inv.payment_status))} - ${escapeHtml(paymentMethodLabel(inv.payment_method))}</span></div>
    ${inv.cashier?.name ? `<div class="row"><span class="k">الكاشير</span><span class="v">${escapeHtml(inv.cashier.name)}</span></div>` : ''}

    <div class="sep"></div>

      <table>
        <thead>
          <tr>
            <th>الخدمة</th>
            <th class="ltr">الكمية</th>
            <th class="ltr">السعر</th>
            <th class="ltr">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || `<tr><td colspan="4" class="muted" style="text-align:center; padding: 16px;">لا توجد عناصر</td></tr>`}
        </tbody>
      </table>

      <div class="totals">
        <div class="line"><span class="muted">الخدمات قبل الضريبة</span><span class="ltr">${escapeHtml(formatMoney(inv.subtotal ?? 0))} ر.س</span></div>
        ${inv.delivery_required ? `<div class="line"><span class="muted">رسوم التوصيل</span><span class="ltr">${escapeHtml(formatMoney(inv.delivery_fee ?? 0))} ر.س</span></div>` : ''}
        <div class="line"><span class="muted">الخصم</span><span class="ltr">${escapeHtml(formatMoney(inv.discount_amount ?? 0))} ر.س</span></div>
        <div class="line"><span class="muted">الضريبة (${escapeHtml(inv.tax_rate ?? 0)}%)</span><span class="ltr">${escapeHtml(formatMoney(inv.tax_amount ?? 0))} ر.س</span></div>
        <div class="sep"></div>
        <div class="line"><strong>الإجمالي</strong><strong class="ltr">${escapeHtml(formatMoney(inv.total ?? 0))} ر.س</strong></div>
      </div>

    <div class="sep"></div>

    <div class="barcodeWrap">
      ${barcodeSvg || `<div class="muted">لا يمكن إنشاء باركود</div>`}
      <div class="muted ltr" style="margin-top: 6px;">${escapeHtml(barcodeValue)}</div>
    </div>

    <div class="sep"></div>

    <div class="barcodeWrap">
      ${zatcaQrImg ? `<img alt="ZATCA QR" src="${escapeHtml(zatcaQrImg)}" />` : `<div class="muted">QR زاتكا غير متوفر</div>`}
      ${vatNumber ? `<div class="muted ltr" style="margin-top: 6px;">VAT: ${escapeHtml(vatNumber)}</div>` : ''}
    </div>

    <div class="sep"></div>
    <div class="center muted">شكراً لزيارتكم</div>
  </div>

  <script>
    setTimeout(() => { try { window.focus(); } catch {} }, 50);
  </script>
</body>
</html>
    `;
  };

  const buildPrintHtmlA4 = (inv) => {
    const { barcodeValue, barcodeSvg, zatcaQrImg, vatNumber, itemsRows } = buildInvoicePrintContext(inv);
    return `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>طباعة فاتورة ${escapeHtml(inv.invoice_number || inv.id || '')}</title>
  <style>
    :root { color-scheme: light; }
    @page { size: A4; margin: 10mm; }
    body { font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif; margin: 0; background: #fff; color: #0f172a; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 10mm; box-sizing: border-box; }
    .row { display: flex; justify-content: space-between; gap: 12px; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
    .muted { color: #64748b; font-size: 12px; }
    h1 { font-size: 18px; margin: 0; }
    h2 { font-size: 14px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: right; font-size: 12.5px; }
    th { background: #f8fafc; font-weight: 700; }
    .ltr { direction: ltr; text-align: left; }
    .totals { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .totals .line { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; }
    .totals .line b { color: #0f766e; }
    .barcodeWrap { text-align: center; }
    .barcodeWrap svg { max-width: 320px; width: 100%; height: auto; }
    .btns { display: flex; gap: 8px; justify-content: flex-end; margin-bottom: 10px; }
    .btn { border: 1px solid #cbd5e1; background: #fff; padding: 8px 12px; border-radius: 10px; cursor: pointer; }
    @media print {
      .btns { display: none; }
      body { background: #fff; }
      .page { width: auto; min-height: auto; margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="btns">
      <button class="btn" onclick="window.print()">طباعة</button>
      <button class="btn" onclick="window.close()">إغلاق</button>
    </div>

    <div class="row" style="align-items: stretch;">
      <div class="card" style="flex: 1;">
        <h1>فاتورة</h1>
        <div class="muted" style="margin-top: 6px;">رقم الفاتورة</div>
        <div class="ltr" style="font-weight: 800; font-size: 16px; color: #059669;">${escapeHtml(inv.invoice_number || inv.id || '')}</div>
        <div class="muted" style="margin-top: 10px;">تاريخ الإنشاء</div>
        <div class="ltr" style="font-size: 12.5px;">${escapeHtml(inv.created_at || '')}</div>
      </div>

      <div class="card" style="flex: 1;">
        <h2>المنشأة/العميل</h2>
        <div style="font-weight: 700;">${escapeHtml(inv.zatca_seller_name || 'مغسلة')}</div>
        ${vatNumber ? `<div class="muted ltr" style="margin-top: 4px;">VAT: ${escapeHtml(vatNumber)}</div>` : ''}
        <div class="muted" style="margin-top: 10px;">العميل</div>
        <div style="font-weight: 700;">${escapeHtml(inv.customer?.name || inv.customer_name || 'عميل نقدي')}</div>
        ${inv.customer?.phone || inv.customer_phone ? `<div class="muted ltr" style="margin-top: 4px;">${escapeHtml(inv.customer?.phone || inv.customer_phone)}</div>` : ''}
        ${inv.delivery_required ? `<div class="muted" style="margin-top: 10px;">عنوان التوصيل</div><div style="font-weight: 700;">${escapeHtml(inv.delivery_address || '—')}</div>` : ''}
        ${inv.delivery_required ? `<div class="muted" style="margin-top: 6px;">رسوم التوصيل</div><div class="ltr" style="font-weight: 800;">${escapeHtml(formatMoney(inv.delivery_fee ?? 0))} ر.س</div>` : ''}
        ${inv.delivery_required && (inv.courier_name || inv.courier_phone) ? `<div class="muted" style="margin-top: 6px;">المندوب</div><div style="font-weight: 700;">${escapeHtml(inv.courier_name || '—')} ${inv.courier_phone ? `(<span class=\"ltr\">${escapeHtml(inv.courier_phone)}</span>)` : ''}</div>` : ''}
        <div class="muted" style="margin-top: 10px;">الفرع</div>
        <div>${escapeHtml(inv.branch?.name || inv.branch_name || '—')}</div>
      </div>

      <div class="card" style="flex: 1;">
        <h2>الدفع</h2>
        <div class="muted">الحالة</div>
        <div style="font-weight: 700;">${escapeHtml(paymentStatusLabel(inv.payment_status))}</div>
        <div class="muted" style="margin-top: 8px;">الطريقة</div>
        <div style="font-weight: 700;">${escapeHtml(paymentMethodLabel(inv.payment_method))}</div>
        ${inv.cashier?.name ? `<div class="muted" style="margin-top: 8px;">الكاشير</div><div style="font-weight: 700;">${escapeHtml(inv.cashier.name)}</div>` : ''}
      </div>
    </div>

    <div class="row" style="margin-top: 12px;">
      <div class="card" style="flex: 1;">
        <h2>باركود</h2>
        <div class="barcodeWrap">
          ${barcodeSvg || `<div class="muted">لا يمكن إنشاء باركود</div>`}
          <div class="muted ltr" style="margin-top: 6px;">${escapeHtml(barcodeValue)}</div>
        </div>
      </div>
      <div class="card" style="flex: 1;">
        <h2>QR زاتكا</h2>
        <div class="barcodeWrap">
          ${zatcaQrImg ? `<img alt="ZATCA QR" src="${escapeHtml(zatcaQrImg)}" style="max-width: 220px; width: 100%; height: auto;" />` : `<div class="muted">غير متوفر</div>`}
          ${vatNumber ? `<div class="muted ltr" style="margin-top: 6px;">VAT: ${escapeHtml(vatNumber)}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 12px;">
      <h2>عناصر الفاتورة</h2>
      <table>
        <thead>
          <tr>
            <th>الخدمة</th>
            <th class="ltr">الكمية</th>
            <th class="ltr">السعر</th>
            <th class="ltr">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || `<tr><td colspan="4" class="muted" style="text-align:center; padding: 16px;">لا توجد عناصر</td></tr>`}
        </tbody>
      </table>

      <div class="totals">
        <div class="line"><span class="muted">الخدمات قبل الضريبة</span><span class="ltr">${escapeHtml(formatMoney(inv.subtotal ?? 0))} ر.س</span></div>
        ${inv.delivery_required ? `<div class="line"><span class="muted">رسوم التوصيل</span><span class="ltr">${escapeHtml(formatMoney(inv.delivery_fee ?? 0))} ر.س</span></div>` : ''}
        <div class="line"><span class="muted">الخصم</span><span class="ltr">${escapeHtml(formatMoney(inv.discount_amount ?? 0))} ر.س</span></div>
        <div class="line"><span class="muted">الضريبة (${escapeHtml(inv.tax_rate ?? 0)}%)</span><span class="ltr">${escapeHtml(formatMoney(inv.tax_amount ?? 0))} ر.س</span></div>
        <div class="line" style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 4px;"><span style="font-weight: 800;">الإجمالي</span><span class="ltr"><b>${escapeHtml(formatMoney(inv.total ?? 0))} ر.س</b></span></div>
      </div>
    </div>
  </div>

  <script>
    setTimeout(() => { try { window.focus(); } catch {} }, 50);
  </script>
</body>
</html>
    `;
  };

  const openPrintWindow = (html, opts = {}) => {
    const w = window.open('', '_blank', `width=${opts.width || 920},height=${opts.height || 720}`);
    if (!w) {
      showToast('يرجى السماح بالنوافذ المنبثقة للطباعة', 'error');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      try { w.focus(); w.print(); } catch {}
    }, 250);
  };

  const printInvoice = (inv, mode = 'pos') => {
    if (!inv) return;
    const html = mode === 'a4' ? buildPrintHtmlA4(inv) : buildPrintHtmlPos(inv);
    openPrintWindow(html, mode === 'a4' ? { width: 920, height: 720 } : { width: 520, height: 740 });
  };

  const quickPrintById = async (invoiceId, mode = 'pos') => {
    try {
      setPrintingId(invoiceId);
      const res = await api.invoices.getById(invoiceId);
      printInvoice(res.data, mode);
    } catch (err) {
      showToast(err.message || 'فشل الطباعة', 'error');
    } finally {
      setPrintingId(null);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        ...(search ? { search } : {}),
      };
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k];
      });

      const statsParams = {};
      if (filters.branch_id) statsParams.branch_id = filters.branch_id;
      if (filters.date_from) statsParams.date_from = filters.date_from;
      if (filters.date_to) statsParams.date_to = filters.date_to;

      const [statsRes, invoicesRes] = await Promise.all([
        api.invoices.getStats(statsParams),
        api.invoices.getAll(params),
      ]);

      setStats(statsRes.data || null);
      setInvoices(invoicesRes.data || []);
      setPagination(invoicesRes.pagination || null);
    } catch (err) {
      showToast(err.message || 'حدث خطأ', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, search, showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetch = () => fetchAll();

  const openInvoiceDetails = async (invoiceId) => {
    try {
      setSelectedInvoiceId(invoiceId);
      setShowDetails(true);
      setInvoiceDetails(null);
      setDetailsLoading(true);
      const res = await api.invoices.getById(invoiceId);
      setInvoiceDetails(res.data);
      setStatusDraft(res.data?.status || 'pending');
      setPaymentForm({ amount: String(res.data?.total ?? ''), payment_method: res.data?.payment_method || 'cash', reference_number: '', notes: '' });
      setDiscountDraft(String(res.data?.discount_percent ?? ''));
    } catch (err) {
      showToast(err.message, 'error');
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const refreshInvoiceDetails = async () => {
    if (!selectedInvoiceId) return;
    try {
      setDetailsLoading(true);
      const res = await api.invoices.getById(selectedInvoiceId);
      setInvoiceDetails(res.data);
      setStatusDraft(res.data?.status || 'pending');
      setPaymentForm((prev) => ({
        ...prev,
        amount: prev.amount !== '' ? prev.amount : String(res.data?.total ?? ''),
        payment_method: prev.payment_method || res.data?.payment_method || 'cash',
      }));
      setDiscountDraft(String(res.data?.discount_percent ?? ''));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeInvoiceDetails = () => {
    setShowDetails(false);
    setSelectedInvoiceId(null);
    setInvoiceDetails(null);
    setStatusDraft('pending');
    setDetailsLoading(false);
    setDetailsSaving(false);
    setShowPayment(false);
    setPaymentSaving(false);
    setShowDiscount(false);
    setDiscountSaving(false);
  };

  const saveInvoiceStatus = async () => {
    if (!selectedInvoiceId) return;
    try {
      setDetailsSaving(true);
      await api.invoices.updateStatus(selectedInvoiceId, statusDraft);
      showToast('تم تحديث حالة الفاتورة', 'success');
      refetch();
      // تحديث بيانات التفاصيل محلياً
      setInvoiceDetails((prev) => (prev ? { ...prev, status: statusDraft } : prev));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDetailsSaving(false);
    }
  };

  const submitPayment = async () => {
    if (!selectedInvoiceId) return;
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) {
      showToast('أدخل مبلغ دفع صحيح', 'error');
      return;
    }
    try {
      setPaymentSaving(true);
      await api.invoices.recordPayment(selectedInvoiceId, {
        amount,
        payment_method: paymentForm.payment_method || 'cash',
        reference_number: paymentForm.reference_number?.trim() || undefined,
        notes: paymentForm.notes?.trim() || undefined,
      });
      showToast('تم تسجيل الدفع', 'success');
      setShowPayment(false);
      refetch();
      await refreshInvoiceDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPaymentSaving(false);
    }
  };

  const submitDiscount = async () => {
    if (!selectedInvoiceId) return;
    const disc = Number(discountDraft);
    if (Number.isNaN(disc) || disc < 0 || disc > 100) {
      showToast('نسبة خصم غير صحيحة (0-100)', 'error');
      return;
    }
    try {
      setDiscountSaving(true);
      await api.invoices.updateDiscount(selectedInvoiceId, disc);
      showToast('تم تحديث الخصم', 'success');
      setShowDiscount(false);
      refetch();
      await refreshInvoiceDetails();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDiscountSaving(false);
    }
  };

  const totals = calcInvoicePreviewTotals(
    invoiceForm.items,
    invoiceForm.discount_percent,
    15,
    invoiceForm.delivery_required ? invoiceForm.delivery_fee : 0
  );

  const setItem = (index, patch) => {
    setInvoiceForm((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], ...patch };
      return { ...prev, items: nextItems };
    });
  };

  const addItem = () => setInvoiceForm((prev) => ({ ...prev, items: [...prev.items, { service_id: '', quantity: 1, unit_price: '' }] }));
  const removeItem = (index) => setInvoiceForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const submitInvoice = async () => {
    try {
      if (invoiceForm.delivery_required && !invoiceForm.delivery_address?.trim()) {
        showToast('عنوان التوصيل مطلوب عند اختيار توصيل', 'error');
        return;
      }

      const payload = {
        customer_id: invoiceForm.customer_id ? Number(invoiceForm.customer_id) : null,
        branch_id: invoiceForm.branch_id ? Number(invoiceForm.branch_id) : 1,
        discount_percent: Number(invoiceForm.discount_percent) || 0,
        payment_method: invoiceForm.payment_method || 'cash',
        delivery_required: Boolean(invoiceForm.delivery_required),
        delivery_address: invoiceForm.delivery_required ? (invoiceForm.delivery_address?.trim() || undefined) : undefined,
        delivery_fee: invoiceForm.delivery_required ? (Number(invoiceForm.delivery_fee) || 0) : 0,
        courier_name: invoiceForm.delivery_required ? (invoiceForm.courier_name?.trim() || undefined) : undefined,
        courier_phone: invoiceForm.delivery_required ? (invoiceForm.courier_phone?.trim() || undefined) : undefined,
        items: invoiceForm.items
          .filter((it) => it.service_id)
          .map((it) => ({
            service_id: Number(it.service_id),
            quantity: Number(it.quantity) || 1,
            unit_price: it.unit_price !== '' ? Number(it.unit_price) : undefined,
          })),
      };

      if (!payload.items.length) {
        showToast('أضف خدمة واحدة على الأقل', 'error');
        return;
      }

      await api.invoices.create(payload);
      showToast('تم إنشاء الفاتورة', 'success');
      setShowCreate(false);
      setInvoiceForm({
        customer_id: '',
        branch_id: '1',
        discount_percent: 0,
        payment_method: 'cash',
        delivery_required: false,
        delivery_address: '',
        delivery_fee: '',
        courier_name: '',
        courier_phone: '',
        items: [{ service_id: '', quantity: 1, unit_price: '' }]
      });
      refetch();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  if (loading) return <LoadingSpinner />;
  const statusColors = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-indigo-100 text-indigo-700',
    ready: 'bg-blue-100 text-blue-700',
    delivered: 'bg-teal-100 text-teal-700',
    cancelled: 'bg-red-100 text-red-700',
    draft: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">الفواتير</h1>
          <p className="text-sm text-slate-500 mt-1">بحث، فلترة، وإدارة حالات الفواتير والدفع.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="px-4 py-2 border rounded-xl flex items-center gap-2 bg-white"><RefreshCw size={16} />تحديث</button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl">
            <Plus size={18} />إضافة فاتورة
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} title="مبيعات اليوم" value={`${formatMoney(stats.todaySales)} ر.س`} color="from-emerald-400 to-teal-500" />
          <StatCard icon={ShoppingCart} title="طلبات اليوم" value={stats.todayOrders ?? 0} color="from-blue-400 to-indigo-500" />
          <StatCard icon={Clock} title="طلبات معلّقة" value={stats.pendingOrders ?? 0} color="from-amber-400 to-orange-500" />
          <StatCard icon={CheckCircle2} title="جاهزة" value={stats.readyOrders ?? 0} color="from-purple-400 to-pink-500" />
        </div>
      )}

      <div className="bg-white rounded-2xl border p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">بحث</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="رقم الفاتورة، اسم العميل، الهاتف..."
                className="w-full pr-9 pl-3 py-2 border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">الفرع</label>
            <select
              value={filters.branch_id}
              onChange={(e) => setFilters({ ...filters, page: 1, branch_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl"
              disabled={isCourier}
            >
              {isCourier ? (
                <option value={user?.branch?.id ? String(user.branch.id) : ''}>{user?.branch?.name || 'الفرع'}</option>
              ) : (
                <>
                  <option value="">كل الفروع</option>
                  {(branches || []).map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">الحالة</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, page: 1, status: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">الكل</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">الدفع</label>
            <select value={filters.payment_status} onChange={(e) => setFilters({ ...filters, page: 1, payment_status: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">الكل</option>
              <option value="paid">مدفوع</option>
              <option value="unpaid">غير مدفوع</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">العميل</label>
            <select value={filters.customer_id} onChange={(e) => setFilters({ ...filters, page: 1, customer_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">الكل</option>
              {(customers || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">من تاريخ</label>
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, page: 1, date_from: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">إلى تاريخ</label>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, page: 1, date_to: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">عدد النتائج</label>
            <select value={filters.limit} onChange={(e) => setFilters({ ...filters, page: 1, limit: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-xl">
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="md:col-span-3 flex items-end gap-2">
            <button
              onClick={() => {
                setSearchInput('');
                setFilters({ branch_id: '', customer_id: '', status: '', payment_status: '', date_from: '', date_to: '', page: 1, limit: 50 });
              }}
              className="px-4 py-2 border rounded-xl bg-white"
            >إعادة ضبط</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">قائمة الفواتير</h2>
          <span className="text-sm text-slate-500">{pagination ? `${pagination.total} فاتورة` : `${invoices?.length || 0} فاتورة`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-right px-4 py-3 text-sm">#</th>
                <th className="text-right px-4 py-3 text-sm">العميل</th>
                <th className="text-right px-4 py-3 text-sm">الفرع</th>
                <th className="text-right px-4 py-3 text-sm">التاريخ</th>
                <th className="text-right px-4 py-3 text-sm">الدفع</th>
                <th className="text-right px-4 py-3 text-sm">المجموع</th>
                <th className="text-right px-4 py-3 text-sm">الحالة</th>
                <th className="text-right px-4 py-3 text-sm">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(invoices || []).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-emerald-600 whitespace-nowrap">{inv.invoice_number}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{inv.customer_name || 'عميل نقدي'}</p>
                      {inv.customer_phone ? <p className="text-xs text-slate-500" dir="ltr">{inv.customer_phone}</p> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{inv.branch_name || '—'}</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">{inv.created_at || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${inv.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{paymentStatusLabel(inv.payment_status)}</span>
                  </td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap" dir="ltr">{formatMoney(inv.total)} ر.س</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[inv.status] || 'bg-slate-100 text-slate-700'}`}>{statusLabel(inv.status)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col md:flex-row gap-2">
                      <button
                        onClick={() => quickPrintById(inv.id, 'pos')}
                        disabled={printingId === inv.id}
                        className="inline-flex items-center justify-center gap-2 h-11 px-4 border rounded-xl bg-emerald-500 text-white disabled:opacity-60"
                        title="طباعة POS (80mm)"
                      >
                        {printingId === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer size={18} />}
                        طباعة POS
                      </button>
                      <button
                        onClick={() => quickPrintById(inv.id, 'a4')}
                        disabled={printingId === inv.id}
                        className="inline-flex items-center justify-center gap-2 h-11 px-4 border rounded-xl bg-white disabled:opacity-60"
                        title="طباعة A4"
                      >
                        <Printer size={18} />
                        طباعة A4
                      </button>
                      <button
                        onClick={() => openInvoiceDetails(inv.id)}
                        className="inline-flex items-center justify-center gap-2 h-11 px-4 border rounded-xl bg-white"
                        title="عرض التفاصيل"
                      >
                        <Eye size={18} />
                        تفاصيل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!invoices || invoices.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    لا توجد فواتير مطابقة للفلاتر الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="p-4 border-t flex items-center justify-between">
            <button
              onClick={() => setFilters({ ...filters, page: Math.max(1, Number(filters.page) - 1) })}
              disabled={Number(filters.page) <= 1}
              className="px-4 py-2 border rounded-xl disabled:opacity-60"
            >السابق</button>
            <p className="text-sm text-slate-600" dir="ltr">{pagination.page} / {pagination.totalPages}</p>
            <button
              onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, Number(filters.page) + 1) })}
              disabled={Number(filters.page) >= pagination.totalPages}
              className="px-4 py-2 border rounded-xl disabled:opacity-60"
            >التالي</button>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold">تفاصيل الفاتورة</h3>
                <p className="text-sm text-slate-500 mt-1">عرض العناصر وتحديث الحالة</p>
              </div>
              <button onClick={closeInvoiceDetails}><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {detailsLoading ? (
                <div className="p-10 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                  <p className="mt-2 text-slate-500">جاري تحميل التفاصيل...</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border rounded-2xl p-4">
                    <p className="text-xs text-slate-500">رقم الفاتورة</p>
                    <p className="font-mono text-emerald-700 font-bold mt-1">{invoiceDetails?.invoice_number || '-'}</p>
                    <p className="text-xs text-slate-500 mt-2">تاريخ الإنشاء</p>
                    <p className="text-sm mt-1" dir="ltr">{invoiceDetails?.created_at || '-'}</p>
                  </div>

                  <div className="bg-slate-50 border rounded-2xl p-4">
                    <p className="text-xs text-slate-500">العميل</p>
                    <p className="font-medium mt-1">{invoiceDetails?.customer?.name || invoiceDetails?.customer_name || 'عميل نقدي'}</p>
                    {invoiceDetails?.customer?.phone && (
                      <p className="text-sm text-slate-500 mt-1" dir="ltr">{invoiceDetails.customer.phone}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">الفرع</p>
                    <p className="text-sm mt-1">{invoiceDetails?.branch?.name || invoiceDetails?.branch_name || '-'}</p>
                  </div>

                  <div className="bg-slate-50 border rounded-2xl p-4">
                    <p className="text-xs text-slate-500">الدفع</p>
                    <p className="text-sm mt-1">الحالة: <span className="font-medium">{paymentStatusLabel(invoiceDetails?.payment_status)}</span></p>
                    <p className="text-sm mt-1">الطريقة: <span className="font-medium">{paymentMethodLabel(invoiceDetails?.payment_method)}</span></p>
                    {invoiceDetails?.cashier?.name && (
                      <p className="text-sm mt-2">الكاشير: <span className="font-medium">{invoiceDetails.cashier.name}</span></p>
                    )}
                    {invoiceDetails?.zatca_vat_number && (
                      <p className="text-sm mt-2" dir="ltr">VAT: <span className="font-medium">{invoiceDetails.zatca_vat_number}</span></p>
                    )}
                  </div>
                </div>

                {invoiceDetails?.delivery_required ? (
                  <div className="bg-white rounded-2xl border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">التوصيل</h4>
                        <p className="text-sm text-slate-500 mt-1">بيانات التوصيل للفاتورة.</p>
                      </div>
                      {invoiceDetails?.delivery_status ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">{String(invoiceDetails.delivery_status)}</span>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-50 border rounded-xl p-3">
                        <p className="text-xs text-slate-500">عنوان التوصيل</p>
                        <p className="mt-1 font-medium">{invoiceDetails?.delivery_address || '—'}</p>
                      </div>
                      <div className="bg-slate-50 border rounded-xl p-3">
                        <p className="text-xs text-slate-500">رسوم التوصيل</p>
                        <p className="mt-1 font-medium" dir="ltr">{formatMoney(invoiceDetails?.delivery_fee ?? 0)} ر.س</p>
                      </div>
                      {(invoiceDetails?.courier_name || invoiceDetails?.courier_phone) ? (
                        <div className="bg-slate-50 border rounded-xl p-3 md:col-span-2">
                          <p className="text-xs text-slate-500">المندوب</p>
                          <p className="mt-1 font-medium">
                            {invoiceDetails?.courier_name || '—'}
                            {invoiceDetails?.courier_phone ? <span className="text-slate-500" dir="ltr"> {' '}({invoiceDetails.courier_phone})</span> : null}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {(invoiceDetails?.zatca_qr_image || invoiceDetails?.zatca_qr_base64) && (
                  <div className="bg-white rounded-2xl border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">QR زاتكا</h4>
                        <p className="text-sm text-slate-500 mt-1">يُستخدم للفاتورة الإلكترونية (TLV).</p>
                      </div>
                      {invoiceDetails?.zatca_vat_number ? (
                        <div className="text-sm text-slate-600" dir="ltr">VAT: <span className="font-medium">{invoiceDetails.zatca_vat_number}</span></div>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-center justify-center">
                      {invoiceDetails?.zatca_qr_image ? (
                        <img alt="ZATCA QR" src={invoiceDetails.zatca_qr_image} className="w-44 h-44 object-contain border rounded-xl p-2 bg-white" />
                      ) : (
                        <div className="text-sm text-slate-500">غير متوفر</div>
                      )}
                    </div>
                    {invoiceDetails?.zatca_qr_base64 ? (
                      <div className="mt-3 bg-slate-50 border rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">TLV Base64</p>
                        <p className="text-xs break-all" dir="ltr">{invoiceDetails.zatca_qr_base64}</p>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="bg-white rounded-2xl border overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h4 className="font-bold">عناصر الفاتورة</h4>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[invoiceDetails?.status] || 'bg-slate-100 text-slate-700'}`}>{statusLabel(invoiceDetails?.status)}</span>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-right px-4 py-3 text-sm">الخدمة</th>
                        <th className="text-right px-4 py-3 text-sm">الكمية</th>
                        <th className="text-right px-4 py-3 text-sm">السعر</th>
                        <th className="text-right px-4 py-3 text-sm">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(invoiceDetails?.items || []).map((it) => (
                        <tr key={it.id}>
                          <td className="px-4 py-3">{it.name}</td>
                          <td className="px-4 py-3" dir="ltr">{it.quantity}</td>
                          <td className="px-4 py-3" dir="ltr">{formatMoney(it.unit_price)} ر.س</td>
                          <td className="px-4 py-3 font-medium" dir="ltr">{formatMoney(it.total ?? (Number(it.quantity) * Number(it.unit_price)))} ر.س</td>
                        </tr>
                      ))}
                      {(!invoiceDetails?.items || invoiceDetails.items.length === 0) && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-500">لا توجد عناصر</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 bg-white border rounded-2xl p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">حالة الفاتورة</label>
                    <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={saveInvoiceStatus}
                      disabled={detailsSaving || statusDraft === invoiceDetails?.status}
                      className="mt-3 w-full px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {detailsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                      حفظ الحالة
                    </button>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowPayment(true)}
                        disabled={invoiceDetails?.payment_status === 'paid'}
                        className="px-3 py-2 border rounded-xl disabled:opacity-60"
                      >تسجيل دفع</button>
                      <button
                        onClick={() => setShowDiscount(true)}
                        disabled={invoiceDetails?.payment_status === 'paid'}
                        className="px-3 py-2 border rounded-xl disabled:opacity-60"
                      >تعديل خصم</button>
                    </div>

                    {invoiceDetails?.payment_status === 'paid' ? (
                      <p className="text-xs text-slate-500 mt-2">لا يمكن تعديل الخصم/الدفع لفاتورة مدفوعة.</p>
                    ) : null}
                  </div>

                  <div className="md:col-span-2 bg-white border rounded-2xl p-4">
                    <h4 className="font-bold mb-3">ملخص المبالغ</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">الخدمات قبل الضريبة</span><span className="font-medium">{formatMoney(invoiceDetails?.subtotal)} ر.س</span></div>
                      {invoiceDetails?.delivery_required ? (
                        <div className="flex justify-between"><span className="text-slate-500">رسوم التوصيل</span><span className="font-medium">{formatMoney(invoiceDetails?.delivery_fee ?? 0)} ر.س</span></div>
                      ) : null}
                      <div className="flex justify-between"><span className="text-slate-500">الخصم</span><span className="font-medium">{formatMoney(invoiceDetails?.discount_amount)} ر.س</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">الضريبة ({invoiceDetails?.tax_rate ?? 0}%)</span><span className="font-medium">{formatMoney(invoiceDetails?.tax_amount)} ر.س</span></div>
                      <div className="flex justify-between font-bold pt-2 border-t"><span>الإجمالي</span><span className="text-emerald-600">{formatMoney(invoiceDetails?.total)} ر.س</span></div>
                    </div>
                  </div>
                </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex flex-col md:flex-row gap-2 justify-end">
              <button
                onClick={() => printInvoice(invoiceDetails, 'pos')}
                disabled={!invoiceDetails}
                className="h-12 px-5 border rounded-xl flex items-center justify-center gap-2 bg-emerald-500 text-white disabled:opacity-60"
              >
                <Printer size={18} />
                طباعة POS
              </button>
              <button
                onClick={() => printInvoice(invoiceDetails, 'a4')}
                disabled={!invoiceDetails}
                className="h-12 px-5 border rounded-xl flex items-center justify-center gap-2 bg-white disabled:opacity-60"
              >
                <Printer size={18} />
                طباعة A4
              </button>
              <button onClick={closeInvoiceDetails} className="h-12 px-5 border rounded-xl bg-white">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {showPayment && showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold">تسجيل الدفع</h3>
                <p className="text-sm text-slate-500 mt-1">تسجيل دفع كامل للفاتورة.</p>
              </div>
              <button onClick={() => setShowPayment(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">المبلغ</label>
                  <input type="number" min="0" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">طريقة الدفع</label>
                  <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                    <option value="cash">نقداً</option>
                    <option value="card">بطاقة</option>
                    <option value="transfer">تحويل</option>
                    <option value="online">إلكتروني</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رقم مرجعي (اختياري)</label>
                <input value={paymentForm.reference_number} onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })} className="w-full px-3 py-2 border rounded-xl" placeholder="مثال: 12345" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظات (اختياري)</label>
                <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="w-full px-3 py-2 border rounded-xl" rows={3} />
              </div>
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={() => setShowPayment(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={submitPayment} disabled={paymentSaving} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60">
                {paymentSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiscount && showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold">تعديل الخصم</h3>
                <p className="text-sm text-slate-500 mt-1">تغيير نسبة الخصم قبل الدفع.</p>
              </div>
              <button onClick={() => setShowDiscount(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">خصم %</label>
                <input type="number" min="0" max="100" value={discountDraft} onChange={(e) => setDiscountDraft(e.target.value)} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                <p className="text-xs text-slate-500 mt-2">ملاحظة: تعديل الخصم يسجَّل في رادار الاحتيال (Audit).</p>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={() => setShowDiscount(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={submitDiscount} disabled={discountSaving} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60">
                {discountSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">إضافة فاتورة</h3>
              <button onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={invoiceForm.branch_id}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, branch_id: e.target.value })}
                  className="px-3 py-2 border rounded-xl"
                  disabled={isCourier}
                >
                  {isCourier ? (
                    <option value={user?.branch?.id ? String(user.branch.id) : ''}>{user?.branch?.name || 'الفرع'}</option>
                  ) : (
                    (branches || []).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))
                  )}
                </select>
                <select value={invoiceForm.customer_id} onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_id: e.target.value })} className="px-3 py-2 border rounded-xl">
                  <option value="">عميل نقدي</option>
                  {(customers || []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
                <select value={invoiceForm.payment_method} onChange={(e) => setInvoiceForm({ ...invoiceForm, payment_method: e.target.value })} className="px-3 py-2 border rounded-xl">
                  <option value="cash">نقداً</option>
                  <option value="card">بطاقة</option>
                  <option value="transfer">تحويل</option>
                  <option value="online">إلكتروني</option>
                </select>
              </div>

              <div className="bg-white rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">التوصيل</h4>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(invoiceForm.delivery_required)}
                      onChange={(e) => {
                        const nextChecked = e.target.checked;
                        if (!nextChecked) {
                          setInvoiceForm({
                            ...invoiceForm,
                            delivery_required: false,
                            delivery_address: '',
                            delivery_fee: '',
                            courier_name: '',
                            courier_phone: '',
                          });
                          return;
                        }

                        setInvoiceForm({
                          ...invoiceForm,
                          delivery_required: true,
                          courier_name: invoiceForm.courier_name || user?.name || '',
                          courier_phone: invoiceForm.courier_phone || user?.phone || '',
                        });
                      }}
                    />
                    توصيل
                  </label>
                </div>

                {invoiceForm.delivery_required ? (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">عنوان التوصيل</label>
                      <input
                        value={invoiceForm.delivery_address}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, delivery_address: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl"
                        placeholder="مثال: حي ... شارع ... رقم المنزل"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">رسوم التوصيل (ر.س)</label>
                      <input
                        type="number"
                        min="0"
                        value={invoiceForm.delivery_fee}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, delivery_fee: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl"
                        dir="ltr"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">اسم المندوب (اختياري)</label>
                      <input
                        value={invoiceForm.courier_name}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, courier_name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl"
                        placeholder="اسم المندوب"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">رقم المندوب (اختياري)</label>
                      <input
                        value={invoiceForm.courier_phone}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, courier_phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl"
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mt-2">اتركها غير مفعلة إذا كانت الفاتورة استلام من الفرع.</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">عناصر الفاتورة</h4>
                  <button onClick={addItem} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-xl">
                    <Plus size={16} />عنصر
                  </button>
                </div>

                <div className="space-y-3">
                  {invoiceForm.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 md:col-span-6">
                        <select
                          value={it.service_id}
                          onChange={(e) => {
                            const serviceId = e.target.value;
                            const service = (services || []).find((s) => String(s.id) === String(serviceId));
                            setItem(idx, { service_id: serviceId, unit_price: service ? String(service.price) : it.unit_price });
                          }}
                          className="w-full px-3 py-2 border rounded-xl"
                        >
                          <option value="">اختر خدمة</option>
                          {(services || []).map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.price} ر.س)</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <input type="number" min="1" value={it.quantity} onChange={(e) => setItem(idx, { quantity: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                      </div>
                      <div className="col-span-6 md:col-span-3">
                        <input type="number" min="0" value={it.unit_price} onChange={(e) => setItem(idx, { unit_price: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                      </div>
                      <div className="col-span-12 md:col-span-1 flex justify-end">
                        <button disabled={invoiceForm.items.length === 1} onClick={() => removeItem(idx)} className="p-2 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-50">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm mb-1">خصم %</label>
                    <input type="number" min="0" max="100" value={invoiceForm.discount_percent} onChange={(e) => setInvoiceForm({ ...invoiceForm, discount_percent: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                  </div>
                  <div className="md:col-span-2 bg-white rounded-xl border p-3">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">الخدمات قبل الضريبة</span><span className="font-medium">{formatMoney(totals.subtotal)} ر.س</span></div>
                    {invoiceForm.delivery_required ? (
                      <div className="flex justify-between text-sm"><span className="text-slate-500">رسوم التوصيل</span><span className="font-medium">{formatMoney(totals.deliveryFee)} ر.س</span></div>
                    ) : null}
                    <div className="flex justify-between text-sm"><span className="text-slate-500">الخصم</span><span className="font-medium">{formatMoney(totals.discount)} ر.س</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">الضريبة (15%)</span><span className="font-medium">{formatMoney(totals.tax)} ر.س</span></div>
                    <div className="flex justify-between text-sm font-bold pt-2 border-t mt-2"><span>الإجمالي</span><span className="text-emerald-600">{formatMoney(totals.total)} ر.س</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={submitInvoice} className="px-4 py-2 bg-emerald-500 text-white rounded-xl">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BranchesPage = ({ lang, showToast }) => {
  const emptyBranchForm = {
    name: '',
    name_en: '',
    address: '',
    phone: '',
    email: '',
    manager_id: '',
  };

  const { data: branches, loading, refetch } = useApi(() => api.branches.getAll());
  const { data: users } = useApi(() => api.users.getAll({ limit: 200 }));
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState(emptyBranchForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingBranch(null);
    setBranchForm(emptyBranchForm);
    setShowModal(true);
  };

  const openEdit = (branch) => {
    setEditingBranch(branch);
    setBranchForm({
      ...emptyBranchForm,
      ...branch,
      name_en: branch.name_en || '',
      phone: branch.phone || '',
      email: branch.email || '',
      manager_id: branch.manager_id ? String(branch.manager_id) : '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBranch(null);
    setBranchForm(emptyBranchForm);
    setSaving(false);
  };

  const submitBranch = async () => {
    try {
      if (!branchForm.name?.trim() || !branchForm.address?.trim()) {
        showToast('اسم الفرع والعنوان مطلوبان', 'error');
        return;
      }

      setSaving(true);
      const payload = {
        name: branchForm.name.trim(),
        name_en: branchForm.name_en?.trim() || branchForm.name.trim(),
        address: branchForm.address.trim(),
        phone: branchForm.phone?.trim() || null,
        email: branchForm.email?.trim() || null,
        manager_id: branchForm.manager_id ? Number(branchForm.manager_id) : null,
      };

      if (editingBranch) {
        await api.branches.update(editingBranch.id, payload);
        showToast('تم تحديث الفرع', 'success');
      } else {
        await api.branches.create(payload);
        showToast('تم إضافة الفرع', 'success');
      }

      closeModal();
      refetch();
    } catch (err) {
      showToast(err.message, 'error');
      setSaving(false);
    }
  };

  const toggleBranch = async (branch) => {
    try {
      await api.branches.toggle(branch.id);
      showToast(branch.is_active ? 'تم تعطيل الفرع' : 'تم تفعيل الفرع', 'success');
      refetch();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  const statusBadge = (b) => {
    if (b.is_main) return <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">رئيسي</span>;
    if (b.is_active) return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">نشط</span>;
    return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">معطل</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">الفروع</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة الفروع والتفعيل/التعطيل</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl">
          <Plus size={18} />إضافة فرع
        </button>
      </div>

      {(!branches || branches.length === 0) ? (
        <div className="bg-white rounded-2xl border p-10 text-center">
          <Building2 className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 font-medium">لا توجد فروع</p>
          <p className="text-sm text-slate-500 mt-1">ابدأ بإضافة أول فرع.</p>
          <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl">
            <Plus size={18} />إضافة فرع
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center"><Building2 className="text-white" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{b.name}</h3>
                      {statusBadge(b)}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{b.address}</p>
                    {(b.phone || b.manager_name) && (
                      <p className="text-xs text-slate-400 mt-1">
                        {b.phone ? <span dir="ltr">{b.phone}</span> : null}
                        {b.phone && b.manager_name ? ' • ' : null}
                        {b.manager_name ? `المدير: ${b.manager_name}` : null}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(b)} className="p-2 rounded-xl border hover:bg-slate-50" title="تعديل">
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => toggleBranch(b)}
                    className={`p-2 rounded-xl border hover:bg-slate-50 ${b.is_main ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={b.is_active ? 'تعطيل' : 'تفعيل'}
                    disabled={b.is_main}
                  >
                    {b.is_active ? <XCircle size={16} className="text-red-600" /> : <CheckCircle2 size={16} className="text-emerald-600" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-emerald-50 rounded-lg p-2">
                  <p className="font-bold text-emerald-600" dir="ltr">{(b.today_sales || 0).toLocaleString()}</p>
                  <p className="text-xs">مبيعات اليوم</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="font-bold text-blue-600" dir="ltr">{b.today_orders || 0}</p>
                  <p className="text-xs">طلبات اليوم</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="font-bold text-slate-700" dir="ltr">{b.employees_count || 0}</p>
                  <p className="text-xs">موظفين</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{editingBranch ? 'تعديل فرع' : 'إضافة فرع'}</h3>
              <button onClick={closeModal}><X size={20} /></button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اسم الفرع</label>
                <input value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl" placeholder="مثال: الفرع الرئيسي" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اسم الفرع (English)</label>
                <input value={branchForm.name_en} onChange={(e) => setBranchForm({ ...branchForm, name_en: e.target.value })} className="w-full px-3 py-2 border rounded-xl" placeholder="Main Branch" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">العنوان</label>
                <input value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} className="w-full px-3 py-2 border rounded-xl" placeholder="المدينة - الحي - الشارع" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الهاتف (اختياري)</label>
                  <input value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded-xl" placeholder="0112345678" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">البريد (اختياري)</label>
                  <input value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-xl" placeholder="branch@email.com" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">مدير الفرع (اختياري)</label>
                <select value={branchForm.manager_id} onChange={(e) => setBranchForm({ ...branchForm, manager_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                  <option value="">بدون</option>
                  {(users || []).map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={closeModal} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={submitBranch} disabled={saving} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsPage = ({ lang, showToast }) => {
  const [branchId, setBranchId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [customerSort, setCustomerSort] = useState('total_spent');

  const rangeParams = {};
  if (dateFrom) rangeParams.date_from = dateFrom;
  if (dateTo) rangeParams.date_to = dateTo;

  const { data: branches } = useApi(() => api.branches.getAll({ limit: 200 }));

  const { data: dashboard, loading: dashboardLoading, refetch: dashboardRefetch } = useApi(
    () => api.reports.getDashboard(branchId ? { branch_id: branchId } : {}),
    [branchId]
  );
  const { data: salesReport, loading: salesLoading, refetch: salesRefetch } = useApi(
    () => api.reports.getSales({
      ...(branchId ? { branch_id: branchId } : {}),
      ...rangeParams,
      group_by: groupBy,
    }),
    [branchId, dateFrom, dateTo, groupBy]
  );
  const { data: paymentsReport, loading: paymentsLoading, refetch: paymentsRefetch } = useApi(
    () => api.reports.getPayments({ ...rangeParams }),
    [dateFrom, dateTo]
  );
  const { data: servicesReport, loading: servicesLoading, refetch: servicesRefetch } = useApi(
    () => api.reports.getServices({ ...rangeParams }),
    [dateFrom, dateTo]
  );
  const { data: branchesReport, loading: branchesLoading, refetch: branchesRefetch } = useApi(
    () => api.reports.getBranches({ ...rangeParams }),
    [dateFrom, dateTo]
  );
  const { data: customersReport, loading: customersLoading, refetch: customersRefetch } = useApi(
    () => api.reports.getCustomers({ sort: customerSort, limit: 20 }),
    [customerSort]
  );

  const refreshAll = () => {
    try {
      dashboardRefetch();
      salesRefetch();
      paymentsRefetch();
      servicesRefetch();
      branchesRefetch();
      customersRefetch();
      showToast('تم تحديث التقارير', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const salesSummary = salesReport?.summary;
  const salesRows = salesReport?.sales || [];
  const paymentsSummary = paymentsReport?.summary;
  const paymentsRows = paymentsReport?.payments || [];
  const servicesSummary = servicesReport?.summary;
  const servicesRows = servicesReport?.services || [];
  const branchesSummary = branchesReport?.summary;
  const branchRows = branchesReport?.branches || [];
  const customersSummary = customersReport?.summary;
  const customerRows = customersReport?.customers || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">التقارير</h1>
          <p className="text-sm text-slate-500 mt-1">ملخصات وتقارير تفصيلية حسب الفترة</p>
        </div>
        <button onClick={refreshAll} className="flex items-center gap-2 px-4 py-2 border rounded-xl bg-white">
          <RefreshCw size={16} />تحديث
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-2">الفرع</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
              <option value="">كل الفروع</option>
              {(branches || []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">من تاريخ</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">إلى تاريخ</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">تجميع المبيعات</label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="w-full px-3 py-2 border rounded-xl">
              <option value="day">يومي</option>
              <option value="week">أسبوعي</option>
              <option value="month">شهري</option>
            </select>
          </div>
        </div>
      </div>

      {dashboardLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} title="إيرادات الشهر" value={`${dashboard?.month?.sales?.toLocaleString() || 0} ر.س`} color="from-emerald-400 to-teal-500" />
          <StatCard icon={ShoppingCart} title="طلبات الشهر" value={dashboard?.month?.orders || 0} color="from-blue-400 to-indigo-500" />
          <StatCard icon={Users} title="عملاء جدد" value={dashboard?.new_customers_month || 0} color="from-purple-400 to-pink-500" />
          <StatCard icon={FileText} title="الضريبة" value={`${dashboard?.month?.tax?.toLocaleString() || 0} ر.س`} color="from-amber-400 to-orange-500" />
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">تقرير المبيعات</h2>
          {salesLoading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />جاري التحميل</div>}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">إجمالي المبيعات</p><p className="mt-1 font-bold text-emerald-700">{formatMoney(salesSummary?.total_sales)} ر.س</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">عدد الفواتير</p><p className="mt-1 font-bold">{salesSummary?.total_invoices || 0}</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">متوسط الفاتورة</p><p className="mt-1 font-bold">{formatMoney(salesSummary?.average_invoice)} ر.س</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">إجمالي الضريبة</p><p className="mt-1 font-bold">{formatMoney(salesSummary?.total_tax)} ر.س</p></div>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-t border-b">
            <tr>
              <th className="text-right px-4 py-3 text-sm">التاريخ</th>
              <th className="text-right px-4 py-3 text-sm">عدد الفواتير</th>
              <th className="text-right px-4 py-3 text-sm">الإجمالي</th>
              <th className="text-right px-4 py-3 text-sm">الضريبة</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {salesRows.map((r) => (
              <tr key={r.date} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono" dir="ltr">{r.date}</td>
                <td className="px-4 py-3" dir="ltr">{r.count}</td>
                <td className="px-4 py-3 font-medium" dir="ltr">{formatMoney(r.total)} ر.س</td>
                <td className="px-4 py-3" dir="ltr">{formatMoney(r.tax)} ر.س</td>
              </tr>
            ))}
            {salesRows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">لا توجد بيانات للفترة المحددة</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">تقرير المدفوعات</h2>
          {paymentsLoading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />جاري التحميل</div>}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">عدد المدفوعات</p><p className="mt-1 font-bold">{paymentsSummary?.total_payments || 0}</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">إجمالي المبالغ</p><p className="mt-1 font-bold text-emerald-700">{formatMoney(paymentsSummary?.total_amount)} ر.س</p></div>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-t border-b">
            <tr>
              <th className="text-right px-4 py-3 text-sm">الطريقة</th>
              <th className="text-right px-4 py-3 text-sm">العدد</th>
              <th className="text-right px-4 py-3 text-sm">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paymentsRows.map((p) => (
              <tr key={p.method} className="hover:bg-slate-50">
                <td className="px-4 py-3">{p.label}</td>
                <td className="px-4 py-3" dir="ltr">{p.count}</td>
                <td className="px-4 py-3 font-medium" dir="ltr">{formatMoney(p.total)} ر.س</td>
              </tr>
            ))}
            {paymentsRows.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">لا توجد بيانات للفترة المحددة</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">تقرير الخدمات</h2>
          {servicesLoading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />جاري التحميل</div>}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">عدد الخدمات</p><p className="mt-1 font-bold">{servicesSummary?.total_services || 0}</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">إجمالي الكمية</p><p className="mt-1 font-bold">{formatMoney(servicesSummary?.total_quantity)}</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">إجمالي الإيراد</p><p className="mt-1 font-bold text-emerald-700">{formatMoney(servicesSummary?.total_revenue)} ر.س</p></div>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-t border-b">
            <tr>
              <th className="text-right px-4 py-3 text-sm">الخدمة</th>
              <th className="text-right px-4 py-3 text-sm">الكمية</th>
              <th className="text-right px-4 py-3 text-sm">الإيراد</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {servicesRows.map((s) => (
              <tr key={`${s.id}-${s.name}`} className="hover:bg-slate-50">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3" dir="ltr">{formatMoney(s.quantity)}</td>
                <td className="px-4 py-3 font-medium" dir="ltr">{formatMoney(s.revenue)} ر.س</td>
              </tr>
            ))}
            {servicesRows.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">لا توجد بيانات للفترة المحددة</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">تقرير الفروع</h2>
          {branchesLoading && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />جاري التحميل</div>}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">عدد الفروع</p><p className="mt-1 font-bold">{branchesSummary?.total_branches || 0}</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">عدد الفواتير</p><p className="mt-1 font-bold">{branchesSummary?.total_invoices || 0}</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">إجمالي المبيعات</p><p className="mt-1 font-bold text-emerald-700">{formatMoney(branchesSummary?.total_sales)} ر.س</p></div>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-t border-b">
            <tr>
              <th className="text-right px-4 py-3 text-sm">الفرع</th>
              <th className="text-right px-4 py-3 text-sm">الفواتير</th>
              <th className="text-right px-4 py-3 text-sm">المبيعات</th>
              <th className="text-right px-4 py-3 text-sm">الضريبة</th>
              <th className="text-right px-4 py-3 text-sm">الموظفين</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {branchRows.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3" dir="ltr">{b.total_invoices}</td>
                <td className="px-4 py-3" dir="ltr">{formatMoney(b.total_sales)} ر.س</td>
                <td className="px-4 py-3" dir="ltr">{formatMoney(b.total_tax)} ر.س</td>
                <td className="px-4 py-3" dir="ltr">{b.employees_count}</td>
              </tr>
            ))}
            {branchRows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">لا توجد بيانات للفترة المحددة</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">أفضل العملاء</h2>
          <div className="flex items-center gap-2">
            <select value={customerSort} onChange={(e) => setCustomerSort(e.target.value)} className="px-3 py-2 border rounded-xl text-sm">
              <option value="total_spent">حسب الإنفاق</option>
              <option value="total_orders">حسب الطلبات</option>
            </select>
            {customersLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">إجمالي العملاء</p><p className="mt-1 font-bold">{customersSummary?.total_customers || 0}</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">عملاء VIP</p><p className="mt-1 font-bold">{customersSummary?.vip_customers || 0}</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">إجمالي الإيراد</p><p className="mt-1 font-bold text-emerald-700">{formatMoney(customersSummary?.total_revenue)} ر.س</p></div>
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs text-slate-500">المتوسط للعميل</p><p className="mt-1 font-bold">{formatMoney(customersSummary?.average_per_customer)} ر.س</p></div>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-t border-b">
            <tr>
              <th className="text-right px-4 py-3 text-sm">العميل</th>
              <th className="text-right px-4 py-3 text-sm">الجوال</th>
              <th className="text-right px-4 py-3 text-sm">الطلبات</th>
              <th className="text-right px-4 py-3 text-sm">الإنفاق</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customerRows.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <span>{c.name}</span>
                    {c.is_vip && <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs"><Star size={12} className="fill-amber-500 text-amber-500" />VIP</span>}
                  </div>
                </td>
                <td className="px-4 py-3" dir="ltr">{c.phone}</td>
                <td className="px-4 py-3" dir="ltr">{c.total_orders}</td>
                <td className="px-4 py-3 font-medium" dir="ltr">{formatMoney(c.total_spent)} ر.س</td>
              </tr>
            ))}
            {customerRows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">لا توجد بيانات</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UsersPage = ({ lang, showToast }) => {
  const { user: currentUser } = useAuth();
  const canManageUsers = hasPermission(currentUser, 'users');

  const PERMISSION_SCHEMA = [
    { key: 'dashboard', label: 'لوحة التحكم', type: 'boolean' },
    { key: 'cash_drawer', label: 'إدارة الصندوق', type: 'boolean' },
    { key: 'services', label: 'الخدمات', type: 'actions', actions: ['view', 'create', 'update', 'delete'] },
    { key: 'customers', label: 'العملاء', type: 'actions', actions: ['view', 'create', 'update', 'delete'] },
    { key: 'invoices', label: 'الفواتير', type: 'actions', actions: ['view', 'create', 'update', 'delete', 'pay', 'discount'] },
    { key: 'reports', label: 'التقارير', type: 'boolean' },
    { key: 'subscriptions', label: 'الاشتراكات', type: 'boolean' },
    { key: 'audit', label: 'سجل التدقيق', type: 'boolean' },
    { key: 'users', label: 'المستخدمين', type: 'boolean' },
    { key: 'settings', label: 'الإعدادات', type: 'boolean' },
  ];

  const emptyUserForm = {
    name: '',
    email: '',
    phone: '',
    role_id: '',
    branch_id: '',
    password: '',
  };

  const { data: users, loading, refetch } = useApi(() => api.users.getAll({ limit: 200 }));
  const { data: roles, refetch: refetchRoles } = useApi(() => api.users.getRoles());
  const { data: branches } = useApi(() => api.branches.getAll({ limit: 200 }));

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [rolePermsDraft, setRolePermsDraft] = useState(null);
  const [savingRolePerms, setSavingRolePerms] = useState(false);

  useEffect(() => {
    if (!selectedRoleId) {
      setRolePermsDraft(null);
      return;
    }
    const role = (roles || []).find((r) => String(r.id) === String(selectedRoleId));
    setRolePermsDraft(role?.permissions ? JSON.parse(JSON.stringify(role.permissions)) : {});
  }, [selectedRoleId, roles]);

  const isRoleOwner = (role) => role?.permissions?.all === true;

  const setModuleBoolean = (moduleKey, enabled) => {
    setRolePermsDraft((prev) => {
      const next = { ...(prev || {}) };
      if (enabled) next[moduleKey] = true;
      else delete next[moduleKey];
      return next;
    });
  };

  const setModuleAction = (moduleKey, action, enabled) => {
    setRolePermsDraft((prev) => {
      const next = { ...(prev || {}) };
      const current = next[moduleKey];

      // If module currently enabled as boolean (true), convert to actions model.
      const base = (typeof current === 'object' && current !== null) ? { ...current } : {};
      base[action] = !!enabled;

      // If all actions false, remove module.
      const anyTrue = Object.values(base).some((v) => v === true);
      if (!anyTrue) delete next[moduleKey];
      else next[moduleKey] = base;

      return next;
    });
  };

  const isModuleEnabled = (perms, moduleKey) => {
    if (!perms) return false;
    if (perms.all === true) return true;
    const value = perms[moduleKey];
    if (value === true) return true;
    if (typeof value === 'object' && value !== null) return Object.values(value).some((v) => v === true);
    return false;
  };

  const isActionEnabled = (perms, moduleKey, action) => {
    if (!perms) return false;
    if (perms.all === true) return true;
    const value = perms[moduleKey];
    if (value === true) return true;
    if (typeof value === 'object' && value !== null) return value[action] === true;
    return false;
  };

  const saveRolePermissions = async () => {
    const role = (roles || []).find((r) => String(r.id) === String(selectedRoleId));
    if (!role) return;

    if (!canManageUsers) {
      showToast('ليس لديك صلاحية إدارة المستخدمين', 'error');
      return;
    }

    if (isRoleOwner(role)) {
      showToast('لا يوصى بتعديل صلاحيات المالك', 'error');
      return;
    }

    try {
      setSavingRolePerms(true);
      await api.users.updateRole(role.id, { permissions: rolePermsDraft || {} });
      showToast('تم حفظ صلاحيات الدور', 'success');
      await refetchRoles();
    } catch (err) {
      showToast(err.message || 'فشل حفظ الصلاحيات', 'error');
    } finally {
      setSavingRolePerms(false);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [saving, setSaving] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const openCreate = () => {
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setUserForm({
      ...emptyUserForm,
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role_id: u.role_id ? String(u.role_id) : '',
      branch_id: u.branch_id ? String(u.branch_id) : '',
      password: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setSaving(false);
  };

  const submitUser = async () => {
    try {
      if (!canManageUsers) {
        showToast('ليس لديك صلاحية إدارة المستخدمين', 'error');
        return;
      }

      const selectedRole = (roles || []).find((r) => String(r.id) === String(userForm.role_id));
      const rolePerms = selectedRole?.permissions;
      const roleNeedsBranch = !!rolePerms && (rolePerms.all === true || rolePerms.cash_drawer === true);
      if (roleNeedsBranch && !userForm.branch_id) {
        showToast('هذا الدور يتطلب تحديد فرع (لأن لديه صلاحية إدارة الصندوق).', 'error');
        return;
      }

      if (!userForm.name?.trim() || !userForm.email?.trim() || !userForm.role_id) {
        showToast('الاسم والإيميل والدور مطلوبين', 'error');
        return;
      }

      if (!editingUser && !userForm.password?.trim()) {
        showToast('كلمة المرور مطلوبة عند إنشاء مستخدم جديد', 'error');
        return;
      }

      setSaving(true);
      const payload = {
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        phone: userForm.phone?.trim() || null,
        role_id: Number(userForm.role_id),
        branch_id: userForm.branch_id ? Number(userForm.branch_id) : null,
        ...(editingUser ? {} : { password: userForm.password.trim() }),
      };

      if (editingUser) {
        await api.users.update(editingUser.id, payload);
        showToast('تم تحديث المستخدم', 'success');
      } else {
        await api.users.create(payload);
        showToast('تم إضافة المستخدم', 'success');
      }

      closeModal();
      refetch();
    } catch (err) {
      showToast(err.message, 'error');
      setSaving(false);
    }
  };

  const toggleUser = async (u) => {
    if (!canManageUsers) {
      showToast('ليس لديك صلاحية إدارة المستخدمين', 'error');
      return;
    }
    try {
      await api.users.toggle(u.id);
      showToast(u.is_active ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم', 'success');
      refetch();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openPasswordReset = (u) => {
    setPasswordUser(u);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordReset = () => {
    setShowPasswordModal(false);
    setPasswordUser(null);
    setNewPassword('');
    setSavingPassword(false);
  };

  const submitPasswordReset = async () => {
    if (!canManageUsers) {
      showToast('ليس لديك صلاحية إدارة المستخدمين', 'error');
      return;
    }
    if (!passwordUser) return;
    if (!newPassword.trim()) {
      showToast('اكتب كلمة مرور جديدة', 'error');
      return;
    }
    try {
      setSavingPassword(true);
      await api.users.updatePassword(passwordUser.id, newPassword.trim());
      showToast('تم تغيير كلمة المرور', 'success');
      closePasswordReset();
    } catch (err) {
      showToast(err.message, 'error');
      setSavingPassword(false);
    }
  };

  if (!canManageUsers) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">المستخدمين</h1>
        <div className="bg-white rounded-2xl border p-10 text-center">
          <Lock className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 font-medium">ليس لديك صلاحية الوصول</p>
          <p className="text-sm text-slate-500 mt-1">تواصل مع المالك لمنحك صلاحية إدارة المستخدمين.</p>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">المستخدمين</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة المستخدمين والأدوار وربطهم بالفروع</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl">
          <UserPlus size={18} />إضافة مستخدم
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="font-bold">الأدوار والصلاحيات</h2>
            <p className="text-sm text-slate-500 mt-1">اختر دوراً ثم عدّل صلاحياته</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="h-11 px-3 border rounded-xl"
            >
              <option value="">اختر دور</option>
              {(roles || []).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button
              onClick={saveRolePermissions}
              disabled={!selectedRoleId || savingRolePerms || !rolePermsDraft}
              className="h-11 px-4 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60"
              title="حفظ صلاحيات الدور"
            >
              {savingRolePerms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              حفظ
            </button>
          </div>
        </div>

        {selectedRoleId && (
          <div className="mt-4">
            {(() => {
              const role = (roles || []).find((r) => String(r.id) === String(selectedRoleId));
              const ownerRole = isRoleOwner(role);
              return (
                <>
                  {ownerRole ? (
                    <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                      هذا الدور (مالك) لديه <b>كل الصلاحيات</b>. عادة لا يتم تعديل صلاحياته.
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PERMISSION_SCHEMA.map((mod) => {
                      const enabled = isModuleEnabled(rolePermsDraft, mod.key);
                      return (
                        <div key={mod.key} className="border rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{mod.label}</p>
                              <p className="text-xs text-slate-500 mt-1">{mod.key}</p>
                            </div>

                            <button
                              type="button"
                              disabled={ownerRole}
                              onClick={() => setModuleBoolean(mod.key, !enabled)}
                              className={`h-10 px-3 rounded-xl border text-sm ${enabled ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white'}`}
                              title={enabled ? 'تعطيل' : 'تفعيل'}
                            >
                              {enabled ? 'مفعّل' : 'معطّل'}
                            </button>
                          </div>

                          {mod.type === 'actions' && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {mod.actions.map((action) => {
                                const aEnabled = isActionEnabled(rolePermsDraft, mod.key, action);
                                return (
                                  <button
                                    key={action}
                                    type="button"
                                    disabled={ownerRole}
                                    onClick={() => setModuleAction(mod.key, action, !aEnabled)}
                                    className={`h-10 px-3 rounded-xl border text-xs ${aEnabled ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white text-slate-700'}`}
                                  >
                                    {action}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 text-sm">المستخدم</th>
              <th className="text-right px-4 py-3 text-sm">الدور</th>
              <th className="text-right px-4 py-3 text-sm">الفرع</th>
              <th className="text-right px-4 py-3 text-sm">الحالة</th>
              <th className="text-right px-4 py-3 text-sm">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users?.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">{u.name?.charAt(0) || 'م'}</div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-slate-500" dir="ltr">{u.email}</p>
                      {u.phone && <p className="text-xs text-slate-400" dir="ltr">{u.phone}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{u.role_name}</span></td>
                <td className="px-4 py-3">{u.branch_name || 'جميع الفروع'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleUser(u)} className={`px-2 py-1 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.is_active ? 'نشط' : 'معطل'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(u)} className="p-2 rounded-xl border hover:bg-white" title="تعديل">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => openPasswordReset(u)} className="p-2 rounded-xl border hover:bg-white" title="تغيير كلمة المرور">
                      <KeyRound size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">لا يوجد مستخدمون</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم'}</h3>
              <button onClick={closeModal}><X size={20} /></button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الاسم</label>
                <input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني</label>
                <input value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الجوال (اختياري)</label>
                  <input value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الفرع (اختياري)</label>
                  <select value={userForm.branch_id} onChange={(e) => setUserForm({ ...userForm, branch_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                    <option value="">جميع الفروع</option>
                    {(branches || []).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الدور</label>
                <select value={userForm.role_id} onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                  <option value="">اختر دور</option>
                  {(roles || []).map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                {userForm.role_id && (
                  <div className="mt-2 text-xs text-slate-500">
                    صلاحيات الدور: {(() => {
                      const role = (roles || []).find((r) => String(r.id) === String(userForm.role_id));
                      const perms = role?.permissions;
                      if (!perms) return '—';
                      if (perms.all === true) return 'كل الصلاحيات';
                      const keys = Object.keys(perms).filter((k) => perms[k]);
                      return keys.length ? keys.join('، ') : '—';
                    })()}
                  </div>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور</label>
                  <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
              )}
            </div>

            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={closeModal} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={submitUser} disabled={saving} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">تغيير كلمة المرور</h3>
              <button onClick={closePasswordReset}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600">المستخدم: <span className="font-medium">{passwordUser?.name}</span></p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
                placeholder="كلمة مرور جديدة"
                dir="ltr"
              />
              <p className="text-xs text-slate-500">ملاحظة: هذا تغيير مباشر لكلمة المرور (للتطوير).</p>
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={closePasswordReset} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={submitPasswordReset} disabled={savingPassword} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60">
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound size={16} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AuditPage = ({ lang, showToast }) => {
  const { user } = useAuth();

  const { data: branches } = useApi(() => api.branches.getAll(), []);
  const { data: users } = useApi(() => api.users.getAll(), []);
  const { data: types } = useApi(() => api.audit.getTypes(), []);

  const [filters, setFilters] = useState({
    branch_id: '',
    user_id: '',
    action_type: '',
    risk_level: '',
    is_flagged: 'true',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 50,
  });
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const allowedByRole = [1, 2].includes(user?.role?.id);
  if (!allowedByRole && !hasPermission(user, 'all')) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Lock size={18} className="text-slate-600" /></div>
          <div>
            <h2 className="font-bold">لا تملك صلاحية الوصول</h2>
            <p className="text-sm text-slate-600 mt-1">هذه الصفحة مقيدة حسب الدور/الصلاحيات.</p>
          </div>
        </div>
      </div>
    );
  }

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.audit.getStats();
      setStats(res.data);
    } catch {}
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k];
      });
      const res = await api.audit.getAll(params);
      setLogs(res.data || []);
      setPagination(res.pagination || null);
    } catch (err) {
      showToast(err.message || 'حدث خطأ', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const openDetails = async (log) => {
    setDetailsOpen(true);
    setSelectedLog(null);
    setReviewNotes('');
    try {
      setDetailsLoading(true);
      const res = await api.audit.getById(log.id);
      setSelectedLog(res.data);
      setReviewNotes(res.data?.review_notes || '');
    } catch (err) {
      showToast(err.message || 'تعذر جلب التفاصيل', 'error');
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const doReview = async (id) => {
    try {
      setSaving(true);
      await api.audit.review(id, { reviewed_by: user?.id || 1, notes: reviewNotes || undefined });
      showToast('تمت المراجعة', 'success');
      await fetchStats();
      await fetchLogs();
      if (detailsOpen) {
        const res = await api.audit.getById(id);
        setSelectedLog(res.data);
      }
    } catch (err) {
      showToast(err.message || 'فشل الإجراء', 'error');
    } finally {
      setSaving(false);
    }
  };

  const doFlagToggle = async (id, isFlagged) => {
    try {
      setSaving(true);
      await api.audit.flag(id, { is_flagged: !isFlagged });
      showToast(!isFlagged ? 'تم وضع علامة' : 'تم إزالة العلامة', 'success');
      await fetchStats();
      await fetchLogs();
      if (detailsOpen) {
        const res = await api.audit.getById(id);
        setSelectedLog(res.data);
      }
    } catch (err) {
      showToast(err.message || 'فشل الإجراء', 'error');
    } finally {
      setSaving(false);
    }
  };

  const riskBadge = (risk) => {
    const base = 'px-2 py-1 rounded-lg text-xs font-medium';
    switch (risk) {
      case 'critical': return <span className={`${base} bg-red-100 text-red-700`}>حرج</span>;
      case 'high': return <span className={`${base} bg-orange-100 text-orange-700`}>عالي</span>;
      case 'medium': return <span className={`${base} bg-yellow-100 text-yellow-700`}>متوسط</span>;
      default: return <span className={`${base} bg-slate-100 text-slate-700`}>منخفض</span>;
    }
  };

  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-6">
      <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
        <div>
          <h1 className="text-2xl font-bold">رادار الاحتيال</h1>
          <p className="text-sm text-slate-500 mt-1">مراجعة العمليات ذات المخاطر العالية وتتبع سجل التغييرات.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchStats(); fetchLogs(); }} className="px-4 py-2 border rounded-xl flex items-center gap-2">
            <RefreshCw size={16} /> تحديث
          </button>
          <span className="px-4 py-2 bg-red-100 text-red-700 rounded-xl flex items-center gap-2"><AlertTriangle size={18} />{stats?.unreviewed ?? (logs?.length || 0)} غير مُراجع</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-sm text-slate-500">إجمالي السجلات</p>
          <p className="text-2xl font-bold mt-1">{stats?.total_logs ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-sm text-slate-500">عمليات مُعلّمة</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{stats?.flagged ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-sm text-slate-500">غير مُراجَعة</p>
          <p className="text-2xl font-bold mt-1">{stats?.unreviewed ?? '—'}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-sm text-slate-500">آخر 7 أيام</p>
          <p className="text-2xl font-bold mt-1">{stats?.recent_count ?? '—'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">الفرع</label>
            <select value={filters.branch_id} onChange={(e) => setFilters({ ...filters, page: 1, branch_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">جميع الفروع</option>
              {(branches || []).map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">المستخدم</label>
            <select value={filters.user_id} onChange={(e) => setFilters({ ...filters, page: 1, user_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">جميع المستخدمين</option>
              {(users || []).map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">نوع العملية</label>
            <select value={filters.action_type} onChange={(e) => setFilters({ ...filters, page: 1, action_type: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">الكل</option>
              {(types || []).map((t) => (<option key={t.value} value={t.value}>{lang === 'ar' ? t.label : t.label_en}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">مستوى المخاطر</label>
            <select value={filters.risk_level} onChange={(e) => setFilters({ ...filters, page: 1, risk_level: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">الكل</option>
              <option value="low">منخفض</option>
              <option value="medium">متوسط</option>
              <option value="high">عالي</option>
              <option value="critical">حرج</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">من</label>
            <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, page: 1, date_from: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">إلى</label>
            <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, page: 1, date_to: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <button onClick={() => setFilters({ ...filters, page: 1, is_flagged: filters.is_flagged === 'true' ? '' : 'true' })} className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${filters.is_flagged === 'true' ? 'bg-red-50 border-red-200 text-red-700' : ''}`}>
              <AlertTriangle size={16} /> المشبوه فقط
            </button>
            <button onClick={() => setFilters({ branch_id: '', user_id: '', action_type: '', risk_level: '', is_flagged: 'true', date_from: '', date_to: '', page: 1, limit: 50 })} className="px-4 py-2 rounded-xl border">مسح</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">السجل</h2>
          <p className="text-sm text-slate-500">{pagination ? `${pagination.total} سجل` : `${logs?.length || 0} سجل`}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">الوصف</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">المستخدم</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">الفرع</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">المخاطر</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).map((log) => (
                <tr key={log.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      {log.is_flagged ? <AlertTriangle size={16} className="text-red-600 mt-0.5" /> : <CheckCircle2 size={16} className="text-emerald-600 mt-0.5" />}
                      <div>
                        <p className="font-medium">{log.description}</p>
                        <p className="text-xs text-slate-500">{log.action_type} · {log.entity_type}:{log.entity_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.user_name || '—'}</td>
                  <td className="px-4 py-3 text-sm">{log.branch_name || '—'}</td>
                  <td className="px-4 py-3">{riskBadge(log.risk_level)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600" dir="ltr">{log.created_at}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openDetails(log)} className="px-3 py-2 border rounded-xl flex items-center gap-2"><Eye size={16} />عرض</button>
                      <button onClick={() => doReview(log.id)} disabled={saving} className="px-3 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60"><Check size={16} />مراجعة</button>
                      <button onClick={() => doFlagToggle(log.id, !!log.is_flagged)} disabled={saving} className="px-3 py-2 border rounded-xl flex items-center gap-2 disabled:opacity-60">
                        {log.is_flagged ? <EyeOff size={16} /> : <AlertTriangle size={16} />}
                        {log.is_flagged ? 'إزالة' : 'علامة'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">لا توجد سجلات مطابقة</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <div className="p-4 border-t flex items-center justify-between">
            <button
              onClick={() => setFilters({ ...filters, page: Math.max(1, Number(filters.page) - 1) })}
              disabled={Number(filters.page) <= 1}
              className="px-4 py-2 border rounded-xl disabled:opacity-60"
            >السابق</button>
            <p className="text-sm text-slate-600" dir="ltr">{pagination.page} / {pagination.totalPages}</p>
            <button
              onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, Number(filters.page) + 1) })}
              disabled={Number(filters.page) >= pagination.totalPages}
              className="px-4 py-2 border rounded-xl disabled:opacity-60"
            >التالي</button>
          </div>
        )}
      </div>

      {detailsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">تفاصيل السجل</h3>
              <button onClick={() => setDetailsOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              {detailsLoading ? (
                <div className="py-10"><LoadingSpinner /></div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">المستخدم</p>
                      <p className="font-medium mt-1">{selectedLog?.user?.name || selectedLog?.user_name || '—'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">الفرع</p>
                      <p className="font-medium mt-1">{selectedLog?.branch?.name || selectedLog?.branch_name || '—'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">المخاطر</p>
                      <div className="mt-1">{riskBadge(selectedLog?.risk_level)}</div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-2xl p-4">
                    <p className="font-medium">{selectedLog?.description}</p>
                    <p className="text-xs text-slate-500 mt-1" dir="ltr">{selectedLog?.created_at}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border rounded-2xl p-4">
                      <p className="text-sm font-medium mb-2">القيمة السابقة</p>
                      <pre className="text-xs bg-slate-50 p-3 rounded-xl overflow-auto" dir="ltr">{JSON.stringify(selectedLog?.old_value ?? null, null, 2)}</pre>
                    </div>
                    <div className="border rounded-2xl p-4">
                      <p className="text-sm font-medium mb-2">القيمة الجديدة</p>
                      <pre className="text-xs bg-slate-50 p-3 rounded-xl overflow-auto" dir="ltr">{JSON.stringify(selectedLog?.new_value ?? null, null, 2)}</pre>
                    </div>
                  </div>

                  <div className="border rounded-2xl p-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظات المراجعة (اختياري)</label>
                    <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} className="w-full px-3 py-2 border rounded-xl min-h-[90px]" />
                  </div>
                </>
              )}
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={() => setDetailsOpen(false)} className="px-4 py-2 border rounded-xl">إغلاق</button>
              <button
                onClick={() => doFlagToggle(selectedLog?.id, !!selectedLog?.is_flagged)}
                disabled={saving || !selectedLog}
                className="px-4 py-2 border rounded-xl flex items-center gap-2 disabled:opacity-60"
              >
                {selectedLog?.is_flagged ? <EyeOff size={16} /> : <AlertTriangle size={16} />}
                {selectedLog?.is_flagged ? 'إزالة العلامة' : 'وضع علامة'}
              </button>
              <button
                onClick={() => doReview(selectedLog?.id)}
                disabled={saving || !selectedLog}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                مراجعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SubscriptionsPage = ({ lang, showToast }) => {
  const { user } = useAuth();
  const allowed = hasPermission(user, 'all') || user?.role?.id === 1 || user?.role?.id === 2;
  if (!allowed) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Lock size={18} className="text-slate-600" /></div>
          <div>
            <h2 className="font-bold">لا تملك صلاحية الوصول</h2>
            <p className="text-sm text-slate-600 mt-1">هذه الصفحة مقيدة حسب الدور/الصلاحيات.</p>
          </div>
        </div>
      </div>
    );
  }

  const { data: branches } = useApi(() => api.branches.getAll(), []);
  const { data: customers } = useApi(() => api.customers.getAll(), []);

  const [stats, setStats] = useState(null);
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'active', plan_id: '', customer_id: '' });
  const [search, setSearch] = useState('');

  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', name_en: '', description: '', price: '', duration_days: 30, items_limit: '', kg_limit: '', discount_percent: 0 });
  const [savingPlan, setSavingPlan] = useState(false);

  const [subModal, setSubModal] = useState(false);
  const [subForm, setSubForm] = useState({ customer_id: '', plan_id: '', branch_id: '' });
  const [savingSub, setSavingSub] = useState(false);

  const [useModal, setUseModal] = useState(false);
  const [useSub, setUseSub] = useState(null);
  const [useForm, setUseForm] = useState({ items: 0, kg: 0 });
  const [savingUse, setSavingUse] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [plansRes, subsRes, statsRes] = await Promise.all([
        api.subscriptions.getPlans(),
        api.subscriptions.getAll(filters),
        api.subscriptions.getStats(),
      ]);
      setPlans(plansRes.data || []);
      setSubs(subsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      showToast(err.message || 'حدث خطأ', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({ name: '', name_en: '', description: '', price: '', duration_days: 30, items_limit: '', kg_limit: '', discount_percent: 0 });
    setPlanModal(true);
  };
  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || '',
      name_en: plan.name_en || '',
      description: plan.description || '',
      price: plan.price ?? '',
      duration_days: plan.duration_days ?? 30,
      items_limit: plan.items_limit ?? '',
      kg_limit: plan.kg_limit ?? '',
      discount_percent: plan.discount_percent ?? 0,
    });
    setPlanModal(true);
  };
  const savePlan = async () => {
    try {
      setSavingPlan(true);
      const payload = {
        ...planForm,
        price: planForm.price === '' ? undefined : Number(planForm.price),
        duration_days: Number(planForm.duration_days || 30),
        items_limit: planForm.items_limit === '' ? null : Number(planForm.items_limit),
        kg_limit: planForm.kg_limit === '' ? null : Number(planForm.kg_limit),
        discount_percent: Number(planForm.discount_percent || 0),
      };
      if (editingPlan) {
        await api.subscriptions.updatePlan(editingPlan.id, payload);
        showToast('تم تحديث الباقة', 'success');
      } else {
        await api.subscriptions.createPlan(payload);
        showToast('تم إضافة الباقة', 'success');
      }
      setPlanModal(false);
      await fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل الحفظ', 'error');
    } finally {
      setSavingPlan(false);
    }
  };
  const togglePlan = async (id) => {
    try {
      await api.subscriptions.togglePlan(id);
      showToast('تم تحديث حالة الباقة', 'success');
      await fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل الإجراء', 'error');
    }
  };

  const openCreateSub = () => {
    setSubForm({ customer_id: '', plan_id: '', branch_id: '' });
    setSubModal(true);
  };
  const createSub = async () => {
    try {
      setSavingSub(true);
      await api.subscriptions.createSubscription({
        customer_id: Number(subForm.customer_id),
        plan_id: Number(subForm.plan_id),
        branch_id: subForm.branch_id ? Number(subForm.branch_id) : null,
      });
      showToast('تم إنشاء الاشتراك', 'success');
      setSubModal(false);
      await fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل إنشاء الاشتراك', 'error');
    } finally {
      setSavingSub(false);
    }
  };

  const openUse = (sub) => {
    setUseSub(sub);
    setUseForm({ items: 0, kg: 0 });
    setUseModal(true);
  };
  const submitUse = async () => {
    try {
      setSavingUse(true);
      await api.subscriptions.use(useSub.id, { items: Number(useForm.items || 0), kg: Number(useForm.kg || 0) });
      showToast('تم تحديث الاستخدام', 'success');
      setUseModal(false);
      await fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل تحديث الاستخدام', 'error');
    } finally {
      setSavingUse(false);
    }
  };

  const cancelSub = async (id) => {
    try {
      await api.subscriptions.cancel(id);
      showToast('تم إلغاء الاشتراك', 'success');
      await fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل الإجراء', 'error');
    }
  };
  const renewSub = async (id) => {
    try {
      await api.subscriptions.renew(id);
      showToast('تم تجديد الاشتراك', 'success');
      await fetchAll();
    } catch (err) {
      showToast(err.message || 'فشل الإجراء', 'error');
    }
  };

  const filteredSubs = (subs || []).filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return String(s.customer_name || '').toLowerCase().includes(q) || String(s.customer_phone || '').includes(q);
  });

  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-6">
      <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
        <div>
          <h1 className="text-2xl font-bold">الاشتراكات</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة الباقات واشتراكات العملاء واستخدامها.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchAll()} className="px-4 py-2 border rounded-xl flex items-center gap-2"><RefreshCw size={16} /> تحديث</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border p-4"><p className="text-sm text-slate-500">الباقات</p><p className="text-2xl font-bold mt-1">{stats?.total_plans ?? '—'}</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-sm text-slate-500">الباقات النشطة</p><p className="text-2xl font-bold mt-1">{stats?.active_plans ?? '—'}</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-sm text-slate-500">اشتراكات نشطة</p><p className="text-2xl font-bold mt-1">{stats?.active_subscriptions ?? '—'}</p></div>
        <div className="bg-white rounded-2xl border p-4"><p className="text-sm text-slate-500">إيراد شهري</p><p className="text-2xl font-bold mt-1">{formatMoney(stats?.monthly_revenue ?? 0)} ر.س</p></div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">باقات الاشتراك</h2>
          <button onClick={openCreatePlan} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2"><Plus size={16} />إضافة باقة</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">الباقة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">السعر</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">المدة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">الحدود</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">خصم</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">مشتركين</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(plans || []).map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    {p.description ? <p className="text-xs text-slate-500 mt-0.5">{p.description}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-sm" dir="ltr">{formatMoney(p.price)} SAR</td>
                  <td className="px-4 py-3 text-sm">{p.duration_days} يوم</td>
                  <td className="px-4 py-3 text-sm">
                    {p.items_limit ? `${p.items_limit} قطعة` : '—'}{p.kg_limit ? ` · ${p.kg_limit} كجم` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm">{p.discount_percent || 0}%</td>
                  <td className="px-4 py-3 text-sm">{p.subscribers_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{p.is_active ? 'نشطة' : 'متوقفة'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditPlan(p)} className="p-2 border rounded-lg"><Edit size={16} /></button>
                      <button onClick={() => togglePlan(p.id)} className="p-2 border rounded-lg">{p.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!plans || plans.length === 0) && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">لا توجد باقات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between gap-3 flex-col md:flex-row">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h2 className="font-bold">اشتراكات العملاء</h2>
            <span className="text-sm text-slate-500">({filteredSubs.length})</span>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الجوال..." className="w-full pr-9 pl-3 py-2 border rounded-xl" />
            </div>
            <button onClick={openCreateSub} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2"><Plus size={16} />اشتراك</button>
          </div>
        </div>

        <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">الحالة</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="active">نشط</option>
              <option value="expired">منتهي</option>
              <option value="cancelled">ملغي</option>
              <option value="">الكل</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">الباقة</label>
            <select value={filters.plan_id} onChange={(e) => setFilters({ ...filters, plan_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">كل الباقات</option>
              {(plans || []).map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">العميل</label>
            <select value={filters.customer_id} onChange={(e) => setFilters({ ...filters, customer_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
              <option value="">كل العملاء</option>
              {(customers || []).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">العميل</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">الباقة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">الفرع</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">الفترة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">الاستخدام</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map((s) => (
                <tr key={s.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.customer_name}</p>
                    <p className="text-xs text-slate-500" dir="ltr">{s.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{s.plan_name}</td>
                  <td className="px-4 py-3 text-sm">{s.branch_name || '—'}</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">{s.start_date} → {s.end_date}<div className="text-xs text-slate-500">{s.days_remaining} يوم متبقٍ</div></td>
                  <td className="px-4 py-3">
                    <div className="w-48">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1" dir="ltr">
                        <span>{s.items_used || 0}/{s.plan_items_limit || '—'}</span>
                        <span>{s.usage_percent || 0}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, s.usage_percent || 0))}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : s.status === 'expired' ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}`}>{s.status === 'active' ? 'نشط' : s.status === 'expired' ? 'منتهي' : 'ملغي'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {s.status === 'active' && (
                        <>
                          <button onClick={() => openUse(s)} className="px-3 py-2 border rounded-xl">استخدام</button>
                          <button onClick={() => cancelSub(s.id)} className="px-3 py-2 border rounded-xl text-red-600">إلغاء</button>
                        </>
                      )}
                      {s.status !== 'active' && (
                        <button onClick={() => renewSub(s.id)} className="px-3 py-2 bg-emerald-500 text-white rounded-xl">تجديد</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSubs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">لا توجد اشتراكات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {planModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{editingPlan ? 'تعديل باقة' : 'إضافة باقة'}</h3>
              <button onClick={() => setPlanModal(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم الباقة (عربي)</label>
                  <input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم الباقة (EN)</label>
                  <input value={planForm.name_en} onChange={(e) => setPlanForm({ ...planForm, name_en: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الوصف (اختياري)</label>
                <input value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">السعر</label>
                  <input type="number" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">المدة (يوم)</label>
                  <input type="number" value={planForm.duration_days} onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">حد القطع</label>
                  <input type="number" value={planForm.items_limit} onChange={(e) => setPlanForm({ ...planForm, items_limit: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">خصم %</label>
                  <input type="number" value={planForm.discount_percent} onChange={(e) => setPlanForm({ ...planForm, discount_percent: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={() => setPlanModal(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={savePlan} disabled={savingPlan} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60">
                {savingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {subModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">إنشاء اشتراك</h3>
              <button onClick={() => setSubModal(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">العميل</label>
                <select value={subForm.customer_id} onChange={(e) => setSubForm({ ...subForm, customer_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                  <option value="">اختر عميل</option>
                  {(customers || []).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الباقة</label>
                <select value={subForm.plan_id} onChange={(e) => setSubForm({ ...subForm, plan_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                  <option value="">اختر باقة</option>
                  {(plans || []).filter((p) => p.is_active).map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الفرع (اختياري)</label>
                <select value={subForm.branch_id} onChange={(e) => setSubForm({ ...subForm, branch_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl">
                  <option value="">—</option>
                  {(branches || []).map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={() => setSubModal(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={createSub} disabled={savingSub || !subForm.customer_id || !subForm.plan_id} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60">
                {savingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard size={16} />}
                إنشاء
              </button>
            </div>
          </div>
        </div>
      )}

      {useModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">استخدام من الاشتراك</h3>
              <button onClick={() => setUseModal(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-slate-600">العميل: <span className="font-medium">{useSub?.customer_name}</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">قطع</label>
                  <input type="number" value={useForm.items} onChange={(e) => setUseForm({ ...useForm, items: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">كجم (اختياري)</label>
                  <input type="number" value={useForm.kg} onChange={(e) => setUseForm({ ...useForm, kg: e.target.value })} className="w-full px-3 py-2 border rounded-xl" dir="ltr" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button onClick={() => setUseModal(false)} className="px-4 py-2 border rounded-xl">إلغاء</button>
              <button onClick={submitUse} disabled={savingUse} className="px-4 py-2 bg-emerald-500 text-white rounded-xl flex items-center gap-2 disabled:opacity-60">
                {savingUse ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage = ({ lang, showToast }) => {
  const { data: settings, loading, refetch } = useApi(() => api.settings.getAll());
  const { user } = useAuth();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!settings) return;
    // تحويل مفاتيح boolean من strings
    const normalized = { ...settings };
    ['whatsapp_invoice_created', 'whatsapp_ready_pickup', 'whatsapp_payment_received'].forEach((k) => {
      if (normalized[k] === 'true') normalized[k] = true;
      if (normalized[k] === 'false') normalized[k] = false;
    });
    setForm(normalized);
  }, [settings]);

  const canEdit = hasPermission(user, 'settings') || hasPermission(user, 'all');
  const handleSave = async () => {
    try {
      const payload = { ...form };
      // إعادة تحويل boolean إلى strings لأن backend يخزنها كنص
      ['whatsapp_invoice_created', 'whatsapp_ready_pickup', 'whatsapp_payment_received'].forEach((k) => {
        if (typeof payload[k] === 'boolean') payload[k] = payload[k] ? 'true' : 'false';
      });
      await api.settings.updateBulk(payload);
      showToast('تم الحفظ', 'success');
      refetch();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الإعدادات</h1>
      {!canEdit && (
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Lock size={18} className="text-slate-600" /></div>
            <div>
              <h2 className="font-bold">صلاحية غير كافية</h2>
              <p className="text-sm text-slate-600 mt-1">يمكنك عرض الإعدادات لكن لا يمكنك تعديلها.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-bold">معلومات المغسلة</h2>
          <div>
            <label className="block text-sm mb-1">اسم المغسلة</label>
            <input disabled={!canEdit} type="text" value={form.laundry_name || ''} onChange={(e) => setForm({ ...form, laundry_name: e.target.value })} className="w-full px-3 py-2 border rounded-xl disabled:bg-slate-50" />
          </div>
          <div>
            <label className="block text-sm mb-1">اسم المغسلة (EN)</label>
            <input disabled={!canEdit} type="text" value={form.laundry_name_en || ''} onChange={(e) => setForm({ ...form, laundry_name_en: e.target.value })} className="w-full px-3 py-2 border rounded-xl disabled:bg-slate-50" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm mb-1">العملة</label>
            <select disabled={!canEdit} value={form.currency || 'SAR'} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 border rounded-xl disabled:bg-slate-50">
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-bold">الضرائب والفوترة</h2>
          <div>
            <label className="block text-sm mb-1">الرقم الضريبي</label>
            <input disabled={!canEdit} type="text" value={form.tax_number || ''} onChange={(e) => setForm({ ...form, tax_number: e.target.value })} className="w-full px-3 py-2 border rounded-xl disabled:bg-slate-50" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm mb-1">نسبة الضريبة %</label>
            <input disabled={!canEdit} type="number" value={form.tax_rate || ''} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} className="w-full px-3 py-2 border rounded-xl disabled:bg-slate-50" dir="ltr" />
          </div>
          <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.zatca_status === 'connected' ? 'bg-emerald-100' : 'bg-yellow-100'}`}>
              {form.zatca_status === 'connected' ? <CheckCircle2 size={18} className="text-emerald-700" /> : <AlertTriangle size={18} className="text-yellow-700" />}
            </div>
            <div>
              <p className="font-medium">ZATCA</p>
              <p className="text-sm text-slate-600">الحالة: <span className="font-medium">{form.zatca_status || '—'}</span></p>
              <p className="text-xs text-slate-500" dir="ltr">Device: {form.zatca_device_id || '—'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-bold">إشعارات واتساب</h2>
          <label className="flex items-center gap-3 p-3 border rounded-xl">
            <input disabled={!canEdit} type="checkbox" checked={!!form.whatsapp_invoice_created} onChange={(e) => setForm({ ...form, whatsapp_invoice_created: e.target.checked })} />
            <div>
              <p className="font-medium">إرسال عند إنشاء فاتورة</p>
              <p className="text-xs text-slate-500">whatsapp_invoice_created</p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 border rounded-xl">
            <input disabled={!canEdit} type="checkbox" checked={!!form.whatsapp_ready_pickup} onChange={(e) => setForm({ ...form, whatsapp_ready_pickup: e.target.checked })} />
            <div>
              <p className="font-medium">إرسال عند جاهزية الاستلام</p>
              <p className="text-xs text-slate-500">whatsapp_ready_pickup</p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 border rounded-xl">
            <input disabled={!canEdit} type="checkbox" checked={!!form.whatsapp_payment_received} onChange={(e) => setForm({ ...form, whatsapp_payment_received: e.target.checked })} />
            <div>
              <p className="font-medium">إرسال عند استلام الدفع</p>
              <p className="text-xs text-slate-500">whatsapp_payment_received</p>
            </div>
          </label>
        </div>

        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="font-bold">إعدادات متقدمة</h2>
          <div>
            <label className="block text-sm mb-1">ZATCA Status</label>
            <select disabled={!canEdit} value={form.zatca_status || 'connected'} onChange={(e) => setForm({ ...form, zatca_status: e.target.value })} className="w-full px-3 py-2 border rounded-xl disabled:bg-slate-50">
              <option value="connected">connected</option>
              <option value="disconnected">disconnected</option>
              <option value="pending">pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">ZATCA Device ID</label>
            <input disabled={!canEdit} type="text" value={form.zatca_device_id || ''} onChange={(e) => setForm({ ...form, zatca_device_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl disabled:bg-slate-50" dir="ltr" />
          </div>
          <div className="text-xs text-slate-500">ملاحظة: هذه الحقول تجريبية ضمن mock backend.</div>
        </div>
      </div>

      <div className="flex justify-end">
        <button disabled={!canEdit} onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl disabled:opacity-60"><Save size={18} />حفظ</button>
      </div>
    </div>
  );
};

// =====================================================
// التطبيق الرئيسي
// =====================================================
const MainApp = () => {
  const { user } = useAuth();
  const [lang, setLang] = useState('ar');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const renderPage = () => {
    const props = { lang, showToast };
    switch (currentPage) {
      case 'dashboard': return <DashboardPage {...props} />;
      case 'services': return <ServicesPage {...props} />;
      case 'customers': return <CustomersPage {...props} />;
      case 'invoices': return <InvoicesPage {...props} />;
      case 'branches': return <BranchesPage {...props} />;
      case 'reports': return <ReportsPage {...props} />;
      case 'users': return <UsersPage {...props} />;
      case 'audit': return <AuditPage {...props} />;
      case 'subscriptions': return <SubscriptionsPage {...props} />;
      case 'settings': return <SettingsPage {...props} />;
      default: return <DashboardPage {...props} />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap'); * { font-family: 'Tajawal', sans-serif; }`}</style>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} currentPage={currentPage} setCurrentPage={setCurrentPage} lang={lang} user={user} />
      <div className={`${lang === 'ar' ? 'lg:mr-64' : 'lg:ml-64'} min-h-screen`}>
        <Header setIsOpen={setSidebarOpen} lang={lang} setLang={setLang} user={user} />
        <main className="p-4 lg:p-6">{renderPage()}</main>
      </div>
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {toast.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="mr-auto"><X size={16} /></button>
        </div>
      )}
    </div>
  );
};

// =====================================================
// نقطة الدخول
// =====================================================
export default function LaundryManagementSystem() {
  const [authView, setAuthView] = useState('login');

  return (
    <AuthProvider>
      <AuthConsumer authView={authView} setAuthView={setAuthView} />
    </AuthProvider>
  );
}

function AuthConsumer({ authView, setAuthView }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  if (!user) {
    return authView === 'login' 
      ? <LoginPage onSwitchToRegister={() => setAuthView('register')} />
      : <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
  }

  return <MainApp />;
}
