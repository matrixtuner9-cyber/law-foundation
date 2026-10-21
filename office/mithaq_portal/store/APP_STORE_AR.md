# نشر تطبيق «ميثاق» للموكلين على App Store (توزيع غير مُدرج)

تطبيق واحد لكل مكاتب ميثاق. يختار الموكل مكتبه بإحدى ثلاث طرق:
1. **رابط الدعوة** من واتساب (`https://<مكتب>.palgaz.net/p/MQ-…`)، فيُفتح التطبيق ويدخل مباشرة.
2. **رمز QR** يُمسح بكاميرا الآيفون (زر «▦ رمز QR للتطبيق» في حقيبة الموكل).
3. **رمز المكتب** (مثل `demo`) ثم رمز الدخول.

---

## أولاً: في حساب Apple Developer (مرة واحدة)
1. **Certificates, Identifiers & Profiles ← Identifiers ← `ps.mithaq.mithaqPortal`**، وفعّل القدرتين:
   - **Push Notifications**
   - **Associated Domains** (لفتح روابط الدعوة داخل التطبيق)
2. **Keys ← +**: أنشئ مفتاح **Apple Push Notifications service (APNs)** ونزّل ملف `.p8`. لا يُرسل في أي محادثة، بل يُدخَل في **الإعدادات ← إشعارات الآيفون** داخل ميثاق لكل مكتب، مع Key ID و Team ID.
3. **Users and Access ← Integrations ← App Store Connect API**: أنشئ مفتاح API بدور **App Manager**. يُدخَل في Codemagic ضمن مجموعة المتغيرات `mithaq_ios`:
   - `APP_STORE_CONNECT_ISSUER_ID`
   - `APP_STORE_CONNECT_KEY_IDENTIFIER`
   - `APP_STORE_CONNECT_PRIVATE_KEY`
   - `CERTIFICATE_PRIVATE_KEY`

## ثانياً: في App Store Connect
1. **Apps ← + ← New App**، بالقيم التالية:
   - المنصة: iOS
   - الاسم: **ميثاق — بوابة الموكل**
   - اللغة الأساسية: العربية
   - Bundle ID: `ps.mithaq.mithaqPortal`
   - SKU: `mithaq-client`
2. **App Information**:
   - التصنيف: **Business**، والتصنيف الثانوي: **Productivity**
   - Privacy Policy URL: `https://demo.palgaz.net/privacy`
3. **Pricing and Availability**: مجاني، وكل الدول (أو فلسطين والأردن فقط).

## ثالثاً: البناء والرفع (Codemagic، دون Mac)
1. اربط المستودع `matrixtuner9-cyber/law-foundation` في Codemagic، وأنشئ مجموعة المتغيرات `mithaq_ios`.
2. شغّل البناء **mithaq-client-ios** على الفرع `legislation-online`، فيُرفع إلى TestFlight تلقائياً.
3. جرّبه على آيفونك من تطبيق TestFlight قبل الإرسال للمراجعة.

## رابعاً: بيانات صفحة التطبيق

**الاسم:** ميثاق — بوابة الموكل
**العنوان الفرعي (30 حرفاً):** قضاياك ومحاميك في مكان واحد

**الوصف:**
> «ميثاق» بوابة خاصة يقدّمها مكتب المحاماة لموكليه، لمتابعة القضايا والتواصل الآمن مع المحامي.
>
> • حالة كل قضية ومرحلتها ورقمها ومحكمتها.
> • مواعيد الجلسات القادمة مع تذكير قبلها.
> • المستندات التي يشاركها المكتب معك.
> • مراسلة المحامي نصاً وصوتاً، وإرسال صور الوثائق والملفات.
> • إشعار فوري برسائل المكتب ومواعيدك.
> • قفل التطبيق بـ Face ID أو البصمة.
>
> التطبيق للموكلين المسجّلين لدى مكاتب تعمل بنظام ميثاق. يصلك رابط الدعوة ورمز الدخول من مكتبك.

**الكلمات المفتاحية:** محامي,محاماة,قضية,موكل,محكمة,جلسات,مكتب محاماة,قانون,ميثاق,فلسطين

**رابط الدعم:** `https://demo.palgaz.net/support`

**English (optional localization):**
> Mithaq is a private client portal provided by law offices to their own clients: case status, hearing dates and reminders, shared documents, and secure text/voice messaging with your lawyer. Access requires an invitation link and login code from your law office.

**الفئة العمرية:** 4+ (لا محتوى حساس). **حقوق النشر:** © 2026 Mithaq.

## خامساً: ملاحظات المراجعة (App Review Information)
- **Sign-in required:** نعم.
- **User name:** `demo`، وهو رمز المكتب.
- **Password:** `MQ-QW7HX3DBXT`، وهو رمز موكل تجريبي على مكتب demo ببيانات وهمية.
- **Notes (بالإنجليزية):**
> This is a private client portal for law offices using the Mithaq practice-management system, intended for unlisted distribution (we will submit the unlisted app request).
> To sign in: on the first screen type the office code **demo**, tap "متابعة" (Continue), then enter the client code **MQ-QW7HX3DBXT** and tap "دخول" (Sign in). All data in this demo office is fictional.
> Accounts are created by the law office (not in the app), so the app has no sign-up. Users can request data deletion by messaging their office from inside the app (also described at https://demo.palgaz.net/privacy).
> Microphone: recording voice messages to the lawyer. Camera/Photos: sending document photos. Face ID: optional app lock. Notifications: messages and hearing reminders.

## سادساً: خصوصية التطبيق (App Privacy)
- **هل تجمع بيانات؟** نعم، والإجابة لكل نوع: مرتبطة بهوية المستخدم، لا تُستخدم للتتبّع، والغرض «App Functionality».
  - **Contact Info:** الاسم، رقم الهاتف.
  - **User Content:** الرسائل، التسجيلات الصوتية، الصور، المستندات.
  - **Identifiers:** معرّف المستخدم (رمز الدخول).
  - **Other Data:** رمز إشعارات الجهاز.
- **Tracking:** لا.

## سابعاً: طلب التوزيع غير المُدرج
بعد الإرسال للمراجعة، اكتب في Review Notes الجملة الأولى أعلاه، ثم املأ نموذج Apple:
https://developer.apple.com/contact/request/unlisted-app/

النص المقترح للنموذج:
> Mithaq is a client portal used only by the clients of law offices running the Mithaq system. Each client receives a private invitation link and login code from their office. The app is not intended for the general public, so we request unlisted distribution.

بعد الموافقة يصلك رابط ثابت للتطبيق. أرسله لي ليُضاف إلى رسالة دعوة واتساب ولبطاقة رمز QR.

## ملاحظات تقنية
- الصفحات العامة متاحة لكل مكتب: `/privacy` و `/support` و `/.well-known/apple-app-site-association`.
- ملف الربط يأخذ معرّف التطبيق من إعداد إشعارات الآيفون في المكتب (`TeamID.BundleID`)، أو من المتغير `APPLE_APP_ID` في السحابة.
- لمكتب على خادم خاص بنطاق غير palgaz.net: يكتب الموكل عنوان المكتب كاملاً. أما فتح الروابط داخل التطبيق فيحتاج إضافة النطاق إلى `Runner.entitlements`.
