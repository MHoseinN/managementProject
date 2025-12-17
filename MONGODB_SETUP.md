# MongoDB Setup Guide

## گزینه 1: MongoDB Atlas (Cloud - رایگان و سهل)

### مراحل:
1. برو به https://www.mongodb.com/cloud/atlas
2. "Try Free" کلیک کن
3. ثبت نام یا Login
4. Create a new project
5. Build a database → Select "M0 Free" (رایگان)
6. انتخاب region (مثل: Frankfurt)
7. Create cluster (منتظر 2-3 دقیقه بمان)

### Connection String:
1. در صفحه Cluster، "Connect" کلیک کن
2. Drivers انتخاب کن → Node.js
3. Connection string را کپی کن
4. Password و Database name جایگزین کن

مثال:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/project-management?retryWrites=true&w=majority
```

---

## گزینه 2: Docker MongoDB (محلی - سهل)

```bash
# Docker داشتن ضروری است
docker run -d -p 27017:27017 --name mongodb mongo

# برای توقف:
docker stop mongodb

# برای دوباره شروع:
docker start mongodb
```

---

## گزینه 3: mongod محلی (Ubuntu)

```bash
# نصب
sudo apt-get update
sudo apt-get install -y mongodb

# شروع service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# بررسی وضعیت
sudo systemctl status mongodb
```

---

## تنظیم Connection String

### بعد از تعیین روش MongoDB:

1. .env file را update کن:
```bash
cd server
# فایل رو ویرایش کن:
nano .env
```

2. MONGODB_URI را تغییر بده:
```
# برای Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/project-management?retryWrites=true&w=majority

# یا برای محلی:
MONGODB_URI=mongodb://localhost:27017/project-management
```

3. Backend restart کن:
```bash
npm run dev
```

---

## Test Connection

```bash
# Backend logs بررسی کن - باید ببینی:
# ✓ MongoDB connected successfully
```

