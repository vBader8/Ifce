import { useState } from 'react';
import { LabShell, type LabMeta, type LabProps } from './LabShell';
import { Segmented } from '../components/ui';

/* ============================================================ Proximate cause */
export const proximateMeta: LabMeta = {
  id: 'proximate-cause',
  title: 'مختبر السبب المباشر: خط زمني للحادث',
  chapterId: 'c6',
  objective: 'أن تحدد السبب المباشر (المؤثر الفعّال المسيطر) في سلسلة أحداث، وتحكم على التغطية وفق الأخطار المؤمَّن منها والمستثناة.',
  variables: [
    { name: 'السبب المباشر', desc: 'السبب الفعّال المسيطر الذي يحرّك سلسلة الأحداث دون تدخل سبب جديد مستقل؛ ليس بالضرورة الأقرب زمنًا.' },
    { name: 'سلسلة غير منقطعة', desc: 'كل حدث نتيجة طبيعية للحدث السابق.' },
    { name: 'سبب جديد مستقل', desc: 'حدث يقطع السلسلة ويبدأ سلسلة جديدة.' },
  ],
  rules: [
    'قواعد تعليمية عامة كما تُدرَّس في مبادئ التأمين؛ نص الوثيقة قد يعدّلها (الدرس 6.2).',
    'إذا سبق خطر مستثنى خطرًا مؤمَّنًا في سلسلة غير منقطعة، لا تغطية للخسارة الناتجة عادةً.',
    'إذا سبق خطر مؤمَّن خطرًا مستثنى، تُغطى الخسارة الناتجة عن الخطر المؤمَّن عادةً.',
  ],
  predict: {
    question: 'حريق في متجر، ثم أتلفت مياه رجال الإطفاء البضائع. ما السبب المباشر لتلف البضائع بالمياه؟',
    options: ['المياه', 'الحريق', 'رجال الإطفاء'],
    answer: 1,
    reveal: 'استخدام المياه نتيجة طبيعية لمكافحة الحريق؛ السلسلة غير منقطعة والسبب المسيطر هو الحريق.',
  },
  mistake: {
    mistake: 'اختيار آخر حدث وقع زمنيًا قبل الخسارة على أنه السبب المباشر.',
    correction: 'المعيار هو السبب الفعّال المسيطر، وقد يكون حدثًا أسبق زمنيًا.',
  },
};

interface PcCase {
  id: string;
  title: string;
  insured: string[];
  excluded: string[];
  events: string[];
  /** index of proximate cause event */
  cause: number;
  covered: boolean;
  why: string;
}

export const PC_CASES: PcCase[] = [
  {
    id: 'fire-water',
    title: 'حريق ومياه الإطفاء',
    insured: ['الحريق'],
    excluded: [],
    events: ['ماس كهربائي في مستودع مجاور', 'امتد الحريق إلى متجر المؤمَّن له', 'رش رجال الإطفاء المياه بكثافة', 'تلفت البضائع بالمياه'],
    cause: 1,
    covered: true,
    why: 'المياه نتيجة طبيعية لمكافحة الحريق، فالسلسلة غير منقطعة والسبب المسيطر هو الحريق المؤمَّن منه.',
  },
  {
    id: 'quake-fire',
    title: 'زلزال ثم حريق',
    insured: ['الحريق'],
    excluded: ['الزلزال وما ينتج عنه'],
    events: ['وقع زلزال', 'سقط سخان غاز وانكسر أنبوبه', 'اشتعل حريق في المبنى', 'احترقت المحتويات'],
    cause: 0,
    covered: false,
    why: 'الزلزال (مستثنى) سبق الحريق في سلسلة غير منقطعة وهو السبب المسيطر، فلا تُغطى الخسارة عادةً، خصوصًا مع نص الاستثناء.',
  },
  {
    id: 'lightning-wall',
    title: 'صاعقة ثم انهيار متأخر',
    insured: ['الصاعقة'],
    excluded: [],
    events: ['ضربت صاعقة جدار مستودع', 'تصدّع الجدار جزئيًا', 'بعد يومين انهار الجدار المتصدع دون سبب جديد', 'تلفت البضائع تحت الركام'],
    cause: 0,
    covered: true,
    why: 'الانهيار المتأخر نتيجة طبيعية للتصدع الذي أحدثته الصاعقة؛ السبب المباشر ليس الأقرب زمنًا بل الأكثر تأثيرًا.',
  },
  {
    id: 'storm-new-cause',
    title: 'عاصفة ثم سبب جديد مستقل',
    insured: ['العاصفة'],
    excluded: [],
    events: ['أتلفت عاصفة جزءًا من السقف وتم إصلاحه بالكامل', 'بعد أربعة أشهر انفجر أنبوب ماء داخلي بسبب عيب تصنيع', 'تسربت المياه إلى المكاتب', 'تلفت الأجهزة'],
    cause: 1,
    covered: false,
    why: 'إصلاح السقف أنهى أثر العاصفة؛ انفجار الأنبوب سبب جديد مستقل. إن لم يكن خطر انفجار الأنابيب مؤمَّنًا منه فلا تغطية.',
  },
];

export function ProximateCauseLab({ onComplete }: LabProps) {
  const [ci, setCi] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [cov, setCov] = useState<'yes' | 'no' | null>(null);
  const [shown, setShown] = useState(false);
  const c = PC_CASES[ci];
  const reset = () => {
    setPick(null);
    setCov(null);
    setShown(false);
  };
  return (
    <LabShell
      meta={proximateMeta}
      onComplete={onComplete}
      onReset={() => {
        setCi(0);
        reset();
      }}
      controls={
        <>
          <div className="preset-row" role="tablist" aria-label="الحالات" data-nodrag>
            {PC_CASES.map((x, i) => (
              <button key={x.id} type="button" role="tab" aria-selected={ci === i} className={`chip ${ci === i ? 'on' : ''}`} onClick={() => { setCi(i); reset(); }}>
                {i + 1}. {x.title}
              </button>
            ))}
          </div>
          <p className="small">
            <strong>مؤمَّن منه:</strong> {c.insured.join('، ')}
            {c.excluded.length > 0 && (
              <>
                {' '}— <strong>مستثنى:</strong> {c.excluded.join('، ')}
              </>
            )}
          </p>
          <ol className="pc-timeline" aria-label="خط زمني للأحداث" data-nodrag>
            {c.events.map((e, i) => (
              <li key={i}>
                <button
                  type="button"
                  aria-pressed={pick === i}
                  disabled={shown}
                  className={`pc-event ${pick === i ? 'on' : ''} ${shown && i === c.cause ? 'right' : ''} ${shown && pick === i && i !== c.cause ? 'wrong' : ''}`}
                  onClick={() => setPick(i)}
                >
                  <span className="pc-dot" aria-hidden>{i + 1}</span>
                  {e}
                </button>
              </li>
            ))}
          </ol>
          <Segmented label="هل الخسارة مغطاة؟" value={cov ?? ('' as 'yes')} onChange={(x) => !shown && setCov(x)} options={[{ value: 'yes', label: 'مغطاة' }, { value: 'no', label: 'غير مغطاة' }]} />
          <button type="button" className="btn" disabled={pick === null || cov === null || shown} onClick={() => { setShown(true); onComplete?.(); }} data-nodrag>
            تحقق من التحليل
          </button>
        </>
      }
      results={
        shown ? (
          <div className={`verdict-card ${pick === c.cause && (cov === 'yes') === c.covered ? 'good' : 'bad'}`}>
            <p>
              السبب المباشر: <strong>{c.events[c.cause]}</strong> {pick === c.cause ? '✓' : '✗'}
            </p>
            <p>
              الحكم: <strong>{c.covered ? 'مغطاة' : 'غير مغطاة'}</strong> {(cov === 'yes') === c.covered ? '✓' : '✗'}
            </p>
          </div>
        ) : (
          <p>اختر من الخط الزمني الحدث الذي تراه السبب المباشر، ثم احكم على التغطية.</p>
        )
      }
      interpretation={<p>{shown ? c.why : 'تتبع السلسلة: هل كل حدث نتيجة طبيعية لما قبله؟ هل تدخّل سبب جديد مستقل؟'}</p>}
    />
  );
}

/* ============================================================ Contract formation */
export const contractMeta: LabMeta = {
  id: 'contract',
  title: 'مختبر العقد التأميني: مراحل التكوين',
  chapterId: 'c3',
  objective: 'أن تفحص توافر أركان العقد النافذ في حالات افتراضية، وتميّز الإيجاب المقابل عن القبول.',
  variables: [
    { name: 'الإيجاب', desc: 'عرض محدد من طرف (غالبًا طلب التأمين المقدم من العميل).' },
    { name: 'القبول', desc: 'موافقة غير مشروطة على الإيجاب بشروطه نفسها.' },
    { name: 'الإيجاب المقابل', desc: 'رد يغير الشروط؛ لا يُعد قبولًا بل إيجابًا جديدًا.' },
    { name: 'المقابل', desc: 'ما يقدمه كل طرف: القسط أو الوعد به مقابل وعد المؤمِّن.' },
    { name: 'النية والأهلية', desc: 'قصد إنشاء التزام قانوني، وأهلية الأطراف للتعاقد.' },
  ],
  rules: [
    'مبادئ عامة لتكوين العقود كما تُدرَّس في أساسيات التأمين.',
    'التطبيق التفصيلي وفق الأنظمة السعودية (مثل نظام المعاملات المدنية) مسجّل للمراجعة البشرية.',
  ],
  predict: {
    question: 'قدّم العميل طلبًا، فردّت الشركة بالموافقة بشرط رفع التحمّل. هل انعقد العقد؟',
    options: ['نعم', 'لا، هذا إيجاب مقابل ينتظر قبول العميل'],
    answer: 1,
    reveal: 'تغيير الشروط يجعل رد الشركة إيجابًا جديدًا؛ ينعقد العقد إذا قبله العميل.',
  },
  mistake: {
    mistake: 'اعتبار أي رد من الشركة على الطلب قبولًا.',
    correction: 'القبول يجب أن يطابق الإيجاب؛ تعديل الشروط إيجاب مقابل.',
  },
};

const ELEMENTS = [
  { id: 'offer', label: 'إيجاب واضح' },
  { id: 'accept', label: 'قبول مطابق غير مشروط' },
  { id: 'consid', label: 'مقابل (قسط أو وعد به)' },
  { id: 'intent', label: 'نية إنشاء علاقة قانونية' },
  { id: 'capacity', label: 'أهلية الطرفين' },
  { id: 'legal', label: 'محل مشروع' },
] as const;
type El = (typeof ELEMENTS)[number]['id'];

const CONTRACT_CASES: { title: string; text: string; present: El[]; note: string }[] = [
  {
    title: 'طلب مكتمل وقبول',
    text: 'قدّم تاجر طلب تأمين على مستودعه، فوافقت الشركة على الشروط نفسها وأصدرت إشعار تغطية، وسدد التاجر القسط.',
    present: ['offer', 'accept', 'consid', 'intent', 'capacity', 'legal'],
    note: 'كل الأركان متوفرة، فالعقد نافذ.',
  },
  {
    title: 'رد بشروط جديدة',
    text: 'قدّم عميل طلبًا بتحمّل 1,000، فردّت الشركة بقبول التغطية بتحمّل 5,000. لم يرد العميل بعد.',
    present: ['offer', 'consid', 'intent', 'capacity', 'legal'],
    note: 'رد الشركة إيجاب مقابل؛ لا يوجد قبول مطابق بعد.',
  },
  {
    title: 'نشاط غير مشروع',
    text: 'طلب شخص تأمين بضائع يعلم الطرفان أنها مهربة، ووافقت الشركة ودفع القسط.',
    present: ['offer', 'accept', 'consid', 'intent', 'capacity'],
    note: 'المحل غير مشروع، فلا يكون العقد نافذًا رغم توفر بقية الأركان.',
  },
  {
    title: 'حديث ودي',
    text: 'قال موظف تأمين لصديقه في مناسبة اجتماعية: «لا تقلق، سيارتك علينا» دون أي طلب أو وثيقة أو قسط.',
    present: ['capacity', 'legal'],
    note: 'لا إيجاب ولا قبول ولا مقابل ولا نية قانونية؛ مجرد عبارة ودية.',
  },
];

export function ContractLab({ onComplete }: LabProps) {
  const [ci, setCi] = useState(0);
  const [marks, setMarks] = useState<Set<El>>(new Set());
  const [shown, setShown] = useState(false);
  const c = CONTRACT_CASES[ci];
  const missing = ELEMENTS.filter((e) => !c.present.includes(e.id));
  const correctMarks = ELEMENTS.filter((e) => marks.has(e.id) === c.present.includes(e.id)).length;
  return (
    <LabShell
      meta={contractMeta}
      onComplete={onComplete}
      onReset={() => {
        setCi(0);
        setMarks(new Set());
        setShown(false);
      }}
      controls={
        <>
          <div className="preset-row" role="tablist" aria-label="الحالات" data-nodrag>
            {CONTRACT_CASES.map((x, i) => (
              <button key={x.title} type="button" role="tab" aria-selected={ci === i} className={`chip ${ci === i ? 'on' : ''}`} onClick={() => { setCi(i); setMarks(new Set()); setShown(false); }}>
                {i + 1}. {x.title}
              </button>
            ))}
          </div>
          <p className="case-text">{c.text}</p>
          <fieldset className="checks" data-nodrag>
            <legend>حدّد الأركان المتوفرة في الحالة</legend>
            {ELEMENTS.map((e) => (
              <label key={e.id} className={`check ${shown ? (c.present.includes(e.id) === marks.has(e.id) ? 'right' : 'wrong') : ''}`}>
                <input
                  type="checkbox"
                  disabled={shown}
                  checked={marks.has(e.id)}
                  onChange={() =>
                    setMarks((s) => {
                      const n = new Set(s);
                      if (n.has(e.id)) n.delete(e.id);
                      else n.add(e.id);
                      return n;
                    })
                  }
                />
                {e.label}
              </label>
            ))}
          </fieldset>
          <button type="button" className="btn" disabled={shown} onClick={() => { setShown(true); onComplete?.(); }} data-nodrag>
            تحقق
          </button>
        </>
      }
      results={
        <>
          <div className="stages" aria-label="مراحل تكوين العقد">
            {['الإيجاب', 'القبول', 'المقابل', 'العقد النافذ'].map((s, i) => {
              const ok = shown && (i === 0 ? c.present.includes('offer') : i === 1 ? c.present.includes('accept') : i === 2 ? c.present.includes('consid') : missing.length === 0);
              return (
                <div key={s} className={`stage ${shown ? (ok ? 'ok' : 'no') : ''}`}>
                  {s}
                </div>
              );
            })}
          </div>
          {shown && (
            <p className="verdict">
              تحديدك صحيح في <bdi dir="ltr">{correctMarks}/{ELEMENTS.length}</bdi> أركان. الحكم: <strong>{missing.length === 0 ? 'عقد نافذ' : 'لم ينعقد عقد نافذ'}</strong>
            </p>
          )}
        </>
      }
      interpretation={<p>{shown ? c.note : 'اقرأ الحالة وحدد ما يتوفر من أركان قبل التحقق.'}</p>}
    />
  );
}

/* ============================================================ Regulation map */
export const regulationMeta: LabMeta = {
  id: 'regulation-map',
  title: 'مختبر خريطة تنظيم قطاع التأمين السعودي',
  chapterId: 'c9',
  objective: 'أن تتعرف على الأدوار التنظيمية والرقابية والمهنية في قطاع التأمين والعلاقات بينها، مع تمييز ما تم التحقق منه عما يحتاج إلى مراجعة.',
  variables: [
    { name: 'تم التحقق (عام)', desc: 'معلومة عامة مستقرة أو مؤكدة من مصدر رسمي/قانوني موثوق.' },
    { name: 'تحقق جزئي', desc: 'مؤكدة من مصادر ثانوية موثوقة وتحتاج مطابقة مع النص الرسمي.' },
    { name: 'يحتاج مراجعة', desc: 'لا تُعرض كحقيقة مؤكدة.' },
  ],
  rules: ['هذه الخريطة تعليمية مبسطة وليست وثيقة نظامية.', 'التواريخ والصلاحيات يجب مطابقتها مع الموقع الرسمي لهيئة التأمين (ia.gov.sa).'],
  predict: {
    question: 'من يتعاقد معه المؤمَّن له مباشرة عند شراء الوثيقة؟',
    options: ['الجهة الرقابية', 'شركة التأمين (غالبًا عبر وسيط أو وكيل)', 'معيد التأمين'],
    answer: 1,
    reveal: 'العقد بين المؤمَّن له وشركة التأمين؛ الجهة الرقابية تشرف ولا تتعاقد، ومعيد التأمين يتعامل مع شركة التأمين.',
  },
  mistake: {
    mistake: 'الخلط بين دور الجهة الرقابية ودور شركة التأمين.',
    correction: 'الجهة الرقابية تضع القواعد وتمنح التراخيص وتراقب الملاءة والسلوك؛ شركة التأمين تكتتب وتدفع المطالبات.',
  },
};

type Verif = 'verified' | 'partial' | 'review';
const NODES: { id: string; label: string; group: 'reg' | 'market' | 'intl' | 'customer'; verif: Verif; text: string; links: string[] }[] = [
  { id: 'ia', label: 'هيئة التأمين', group: 'reg', verif: 'partial', text: 'الجهة المنظِّمة والمشرفة على قطاع التأمين في المملكة. تشير مصادر قانونية إلى اعتماد إنشائها عام 2023 وانتقال مهام الإشراف على التأمين إليها من البنك المركزي السعودي، وانتقال مهام التأمين الصحي إليها من مجلس الضمان الصحي في 2024. التواريخ والصلاحيات التفصيلية بحاجة لمطابقة مع النص الرسمي.', links: ['insurers', 'brokers', 'agents', 'providers'] },
  { id: 'sama', label: 'البنك المركزي السعودي (ساما)', group: 'reg', verif: 'partial', text: 'كان الجهة المشرفة على شركات التأمين قبل انتقال الإشراف إلى هيئة التأمين. يبقى مرجعًا تاريخيًا مهمًا لفهم الأنظمة واللوائح الصادرة سابقًا.', links: ['ia'] },
  { id: 'chi', label: 'مجلس الضمان الصحي', group: 'reg', verif: 'review', text: 'كان له دور في تنظيم التأمين الصحي التعاوني. تشير مصادر إلى انتقال المهام المتعلقة بالتأمين الصحي إلى هيئة التأمين — الدور الحالي يحتاج مراجعة.', links: ['ia'] },
  { id: 'insurers', label: 'شركات التأمين (التعاوني)', group: 'market', verif: 'verified', text: 'تكتتب الأخطار، وتحصّل الأقساط، وتدفع المطالبات، وتخضع للترخيص والرقابة. يقوم التأمين في المملكة على الأساس التعاوني.', links: ['reins', 'customers'] },
  { id: 'reins', label: 'معيدو التأمين', group: 'market', verif: 'verified', text: 'يقبلون جزءًا من أخطار شركات التأمين مقابل جزء من الأقساط، ولا يتعاقدون عادةً مع المؤمَّن له مباشرة.', links: ['insurers'] },
  { id: 'brokers', label: 'وسطاء التأمين', group: 'market', verif: 'verified', text: 'يمثلون العميل غالبًا ويبحثون له عن أفضل تغطية لدى عدة شركات.', links: ['customers', 'insurers'] },
  { id: 'agents', label: 'وكلاء التأمين', group: 'market', verif: 'verified', text: 'يمثلون شركة التأمين ويبيعون منتجاتها نيابة عنها.', links: ['insurers', 'customers'] },
  { id: 'providers', label: 'مقدمو الخدمات المهنية', group: 'market', verif: 'verified', text: 'مثل خبراء المعاينة وتسوية الخسائر والخبراء الاكتواريين؛ يقدمون خدمات متخصصة للقطاع ويخضع بعضهم للترخيص.', links: ['insurers'] },
  { id: 'disputes', label: 'لجان الفصل في المنازعات والمخالفات التأمينية', group: 'reg', verif: 'review', text: 'جهة للفصل في النزاعات التأمينية. تشير مصادر إلى ارتباطها بهيئة التأمين مع استقلالها التشغيلي — يحتاج مراجعة.', links: ['customers', 'insurers'] },
  { id: 'iais', label: 'الجمعية الدولية لمشرفي التأمين IAIS', group: 'intl', verif: 'verified', text: 'هيئة دولية لوضع المعايير تضم جهات الإشراف على التأمين، وتصدر المبادئ الأساسية للتأمين (ICPs) لتعزيز الإشراف الفعال.', links: ['ia'] },
  { id: 'customers', label: 'المؤمَّن لهم (العملاء)', group: 'customer', verif: 'verified', text: 'الأفراد والمنشآت المشترون للتغطية؛ تهدف قواعد حماية العملاء إلى معاملتهم معاملة عادلة.', links: ['insurers', 'brokers', 'agents'] },
];

const VERIF_LABEL: Record<Verif, string> = { verified: 'تم التحقق (عام)', partial: 'تحقق جزئي', review: 'يحتاج مراجعة' };

export function RegulationMapLab({ onComplete }: LabProps) {
  const [sel, setSel] = useState('ia');
  const [visited, setVisited] = useState<Set<string>>(new Set(['ia']));
  const node = NODES.find((n) => n.id === sel)!;
  const groups: { id: (typeof NODES)[number]['group']; label: string }[] = [
    { id: 'intl', label: 'دولي' },
    { id: 'reg', label: 'تنظيمي ورقابي' },
    { id: 'market', label: 'السوق والمهنيون' },
    { id: 'customer', label: 'العملاء' },
  ];
  return (
    <LabShell
      meta={regulationMeta}
      onComplete={onComplete}
      onReset={() => {
        setSel('ia');
        setVisited(new Set(['ia']));
      }}
      controls={
        <div className="regmap" data-nodrag>
          {groups.map((g) => (
            <div key={g.id} className="regmap-row">
              <span className="regmap-label">{g.label}</span>
              <div className="regmap-nodes">
                {NODES.filter((n) => n.group === g.id).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`regnode verif-${n.verif} ${sel === n.id ? 'on' : ''} ${node.links.includes(n.id) ? 'linked' : ''}`}
                    aria-pressed={sel === n.id}
                    onClick={() => {
                      setSel(n.id);
                      setVisited((v) => new Set(v).add(n.id));
                    }}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      }
      results={
        <div className="regdetail">
          <h4>{node.label}</h4>
          <span className={`badge verif-badge-${node.verif}`}>{VERIF_LABEL[node.verif]}</span>
          <p>{node.text}</p>
          <p className="small">
            يرتبط مباشرة بـ: {node.links.map((l) => NODES.find((n) => n.id === l)?.label).join('، ')}
          </p>
          <p className="small">استكشفت {visited.size} من {NODES.length} أدوار.</p>
        </div>
      }
      interpretation={<p>العناصر المحاطة بإطار متقطع مرتبطة بالعنصر المحدد. البطاقات «تحقق جزئي» و«يحتاج مراجعة» لا تُعامل كحقائق نهائية للاختبار.</p>}
    />
  );
}
