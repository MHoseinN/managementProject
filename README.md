# سیستم مدیریت پروژه دانشگاهی

سیستمی برای مدیریت پروژه‌های دانشگاهی شامل:
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: Vue.js + Tailwind CSS
- **Features**: Auth، تخصیص معلم، زمان‌بندی دفاع، messaging

## نصب و اجرا

### Backend
```bash
cd server
npm install
# تنظیم .env (اتصال دائمی به MongoDB داکر)
echo "MONGODB_URI=mongodb://root:example@localhost:27017/project-management?authSource=admin" > .env
echo "JWT_SECRET=your-secret-key" >> .env
echo "PORT=5000" >> .env

# Seed database
node seed.js

# Start server
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

سایت در `http://localhost:3000` باز می‌شود.

## اطلاعات لاگین

| نقش | کد ملی | شناسه |
|------|---------|---------|
| ادمین | admin01 | admin0123 |
| دانشجو | 0372199984 | 99101241 |
| استاد 1 | 0371234567 | 123456789 |
| استاد 2 | 0371234568 | 123456788 |
| مدیر گروه | 0377654321 | 987654321 |

## فلوی سیستم

1. **ثبت نام و تایید**: کاربران ثبت نام می‌کنند و ادمین تایید می‌کند
2. **اخذ پروژه**: دانشجو پروژه را اخذ می‌کند
3. **تخصیص معلم**: سیستم استاد راهنما و داور را تخصیص می‌دهد
4. **انتخاب موضوع**: دانشجو موضوع پیشنهاد کرده و استاد راهنما تایید می‌کند
5. **زمان‌بندی دفاع**: استاد داور زمان‌های خالی ارائه و سیستم برنامه می‌ریزد
6. **دفاع و نمره‌دهی**: دفاع انجام شده و نمره ثبت می‌شود

## API Endpoints

### Auth
- `POST /api/auth/register` - ثبت نام
- `POST /api/auth/login` - ورود
- `GET /api/auth/pending` - درخواست‌های معلق (ادمین)
- `POST /api/auth/approve` - تایید (ادمین)

### Projects
- `POST /api/projects/enroll` - اخذ پروژه
- `POST /api/projects/assign` - تخصیص معلم
- `POST /api/projects/topics` - ارسال موضوعات
- `POST /api/projects/approve-topic` - تایید موضوع

### Messages
- `POST /api/messages/send` - ارسال پیام
- `GET /api/messages` - دریافت پیام‌ها

## اتصال دائمی دیتابیس (Docker)

برای اجرای MongoDB با ذخیره‌سازی پایدار:

```bash
# از ریشه پروژه
docker compose up -d  # یا: docker-compose up -d

# تست اتصال
docker ps | grep mongo
```

پس از بالا آمدن دیتابیس، سرور Backend را اجرا و اسکریپت seed را برای داده‌های نمونه بزنید:

```bash
cd server
node seed.js
npm run dev
```
