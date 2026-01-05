# laundry-system

## تشغيل الواجهة على GitHub Pages

هذا الريبو يحتوي Workflow جاهز للنشر على GitHub Pages.

1) افتح الريبو في GitHub → **Settings** → **Pages**
2) في **Build and deployment** اختر **Source: GitHub Actions**
3) ادخل تبويب **Actions** وشغّل Workflow باسم **Deploy to GitHub Pages** (أو انتظر بعد أي Push على `main`)

رابط الواجهة بعد النشر سيكون عادة:

`https://engosamarhbi-design.github.io/laundry-system/`

## ملاحظة مهمة (الـBackend)

GitHub Pages يستضيف ملفات ثابتة فقط (Frontend). الـBackend لازم يكون مستضاف في مكان آخر.

### الخيار المناسب (Render) — نشر الـAPI من GitHub

1) افتح https://render.com وسجّل دخول
2) New → **Web Service** → اختر هذا الريبو من GitHub
3) Render سيقرأ ملف `render.yaml` تلقائيًا
4) بعد النشر خذ رابط الخدمة (مثال):

`https://laundry-system-api.onrender.com`

والـAPI سيكون:

`https://laundry-system-api.onrender.com/api`

إذا استضفت الـBackend على أي منصة (Render / Railway / VPS…)، ضع رابط الـAPI في متغير Actions التالي:

- GitHub → Settings → Secrets and variables → Actions → **Variables**
- أضف Variable باسم: `VITE_API_BASE_URL`
- القيمة مثال: `https://laundry-system-api.onrender.com/api`

بعدها اعمل Push أو أعد تشغيل الـWorkflow ليُبنى Frontend على الرابط الجديد.