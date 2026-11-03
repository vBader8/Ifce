import type { ReviewLogEntry } from './types';

/**
 * Items that must be checked by a qualified human reviewer against the IFCE 4th edition and official Saudi sources
 * before being presented as authoritative. Nothing listed here is used as an exam-pool fact.
 */
export const REVIEW_LOG: ReviewLogEntry[] = [
  {
    id: 'global-1',
    scope: 'عام',
    item: 'مطابقة جميع الدروس المكتملة مع نطاق ومصطلحات الإصدار الرابع (2025–2026) من منهج IFCE.',
    reason: 'لم يكن نص المنهج متاحًا داخل بيئة التطوير؛ بُني المحتوى على مبادئ التأمين العامة وعلى العناوين المحددة في متطلبات المشروع.',
    status: 'open',
  },
  {
    id: 'exam-1',
    scope: 'محاكاة الامتحان',
    item: 'عدد الأسئلة (100) والمدة (ساعتان) والتوزيع على المخرجات التعليمية.',
    reason: 'مأخوذة من متطلبات المشروع. صفحات الأكاديمية المالية تذكر مدة 120 دقيقة لاختبار IFCE، لكن عدد الأسئلة والأوزان لم نتحقق منهما من مصدر رسمي.',
    status: 'partially-verified',
    sources: [{ label: 'الأكاديمية المالية — صفحة الاختبار', url: 'https://www.fa.gov.sa/en/Services/ExamDetails/2a0ac99a-301a-4370-9277-ade30102ab33' }],
  },
  {
    id: 'reg-ia',
    scope: 'الفصل 9 / مختبر التنظيم',
    item: 'إنشاء هيئة التأمين (2023) وانتقال الإشراف إليها من البنك المركزي السعودي، وانتقال مهام التأمين الصحي من مجلس الضمان الصحي (2024)، وارتباط لجان المنازعات.',
    reason: 'مؤكد من مصادر قانونية ثانوية؛ يجب مطابقة التواريخ والصلاحيات مع النصوص الرسمية على موقع الهيئة.',
    status: 'partially-verified',
    sources: [
      { label: 'هيئة التأمين', url: 'https://ia.gov.sa/en' },
      { label: 'Al Tamimi — establishment of the IA', url: 'https://www.tamimi.com/news/the-establishment-of-saudi-arabias-insurance-authority/' },
      { label: 'GCC BDI legal update', url: 'https://gccbdi.org/legal-updates/saudi-insurance-authority-has-now-become-sole-regulator-insurance-sector-ksa' },
    ],
  },
  {
    id: 'reg-law',
    scope: 'الفصل 9',
    item: 'أسماء الأنظمة واللوائح السارية (مثل نظام مراقبة شركات التأمين التعاوني ولائحته) وأي تعديلات أو أنظمة جديدة بعد إنشاء الهيئة.',
    reason: 'لم نتحقق من النص الرسمي الحالي؛ لذلك لم تُكتب دروس الفصل 9 بعد.',
    status: 'open',
  },
  {
    id: 'legal-pc',
    scope: 'الفصل 6 / مختبر السبب المباشر',
    item: 'قواعد السلاسل والأسباب المتزامنة بين الأخطار المؤمَّن منها والمستثناة.',
    reason: 'مستخدمة كقواعد تعليمية عامة كما تُدرَّس في مبادئ التأمين؛ يلزم تأكيد انطباقها وفق النظام السعودي ونصوص الوثائق النموذجية.',
    status: 'open',
  },
  {
    id: 'legal-sub',
    scope: 'الفصل 8 / مختبر الحلول',
    item: 'ترتيب توزيع الاسترداد الجزئي بين المؤمِّن والخسائر غير المؤمَّنة للمؤمَّن له.',
    reason: 'المختبر يستخدم قاعدة مثال مبسطة معلنة (المؤمِّن يسترد حتى ما دفع والفائض للمؤمَّن له)؛ قد يختلف التطبيق الفعلي.',
    status: 'open',
  },
  {
    id: 'legal-contract',
    scope: 'الفصل 3 / مختبر العقد',
    item: 'أركان العقد وأحكام الأهلية والإلغاء وفق نظام المعاملات المدنية السعودي والتعليمات التنظيمية.',
    reason: 'المختبر يعرض مبادئ عامة لتكوين العقود؛ التفاصيل المحلية لم تُراجع.',
    status: 'open',
  },
  {
    id: 'legal-interest-timing',
    scope: 'الفصل 4',
    item: 'توقيت اشتراط المصلحة التأمينية لكل فرع وفق النظام المطبق في المملكة.',
    reason: 'القواعد المشهورة في الأدبيات الدولية قد لا تطابق النظام المحلي.',
    status: 'open',
  },
  {
    id: 'disclosure',
    scope: 'الفصل 5',
    item: 'نطاق واجب الإفصاح وعواقب الإخلال به في الأنظمة السعودية.',
    reason: 'تختلف القواعد بين الأنظمة القانونية؛ لم يُكتب الفصل بعد.',
    status: 'open',
  },
];

/** Individual questions whose keyed answer depends on an open review item. They stay in lesson practice with a visible
 * warning but are excluded from the exam simulation until reviewed. The question text itself is not changed. */
export const QUESTIONS_UNDER_REVIEW: Record<string, string> = {
  'c6-l1-m6': 'قاعدة «خطر مؤمَّن منه يليه خطر مستثنى» قاعدة تعليمية عامة لم تُطابق بعد مع المنهج والنظام السعودي.',
};

/** Review notes attached to lessons whose status remains `complete` but contain specific points awaiting review. */
export const LESSON_REVIEW_NOTES: Record<string, string[]> = {
  'c6-l1': ['قواعد تسلسل الأخطار المؤمَّن منها والمستثناة (الفقرة الأخيرة من الشرح ومختبر السبب المباشر) قواعد تعليمية عامة بانتظار مطابقتها مع المنهج والنظام السعودي.'],
  'c8-l4': ['قاعدة توزيع الاسترداد الجزئي المستخدمة في المختبر قاعدة مثال مبسطة معلنة، وليست حكمًا نظاميًا.'],
};
