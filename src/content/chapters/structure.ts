import type { Chapter } from '../types';

/**
 * Full IFCE (4th edition) chapter and lesson structure using the Arabic headings.
 * `status` here is the authoring status of each lesson. Lessons with status `planned` exist only as structure
 * and learning outcomes – they are never presented as ready lessons.
 */
export const CHAPTERS: Chapter[] = [
  {
    id: 'c1', number: 1, title: 'الخطر والتأمين', titleEn: 'Risk and insurance', accent: '#3b6fb6',
    description: 'مفهوم الخطر وفئاته وسماته، وكيف يعمل التأمين لتحويله وتجميعه، وفوائده للأفراد والاقتصاد.',
    examAreas: ['risk'],
    lessons: [
      { id: 'c1-l1', number: '1.1', title: 'دور الخطر في التأمين', titleEn: 'The role of risk in insurance', status: 'complete', outcomes: ['تعريف الخطر وأبعاده'] },
      { id: 'c1-l2', number: '1.2', title: 'فئات الخطر', titleEn: 'Categories of risk', status: 'complete', outcomes: ['التمييز بين فئات الخطر'] },
      { id: 'c1-l3', number: '1.3', title: 'سمات الأخطار القابلة للتأمين', titleEn: 'Features of insurable risks', status: 'complete', outcomes: ['تحليل قابلية الخطر للتأمين'] },
      { id: 'c1-l4', number: '1.4', title: 'مكونات الخطر', titleEn: 'Components of risk', status: 'complete', outcomes: ['المسبِّب والعوامل المساعدة'] },
      { id: 'c1-l5', number: '1.5', title: 'التأمين كآلية لتحويل الخطر', titleEn: 'Insurance as risk transfer', status: 'complete', outcomes: ['آلية التحويل ودور القسط والتحمّل'] },
      { id: 'c1-l6', number: '1.6', title: 'تجميع الأخطار', titleEn: 'Pooling', status: 'complete', outcomes: ['التجميع وقانون الأعداد الكبيرة'] },
      { id: 'c1-l7', number: '1.7', title: 'التأمين الذاتي', titleEn: 'Self-insurance', status: 'complete', outcomes: ['الاحتفاظ المخطط والشركات الأسيرة'] },
      { id: 'c1-l8', number: '1.8', title: 'المشاركة في التأمين والتأمين المزدوج', titleEn: 'Co-insurance and dual insurance', status: 'complete', outcomes: ['التقاسم بين المؤمِّنين والازدواج'] },
      { id: 'c1-l9', number: '1.9', title: 'فوائد التأمين', titleEn: 'Benefits of insurance', status: 'complete', outcomes: ['فوائد التأمين للفرد والمنشأة والاقتصاد'] },
    ],
  },
  {
    id: 'c2', number: 2, title: 'سوق التأمين', titleEn: 'The insurance market', accent: '#2f8f83',
    description: 'هيكل السوق وأطرافه، أنواع شركات التأمين، إعادة التأمين، الوسطاء وقنوات التوزيع وأثر التقنية.',
    examAreas: ['market'],
    lessons: [
      { id: 'c2-l1', number: '2.1', title: 'هيكل السوق', titleEn: 'Market structure', status: 'planned', outcomes: ['تحديد أطراف سوق التأمين: المشترون والبائعون والوسطاء'] },
      { id: 'c2-l2', number: '2.2', title: 'أنواع شركات التأمين', titleEn: 'Types of insurers', status: 'planned', outcomes: ['التمييز بين أنواع شركات التأمين وأشكالها'] },
      { id: 'c2-l3', number: '2.3', title: 'إعادة التأمين', titleEn: 'Reinsurance', status: 'planned', outcomes: ['شرح أغراض إعادة التأمين وأنواعها النسبية وغير النسبية'] },
      { id: 'c2-l4', number: '2.4', title: 'الوسطاء', titleEn: 'Intermediaries', status: 'planned', outcomes: ['التمييز بين الوسيط والوكيل وأدوارهما'] },
      { id: 'c2-l5', number: '2.5', title: 'قنوات التوزيع', titleEn: 'Distribution channels', status: 'planned', outcomes: ['مقارنة قنوات التوزيع المباشرة وغير المباشرة'] },
      { id: 'c2-l6', number: '2.6', title: 'تأثير الإنترنت والتكنولوجيا', titleEn: 'Impact of the internet and technology', status: 'planned', outcomes: ['تحليل أثر التقنية على التوزيع والخدمة'] },
    ],
  },
  {
    id: 'c3', number: 3, title: 'العقود والوكالة', titleEn: 'Contract and agency', accent: '#7a5bb5',
    description: 'أركان العقد النافذ، الإيجاب والقبول، المقابل، النية والأهلية، إلغاء العقود، الوكالة واتفاقيات TOBAs.',
    examAreas: ['legal'],
    lessons: [
      { id: 'c3-l1', number: '3.1', title: 'أساسيات العقد النافذ', titleEn: 'Essentials of a valid contract', status: 'planned', outcomes: ['تعداد أركان العقد النافذ'] },
      { id: 'c3-l2', number: '3.2', title: 'الإيجاب والقبول', titleEn: 'Offer and acceptance', status: 'planned', outcomes: ['تطبيق الإيجاب والقبول على عقد التأمين'] },
      { id: 'c3-l3', number: '3.3', title: 'المقابل', titleEn: 'Consideration', status: 'planned', outcomes: ['تحديد المقابل في عقد التأمين'] },
      { id: 'c3-l4', number: '3.4', title: 'النية لإقامة علاقات قانونية', titleEn: 'Intention to create legal relations', status: 'planned', outcomes: ['شرح ركن النية'] },
      { id: 'c3-l5', number: '3.5', title: 'أهلية التعاقد', titleEn: 'Capacity to contract', status: 'planned', outcomes: ['تحديد من يملك أهلية التعاقد'] },
      { id: 'c3-l6', number: '3.6', title: 'إلغاء عقود التأمين', titleEn: 'Cancellation of insurance contracts', status: 'planned', outcomes: ['شرح حالات الإلغاء وآثارها'] },
      { id: 'c3-l7', number: '3.7', title: 'الوكالة', titleEn: 'Agency', status: 'planned', outcomes: ['شرح نشوء الوكالة وواجبات الوكيل'] },
      { id: 'c3-l8', number: '3.8', title: 'بنود الاتفاقيات التجارية (TOBAs)', titleEn: 'Terms of business agreements', status: 'planned', outcomes: ['شرح الغرض من اتفاقيات TOBAs'] },
    ],
  },
  {
    id: 'c4', number: 4, title: 'المصلحة التأمينية', titleEn: 'Insurable interest', accent: '#b5733b',
    description: 'تعريف المصلحة التأمينية، وتوقيت توافرها، وتطبيقها في فروع التأمين المختلفة.',
    examAreas: ['legal'],
    lessons: [
      { id: 'c4-l1', number: '4.1', title: 'تعريف المصلحة التأمينية', titleEn: 'Definition of insurable interest', status: 'planned', outcomes: ['تعريف المصلحة التأمينية وعناصرها'] },
      { id: 'c4-l2', number: '4.2', title: 'توقيت توافر المصلحة التأمينية', titleEn: 'When insurable interest must exist', status: 'planned', outcomes: ['تحديد وقت اشتراط المصلحة'] },
      { id: 'c4-l3', number: '4.3', title: 'تطبيق المصلحة التأمينية', titleEn: 'Application of insurable interest', status: 'planned', outcomes: ['تطبيق المصلحة على حالات عملية'] },
    ],
  },
  {
    id: 'c5', number: 5, title: 'تقييم الإفصاح والتصريحات', titleEn: 'Disclosure and representations', accent: '#a64b6b',
    description: 'مبدأ حسن النية، واجب الإفصاح، الحقائق الجوهرية، عواقب عدم الإفصاح والتحريف، والتأمينات الإلزامية.',
    examAreas: ['legal'],
    lessons: [
      { id: 'c5-l1', number: '5.1', title: 'مبدأ حسن النية', titleEn: 'Utmost good faith', status: 'planned', outcomes: ['شرح مبدأ منتهى حسن النية'] },
      { id: 'c5-l2', number: '5.2', title: 'واجب الإفصاح', titleEn: 'Duty of disclosure', status: 'planned', outcomes: ['تحديد نطاق واجب الإفصاح وتوقيته'] },
      { id: 'c5-l3', number: '5.3', title: 'الحقائق الجوهرية', titleEn: 'Material facts', status: 'planned', outcomes: ['تمييز الحقائق الجوهرية'] },
      { id: 'c5-l4', number: '5.4', title: 'عواقب عدم الإفصاح والتحريف', titleEn: 'Consequences of non-disclosure and misrepresentation', status: 'planned', outcomes: ['تحليل عواقب الإخلال'] },
      { id: 'c5-l5', number: '5.5', title: 'التأمينات الإلزامية', titleEn: 'Compulsory insurances', status: 'planned', outcomes: ['تحديد التأمينات الإلزامية وأثرها'] },
    ],
  },
  {
    id: 'c6', number: 6, title: 'السبب المباشر', titleEn: 'Proximate cause', accent: '#c0503a',
    description: 'تعريف السبب المباشر وكيفية تحديده في سلسلة الأحداث، وتعديله بموجب نص الوثيقة.',
    examAreas: ['legal'],
    lessons: [
      { id: 'c6-l1', number: '6.1', title: 'تعريف السبب المباشر', titleEn: 'Definition of proximate cause', status: 'planned', outcomes: ['تحديد السبب المباشر في سلسلة أحداث'] },
      { id: 'c6-l2', number: '6.2', title: 'التعديل بموجب نص الوثيقة', titleEn: 'Modification by policy wording', status: 'planned', outcomes: ['تحليل أثر صياغة الوثيقة على السبب المباشر'] },
    ],
  },
  {
    id: 'c7', number: 7, title: 'التعويض', titleEn: 'Indemnity', accent: '#2a7ab0',
    description: 'مفهوم التعويض وتطبيقه وطرق تحديده وتعديلاته والعوامل المقيدة له مثل مبلغ التأمين وشرط النسبية والتحمّل.',
    examAreas: ['legal'],
    lessons: [
      { id: 'c7-l1', number: '7.1', title: 'مفهوم التعويض', titleEn: 'The concept of indemnity', status: 'planned', outcomes: ['تعريف مبدأ التعويض'] },
      { id: 'c7-l2', number: '7.2', title: 'كيفية تطبيق مبدأ التعويض', titleEn: 'How indemnity is provided', status: 'planned', outcomes: ['طرق التعويض: نقدًا، إصلاح، استبدال، إعادة'] },
      { id: 'c7-l3', number: '7.3', title: 'تحديد التعويض', titleEn: 'Measuring indemnity', status: 'planned', outcomes: ['قياس التعويض في الفروع المختلفة'] },
      { id: 'c7-l4', number: '7.4', title: 'تعديلات مبدأ التعويض', titleEn: 'Modifications of indemnity', status: 'planned', outcomes: ['القيمة المتفق عليها، الجديد مقابل القديم، إعادة الحال'] },
      { id: 'c7-l5', number: '7.5', title: 'العوامل المقيدة', titleEn: 'Limiting factors', status: 'planned', outcomes: ['مبلغ التأمين، شرط النسبية، التحمّل، الحدود'] },
    ],
  },
  {
    id: 'c8', number: 8, title: 'المشاركة والحلول', titleEn: 'Contribution and subrogation', accent: '#4a8a3c',
    description: 'المشاركة بين المؤمِّنين في التعويض وطرق حسابها، والحلول: انتقال حقوق المؤمَّن له إلى المؤمِّن وحدوده.',
    examAreas: ['legal'],
    lessons: [
      { id: 'c8-l1', number: '8.1', title: 'المشاركة', titleEn: 'Contribution', status: 'planned', outcomes: ['تعريف مبدأ المشاركة'] },
      { id: 'c8-l2', number: '8.2', title: 'كيف تنشأ المشاركة', titleEn: 'How contribution arises', status: 'planned', outcomes: ['شروط نشوء المشاركة'] },
      { id: 'c8-l3', number: '8.3', title: 'كيفية تطبيق المشاركة', titleEn: 'Applying contribution', status: 'planned', outcomes: ['حساب الحصص بطريقتي مبلغ التأمين والمسؤولية المستقلة'] },
      { id: 'c8-l4', number: '8.4', title: 'الحلول', titleEn: 'Subrogation', status: 'planned', outcomes: ['تعريف مبدأ الحلول'] },
      { id: 'c8-l5', number: '8.5', title: 'حقوق الحلول لشركات التأمين', titleEn: "Insurers' subrogation rights", status: 'planned', outcomes: ['مصادر حقوق الحلول وتوقيتها'] },
      { id: 'c8-l6', number: '8.6', title: 'المواضع التي لا تنطبق فيها حقوق الحلول', titleEn: 'Where subrogation does not apply', status: 'planned', outcomes: ['حالات عدم انطباق الحلول'] },
    ],
  },
  {
    id: 'c9', number: 9, title: 'تنظيم قطاع التأمين', titleEn: 'Regulation of the insurance industry', accent: '#5b6b8a',
    description: 'دور الجهة الرقابية، تشريعات التأمين في المملكة، الامتثال الشرعي، IAIS، كفاية رأس المال، مكافحة الجرائم المالية والاحتيال.',
    examAreas: ['regulation'],
    lessons: [
      { id: 'c9-l1', number: '9.1', title: 'دور الجهة الرقابية في قطاع التأمين', titleEn: 'Role of the regulator', status: 'planned', outcomes: ['أهداف الرقابة وأدواتها'] },
      { id: 'c9-l2', number: '9.2', title: 'تشريعات التأمين في المملكة العربية السعودية', titleEn: 'Insurance legislation in KSA', status: 'planned', outcomes: ['الإطار النظامي للتأمين في المملكة'] },
      { id: 'c9-l3', number: '9.3', title: 'الامتثال لأحكام الشريعة', titleEn: 'Sharia compliance', status: 'planned', outcomes: ['متطلبات الامتثال الشرعي'] },
      { id: 'c9-l4', number: '9.4', title: 'الجمعية الدولية لمشرفي التأمين IAIS', titleEn: 'IAIS', status: 'planned', outcomes: ['دور IAIS والمبادئ الأساسية للتأمين'] },
      { id: 'c9-l5', number: '9.5', title: 'كفاية رأس مال شركات التأمين', titleEn: 'Capital adequacy', status: 'planned', outcomes: ['مفهوم الملاءة وكفاية رأس المال'] },
      { id: 'c9-l6', number: '9.6', title: 'مكافحة الجرائم المالية', titleEn: 'Combating financial crime', status: 'planned', outcomes: ['غسل الأموال وتمويل الإرهاب في التأمين'] },
      { id: 'c9-l7', number: '9.7', title: 'أثر الاحتيال على قطاع التأمين', titleEn: 'Impact of fraud', status: 'planned', outcomes: ['أنواع الاحتيال وآثاره'] },
    ],
  },
  {
    id: 'c10', number: 10, title: 'السلوك الأخلاقي وحوكمة الشركات والرقابة الداخلية', titleEn: 'Ethics, governance and internal control', accent: '#8a6d2f',
    description: 'المعاملة العادلة للعملاء، حوكمة الشركات، نظام الرقابة الداخلية، وحماية البيانات.',
    examAreas: ['ethics'],
    lessons: [
      { id: 'c10-l1', number: '10.1', title: 'المعاملة العادلة للعملاء', titleEn: 'Treating customers fairly', status: 'planned', outcomes: ['مبادئ المعاملة العادلة'] },
      { id: 'c10-l2', number: '10.2', title: 'حوكمة الشركات', titleEn: 'Corporate governance', status: 'planned', outcomes: ['عناصر الحوكمة'] },
      { id: 'c10-l3', number: '10.3', title: 'نظام الرقابة الداخلية', titleEn: 'Internal control system', status: 'planned', outcomes: ['خطوط الدفاع والرقابة الداخلية'] },
      { id: 'c10-l4', number: '10.4', title: 'حماية البيانات', titleEn: 'Data protection', status: 'planned', outcomes: ['مبادئ حماية البيانات الشخصية'] },
    ],
  },
  {
    id: 'c11', number: 11, title: 'عملية التأمين في المملكة العربية السعودية', titleEn: 'The insurance process in KSA', accent: '#3a7d8c',
    description: 'المناصب العليا المهمة، العمليات التشغيلية الرئيسية، فروع التأمين، ومبادئ خدمة العملاء الفعالة.',
    examAreas: ['process', 'products'],
    lessons: [
      { id: 'c11-l1', number: '11.1', title: 'المناصب العليا المهمة في شركات التأمين', titleEn: 'Key senior positions', status: 'planned', outcomes: ['أدوار المناصب العليا'] },
      { id: 'c11-l2', number: '11.2', title: 'العمليات التشغيلية الرئيسية للتأمين', titleEn: 'Key insurance operations', status: 'planned', outcomes: ['الاكتتاب والمطالبات والتسعير'] },
      { id: 'c11-l3', number: '11.3', title: 'فروع التأمين', titleEn: 'Classes of insurance', status: 'planned', outcomes: ['فروع التأمين العام والحماية والادخار'] },
      { id: 'c11-l4', number: '11.4', title: 'المبادئ الأساسية لخدمة العملاء الفعالة', titleEn: 'Effective customer service', status: 'planned', outcomes: ['مبادئ الخدمة الفعالة'] },
    ],
  },
];
