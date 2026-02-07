# دستورالعمل‌های Copilot برای managementProject-main

## نمای کلی
- اپلیکیشن فول‌استک: بک‌اند Express/MongoDB + فرانت‌اند Vue 3/Tailwind.
- مسیرهای بک‌اند در [../server/routes](../server/routes) به کنترلرهای [../server/controllers](../server/controllers) وصل می‌شوند و احراز هویت با [../server/middleware/auth.js](../server/middleware/auth.js) اعمال می‌گردد.
- فرانت‌اند از Vue Router با نگهبان‌های نقش‌محور در [../client/src/router.js](../client/src/router.js) و نمونه Axios در [../client/src/api.js](../client/src/api.js) استفاده می‌کند.
- محتوای JWT شامل `id`، `role`، `major` است؛ بک‌اند از `req.user` برای تصمیم‌های نقش/ظرفیت استفاده می‌کند.

## گردش کار توسعه
- بک‌اند: در پوشه [../server](../server)، پس از ساخت فایل `.env` با متغیرهای `MONGODB_URI`، `JWT_SECRET`، `PORT`، دستور `npm run dev` (nodemon) را اجرا کنید.
- فرانت‌اند: در پوشه [../client](../client)، دستور `npm run dev` (Vite) را اجرا کنید؛ آدرس پیش‌فرض http://localhost:3000.
- بررسی سلامت: درخواست GET به `/api/health` از بک‌اند برای اطمینان از اجرا.
- داده‌های اولیه: اسکریپت [../server/seed.js](../server/seed.js) را برای ساخت کاربران تست و ظرفیت اجرا کنید.

## محیط و پورت‌ها
- پورت پیش‌فرض API در [../server/server.js](../server/server.js) برابر `PORT=5000` است؛ پروکسی Vite در [../client/vite.config.js](../client/vite.config.js) روی `http://localhost:5001` تنظیم شده.
- این‌ها را هم‌راستا کنید: یا پورت بک‌اند را `5001` بگذارید یا پروکسی را مطابق `PORT` اصلاح کنید.
- متغیرهای لازم محیط: `MONGODB_URI`، `JWT_SECRET`، و `PORT` (اختیاری).

## قراردادهای بک‌اند
- ماژول‌های مسیر زیر `/api/<domain>` در [../server/server.js](../server/server.js) نصب می‌شوند: `auth`، `projects`، `messages`، `defense`، `manager`.
- همیشه مسیرهای نیازمند نقش را با `authMiddleware` و `roleMiddleware('<role>')` محافظت کنید.
- کنترلرها در خطاها JSON با فیلد `error` برمی‌گردانند؛ از پرتاب مستقیم خودداری کنید—خطا را گرفته و `res.status(...).json({ error })` بدهید.
- جریان‌های رایج:
  - `projects/enroll`: ظرفیت را با `term` و `req.user.major` چک می‌کند و سپس `Project` می‌سازد.
  - `projects/assign`: مدیر گروه باید مطمئن شود راهنما و داور متفاوت‌اند.
  - `projects/approve-topic`: راهنما `topic` را ثبت و `status` را به‌روزرسانی می‌کند.
  - `defense/slots` و `defense/schedule`: داور زمان‌های پیشنهادی می‌دهد، مدیر زمان دفاع را برنامه‌ریزی می‌کند.
- مدل‌ها: به [../server/models](../server/models) رجوع کنید — مثلاً وضعیت‌های `Project` به‌ترتیب (`pending → topic_submitted → topic_approved → scheduled → defended → graded`).

## الگوهای فرانت‌اند
- نگهبان‌های Router از `localStorage.token` و `localStorage.user` برای اعمال `meta.role` روی مسیرها استفاده می‌کنند ([../client/src/router.js](../client/src/router.js)).
- نمونه Axios هدر `Authorization: Bearer <token>` را از localStorage تنظیم می‌کند ([../client/src/api.js](../client/src/api.js)).
- ناوبری نقش‌محور و خروج در [../client/src/App.vue](../client/src/App.vue) پیاده‌سازی شده است.

## نمونه‌های کاربرد
- ورود فرانت‌اند: POST به `/auth/login` با `{ role, nationalId, identityNumber }`؛ سپس ذخیره `token` و `user` و هدایت بر اساس نقش.
- ثبت‌نام پروژه دانشجو (فرانت‌اند): `await api.post('/projects/enroll', { term: '1404-1' })`.
- نمونه مسیر محافظت‌شده (بک‌اند):
  ```js
  router.post('/grade', authMiddleware, roleMiddleware('teacher'), submitGrade);
  ```

## افزودن اندپوینت‌های جدید API
- کنترلر را در [../server/controllers](../server/controllers) بسازید و توابع را به‌صورت named export ارائه دهید.
- مسیر را در فایل مربوطه [../server/routes](../server/routes) اضافه کنید؛ اگر دامنه جدید است، در [../server/server.js](../server/server.js) نصب کنید.
- احراز هویت/نقش را اعمال کنید، برای هویت از `req.user.id` استفاده کنید و به payload JWT (شامل `major`) احترام بگذارید.
- JSON همسان بازگردانید؛ در صورت ارتباط با `Project`، تغییرات `status` را لحاظ کنید.

## حساب‌های اولیه و تست
- [../server/seed.js](../server/seed.js) را اجرا کنید تا ادمین، دانشجو، دو استاد، مدیر گروه و یک رکورد `Capacity` ساخته شود.
- اعتبارهای پیش‌فرض در [../README.md](../README.md) و [../SETUP.md](../SETUP.md) مستند شده‌اند.

## رفع اشکال
- خطاهای Mongo: مطمئن شوید `mongod` اجراست و مقدار `MONGODB_URI` صحیح است.
- پورت‌ها: ناهماهنگی بین پروکسی Vite و پورت Express را برطرف کنید.
- CORS: با `cors()` در [../server/server.js](../server/server.js) مدیریت می‌شود؛ فرانت‌اند از طریق پروکسی به `/api` فراخوانی می‌کند.

---
اگر بخشی از قراردادها مبهم یا ناقص است (مثلاً نحوه استفاده از اسکریپت زمان‌بندی مجدد دفاع یا جریان پیام‌ها)، مشخص کنید کدام قسمت‌ها را باید دقیق‌تر کنم تا این راهنما را تکمیل کنم.