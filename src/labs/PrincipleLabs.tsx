import { useState } from 'react';
import { LabShell, type LabMeta, type LabProps } from './LabShell';
import { Money, NumberField, Segmented } from '../components/ui';
import { average, contributionBySumInsured, contributionIndependent, fmt, indemnity, reinsuranceSplit, subrogation } from '../engine/calc';
import { SplitBar } from './charts';

/* ============================================================ Insurability */
export const insurabilityMeta: LabMeta = {
  id: 'insurability-check',
  title: 'مختبر فحص قابلية الخطر للتأمين',
  chapterId: 'c1',
  objective: 'أن تحكم على قابلية خطر مقترح للتأمين بفحص السمات الأساسية واحدة تلو الأخرى.',
  variables: [
    { name: 'السمات', desc: 'كل سمة شرط يرفع أو يخفض قابلية التأمين؛ غياب سمة جوهرية يمنع التأمين التجاري المعتاد.' },
  ],
  predict: {
    question: 'طلب تغطية لخسارة أرباح متوقعة من صفقة أسهم. أي سمة تفشل أولًا؟',
    options: ['الخطر البحت', 'قابلية القياس', 'المصلحة'],
    answer: 0,
    reveal: 'صفقة الأسهم خطر مضاربي (ربح أو خسارة)، فلا يحقق شرط الخطر البحت.',
  },
  mistake: {
    mistake: 'الحكم بقابلية التأمين لأن الخسارة كبيرة ومالية فقط.',
    correction: 'يجب أن تتوفر بقية السمات: العرضية، المصلحة، المشروعية، التجانس، والقسط المعقول.',
  },
};

const CRITERIA = [
  { id: 'financial', label: 'خسارة مالية قابلة للقياس' },
  { id: 'pure', label: 'خطر بحت (لا ربح ممكن)' },
  { id: 'fortuitous', label: 'عرضي غير متعمد' },
  { id: 'homog', label: 'وحدات كثيرة متجانسة ومستقلة نسبيًا' },
  { id: 'interest', label: 'للمؤمَّن له مصلحة تأمينية' },
  { id: 'legal', label: 'مشروع ولا يخالف النظام العام' },
  { id: 'premium', label: 'قسط معقول اقتصاديًا' },
] as const;
type CritId = (typeof CRITERIA)[number]['id'];

const PROPOSALS: { label: string; set: CritId[] }[] = [
  { label: 'منزل ضد الحريق', set: ['financial', 'pure', 'fortuitous', 'homog', 'interest', 'legal', 'premium'] },
  { label: 'أرباح صفقة أسهم', set: ['financial', 'fortuitous', 'homog', 'interest', 'legal'] },
  { label: 'منزل الجار', set: ['financial', 'pure', 'fortuitous', 'homog', 'legal', 'premium'] },
  { label: 'بضائع مهربة', set: ['financial', 'pure', 'fortuitous', 'homog', 'interest', 'premium'] },
  { label: 'سيارة قيمتها أقل من القسط تقريبًا', set: ['financial', 'pure', 'fortuitous', 'homog', 'interest', 'legal'] },
];

export function InsurabilityLab({ onComplete }: LabProps) {
  const [on, setOn] = useState<Set<CritId>>(new Set(PROPOSALS[0].set));
  const [preset, setPreset] = useState(0);
  const missing = CRITERIA.filter((c) => !on.has(c.id));
  return (
    <LabShell
      meta={insurabilityMeta}
      onComplete={onComplete}
      onReset={() => {
        setOn(new Set(PROPOSALS[0].set));
        setPreset(0);
      }}
      controls={
        <>
          <label className="field">
            <span>اختر طلبًا مقترحًا</span>
            <select
              value={preset}
              onChange={(e) => {
                const i = Number(e.target.value);
                setPreset(i);
                setOn(new Set(PROPOSALS[i].set));
              }}
              data-nodrag
            >
              {PROPOSALS.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="checks" data-nodrag>
            <legend>السمات المتوفرة (يمكنك تعديلها)</legend>
            {CRITERIA.map((c) => (
              <label key={c.id} className="check">
                <input
                  type="checkbox"
                  checked={on.has(c.id)}
                  onChange={() =>
                    setOn((s) => {
                      const n = new Set(s);
                      if (n.has(c.id)) n.delete(c.id);
                      else n.add(c.id);
                      return n;
                    })
                  }
                />
                {c.label}
              </label>
            ))}
          </fieldset>
        </>
      }
      results={
        <div className={`verdict-card ${missing.length ? 'bad' : 'good'}`}>
          <strong>{missing.length === 0 ? 'قابل للتأمين' : 'غير قابل للتأمين التجاري المعتاد'}</strong>
          {missing.length > 0 && (
            <ul>
              {missing.map((m) => (
                <li key={m.id}>ينقصه: {m.label}</li>
              ))}
            </ul>
          )}
        </div>
      }
      interpretation={
        <p>
          {missing.length === 0
            ? 'تتوفر كل السمات، فيمكن تقدير الخطر وتسعيره وتجميعه مع أخطار مشابهة.'
            : missing.some((m) => m.id === 'homog')
              ? 'غياب التجانس أو الاستقلالية لا يمنع التأمين مطلقًا، لكنه يتطلب معالجة خاصة كالحدود وإعادة التأمين والخبرة المتخصصة. أما بقية النواقص فتمنع التأمين المعتاد.'
              : 'كل سمة ناقصة تفسّر لماذا ترفض شركة التأمين أو تعيد تصميم التغطية. ركّز على السبب لا على النتيجة.'}
        </p>
      }
    />
  );
}

/* ============================================================ Reinsurance */
export const reinsuranceMeta: LabMeta = {
  id: 'reinsurance',
  title: 'مختبر إعادة التأمين',
  chapterId: 'c2',
  objective: 'أن تتتبع تدفق الخسارة من المؤمَّن له إلى شركة التأمين ثم معيد التأمين وفق نوع الاتفاقية.',
  variables: [
    { name: 'الحصة النسبية (Quota share)', desc: 'يتنازل المؤمِّن عن نسبة ثابتة من كل خطر: من الأقساط ومن الخسائر.' },
    { name: 'فائض الخسارة (Excess of loss)', desc: 'يتحمل المؤمِّن الخسارة حتى حد الاحتفاظ، ويدفع معيد التأمين ما يزيد حتى حد الاتفاقية.' },
    { name: 'الاحتفاظ', desc: 'ما يبقى على شركة التأمين قبل تدخل معيد التأمين.' },
  ],
  rules: [
    'المؤمَّن له يتعامل مع شركة التأمين فقط؛ إعادة التأمين اتفاق منفصل بين المؤمِّن ومعيد التأمين.',
    'التحمّل الخاص بالمؤمَّن له يُخصم أولًا من الخسارة.',
    'ما يتجاوز حد اتفاقية فائض الخسارة يعود على شركة التأمين في هذا المثال.',
  ],
  predict: {
    question: 'في اتفاقية فائض خسارة باحتفاظ 1,000,000، وقعت خسارة 600,000. كم يدفع معيد التأمين؟',
    options: ['لا شيء', '300,000', '600,000'],
    answer: 0,
    reveal: 'الخسارة لم تتجاوز الاحتفاظ، فتتحملها شركة التأمين كاملة.',
  },
  mistake: {
    mistake: 'الاعتقاد بأن المؤمَّن له يطالب معيد التأمين مباشرة.',
    correction: 'العلاقة التعاقدية للمؤمَّن له مع شركة التأمين؛ وهي تبقى ملزمة بدفع المطالبة كاملة حتى لو تعثر معيد التأمين.',
  },
};

export function ReinsuranceLab({ onComplete }: LabProps) {
  const init = { loss: 3000000, excess: 50000, ceded: 40, retention: 1000000, limit: 4000000, premium: 200000 };
  const [v, setV] = useState(init);
  const [method, setMethod] = useState<'quota' | 'xol'>('quota');
  const set = (k: keyof typeof init) => (x: number) => setV((o) => ({ ...o, [k]: x }));
  const grossClaim = Math.max(v.loss - v.excess, 0);
  const r = reinsuranceSplit({ loss: grossClaim, method, cededPercent: v.ceded, retention: v.retention, limit: v.limit });
  return (
    <LabShell
      meta={reinsuranceMeta}
      onComplete={onComplete}
      onReset={() => {
        setV(init);
        setMethod('quota');
      }}
      controls={
        <>
          <Segmented label="نوع الاتفاقية" value={method} onChange={setMethod} options={[{ value: 'quota', label: 'حصة نسبية' }, { value: 'xol', label: 'فائض خسارة' }]} />
          <NumberField label="الخسارة الإجمالية" value={v.loss} onChange={set('loss')} min={0} max={10000000} step={50000} suffix="ريال" />
          <NumberField label="تحمّل المؤمَّن له" value={v.excess} onChange={set('excess')} min={0} max={500000} step={5000} suffix="ريال" />
          {method === 'quota' ? (
            <>
              <NumberField label="النسبة المتنازل عنها" value={v.ceded} onChange={set('ceded')} min={0} max={90} step={5} suffix="%" />
              <NumberField label="القسط الأصلي" value={v.premium} onChange={set('premium')} min={0} max={2000000} step={10000} suffix="ريال" />
            </>
          ) : (
            <>
              <NumberField label="حد الاحتفاظ" value={v.retention} onChange={set('retention')} min={0} max={5000000} step={50000} suffix="ريال" />
              <NumberField label="حد الاتفاقية فوق الاحتفاظ" value={v.limit} onChange={set('limit')} min={0} max={10000000} step={100000} suffix="ريال" />
            </>
          )}
        </>
      }
      results={
        <>
          <div className="flow" role="img" aria-label="تدفق الخسارة بين الأطراف">
            <div className="flow-node">المؤمَّن له<br /><small>يتحمل التحمّل</small><Money value={Math.min(v.excess, v.loss)} /></div>
            <div className="flow-arrow" aria-hidden>←</div>
            <div className="flow-node accent">شركة التأمين<br /><small>تدفع للمؤمَّن له</small><Money value={grossClaim} /></div>
            <div className="flow-arrow" aria-hidden>←</div>
            <div className="flow-node">معيد التأمين<br /><small>يسترد منه المؤمِّن</small><Money value={r.reinsurer} /></div>
          </div>
          <SplitBar
            ariaLabel="توزيع الخسارة النهائية"
            parts={[
              { label: 'المؤمَّن له', value: Math.min(v.excess, v.loss), color: 'var(--chart-3)' },
              { label: 'صافي شركة التأمين', value: r.insurerNet, color: 'var(--chart-1)' },
              { label: 'معيد التأمين', value: r.reinsurer, color: 'var(--chart-2)' },
            ]}
          />
          {method === 'quota' && (
            <p className="small">القسط المتنازل عنه لمعيد التأمين: <Money value={(v.premium * v.ceded) / 100} /> (قبل أي عمولة إعادة تأمين).</p>
          )}
          {method === 'xol' && r.aboveLimit > 0 && <p className="warn-note">تجاوزت الخسارة حد الاتفاقية بمقدار <Money value={r.aboveLimit} /> وعاد ذلك على شركة التأمين.</p>}
        </>
      }
      interpretation={
        <p>
          {method === 'quota'
            ? `في الحصة النسبية يشارك معيد التأمين بنسبة ${fmt(v.ceded)}% من كل خسارة مهما كان حجمها، ويأخذ النسبة نفسها من القسط.`
            : 'في فائض الخسارة لا يتدخل معيد التأمين إلا عندما تتجاوز الخسارة حد الاحتفاظ، فهو يحمي من الخسائر الكبيرة تحديدًا.'}{' '}
          في الحالتين تدفع شركة التأمين للمؤمَّن له <Money value={grossClaim} /> كاملة، ثم تسترد حصة معيد التأمين.
        </p>
      }
    />
  );
}

/* ============================================================ Indemnity */
export const indemnityMeta: LabMeta = {
  id: 'indemnity',
  title: 'مختبر التعويض',
  chapterId: 'c7',
  objective: 'أن تحسب التعويض خطوة بخطوة: قياس الخسارة، خصم الحطام والتحمّل، ثم تطبيق حد مبلغ التأمين.',
  variables: [
    { name: 'تكلفة الاستبدال جديدًا', desc: 'ما يكلفه شراء أو إصلاح الشيء بحالة جديدة.' },
    { name: 'الاستهلاك', desc: 'نسبة البلى والقدم التي تُخصم في أساس التعويض الدقيق.' },
    { name: 'أساس التعويض', desc: 'تعويض دقيق (بعد خصم الاستهلاك) أو إعادة الحال/جديد مقابل قديم (دون خصم) إذا نصت الوثيقة.' },
    { name: 'الحطام (السالفج)', desc: 'قيمة ما تبقى من الشيء التالف ويحتفظ به المؤمَّن له.' },
    { name: 'التحمّل', desc: 'المبلغ الذي يتحمله المؤمَّن له من كل مطالبة.' },
    { name: 'مبلغ التأمين', desc: 'الحد الأقصى لمسؤولية المؤمِّن.' },
  ],
  rules: ['ترتيب المثال: قياس الخسارة ← خصم الحطام ← خصم التحمّل ← حد مبلغ التأمين.', 'لا يُطبَّق شرط النسبية هنا (انظر مختبر النسبية).'],
  predict: {
    question: 'ثلاجة عمرها 5 سنوات تلفت. تكلفة الجديدة 4,000 والاستهلاك 50%. كم الخسارة المقيسة على أساس التعويض الدقيق؟',
    options: ['4,000', '2,000', '0'],
    answer: 1,
    reveal: 'التعويض الدقيق يعيد المؤمَّن له لوضعه قبل الخسارة: ثلاجة عمرها 5 سنوات لا ثلاجة جديدة.',
  },
  mistake: {
    mistake: 'افتراض أن التعويض يساوي دائمًا مبلغ التأمين.',
    correction: 'مبلغ التأمين حد أقصى؛ التعويض هو الخسارة الفعلية المقيسة وفق الشروط، ولا يتجاوز الحد.',
  },
};

export function IndemnityLab({ onComplete }: LabProps) {
  const init = { rc: 40000, dep: 30, si: 35000, excess: 1000, salvage: 2000 };
  const [v, setV] = useState(init);
  const [basis, setBasis] = useState<'indemnity' | 'reinstatement'>('indemnity');
  const set = (k: keyof typeof init) => (x: number) => setV((o) => ({ ...o, [k]: x }));
  const r = indemnity({ replacementCost: v.rc, depreciationPercent: v.dep, basis, sumInsured: v.si, excess: v.excess, salvage: v.salvage });
  return (
    <LabShell
      meta={indemnityMeta}
      onComplete={onComplete}
      onReset={() => {
        setV(init);
        setBasis('indemnity');
      }}
      controls={
        <>
          <Segmented label="أساس التعويض" value={basis} onChange={setBasis} options={[{ value: 'indemnity', label: 'تعويض دقيق' }, { value: 'reinstatement', label: 'جديد مقابل قديم' }]} />
          <NumberField label="تكلفة الاستبدال جديدًا" value={v.rc} onChange={set('rc')} min={0} max={200000} step={500} suffix="ريال" />
          {basis === 'indemnity' && <NumberField label="الاستهلاك" value={v.dep} onChange={set('dep')} min={0} max={90} suffix="%" />}
          <NumberField label="قيمة الحطام" value={v.salvage} onChange={set('salvage')} min={0} max={50000} step={100} suffix="ريال" />
          <NumberField label="التحمّل" value={v.excess} onChange={set('excess')} min={0} max={20000} step={100} suffix="ريال" />
          <NumberField label="مبلغ التأمين" value={v.si} onChange={set('si')} min={0} max={200000} step={500} suffix="ريال" />
        </>
      }
      results={
        <>
          <ol className="steps">
            {r.steps.map((s) => (
              <li key={s.label}>
                <span>{s.label}</span>
                <Money value={s.value} />
              </li>
            ))}
          </ol>
          <p className="verdict">
            التعويض المستحق: <strong><Money value={r.payout} /></strong>
          </p>
        </>
      }
      interpretation={
        <p>
          {basis === 'indemnity'
            ? `خُصم الاستهلاك (${fmt(v.dep)}%) لأن التعويض الدقيق يعيد المؤمَّن له إلى وضعه قبل الخسارة لا إلى وضع أفضل.`
            : 'أساس «الجديد مقابل القديم» تعديل لمبدأ التعويض يتطلب نصًا صريحًا في الوثيقة وقسطًا مناسبًا.'}{' '}
          {r.cappedBySumInsured ? 'لاحظ أن مبلغ التأمين حدّ من التعويض: ما يتجاوزه يتحمله المؤمَّن له.' : ''}
        </p>
      }
    />
  );
}

/* ============================================================ Average */
export const averageMeta: LabMeta = {
  id: 'average',
  title: 'مختبر النسبية (نقص التأمين)',
  chapterId: 'c7',
  objective: 'أن ترى أثر شرط النسبية عندما يكون مبلغ التأمين أقل من القيمة الكاملة للممتلكات وقت الخسارة.',
  variables: [
    { name: 'مبلغ التأمين', desc: 'المبلغ المحدد في الوثيقة.' },
    { name: 'القيمة الفعلية وقت الخسارة', desc: 'القيمة الكاملة للممتلكات المعرضة للخطر.' },
    { name: 'الخسارة', desc: 'قيمة الضرر الفعلي (جزئي غالبًا).' },
    { name: 'شرط النسبية', desc: 'يطبق إذا نصت عليه الوثيقة: التعويض = الخسارة × (مبلغ التأمين ÷ القيمة).' },
  ],
  rules: ['ترتيب المثال: تطبيق النسبية على الخسارة ← خصم التحمّل ← حد مبلغ التأمين.', 'لا تُطبق النسبية إلا عند وجود نقص تأمين ونص الشرط في الوثيقة.'],
  predict: {
    question: 'مبنى قيمته 1,000,000 مؤمَّن بمبلغ 600,000 مع شرط النسبية، وخسارة جزئية 200,000. كم التعويض؟',
    options: ['200,000', '120,000', '600,000'],
    answer: 1,
    reveal: '200,000 × (600,000 ÷ 1,000,000) = 120,000؛ المؤمَّن له «مؤمِّن ذاتي» على الجزء غير المؤمَّن.',
  },
  mistake: {
    mistake: 'الاعتقاد بأن الخسارة الجزئية تُعوض كاملة طالما أنها أقل من مبلغ التأمين.',
    correction: 'مع شرط النسبية ونقص التأمين يُخفض التعويض بنسبة النقص حتى في الخسارة الجزئية.',
  },
};

export function AverageLab({ onComplete }: LabProps) {
  const init = { si: 600000, value: 1000000, loss: 200000, excess: 0 };
  const [v, setV] = useState(init);
  const [applies, setApplies] = useState<'yes' | 'no'>('yes');
  const set = (k: keyof typeof init) => (x: number) => setV((o) => ({ ...o, [k]: x }));
  const r = average({ sumInsured: v.si, valueAtRisk: v.value, loss: v.loss, averageApplies: applies === 'yes', excess: v.excess });
  return (
    <LabShell
      meta={averageMeta}
      onComplete={onComplete}
      onReset={() => {
        setV(init);
        setApplies('yes');
      }}
      controls={
        <>
          <Segmented label="هل تتضمن الوثيقة شرط النسبية؟" value={applies} onChange={setApplies} options={[{ value: 'yes', label: 'نعم' }, { value: 'no', label: 'لا' }]} />
          <NumberField label="مبلغ التأمين" value={v.si} onChange={set('si')} min={0} max={3000000} step={10000} suffix="ريال" />
          <NumberField label="القيمة الفعلية وقت الخسارة" value={v.value} onChange={set('value')} min={1} max={3000000} step={10000} suffix="ريال" />
          <NumberField label="الخسارة" value={v.loss} onChange={set('loss')} min={0} max={3000000} step={5000} suffix="ريال" />
          <NumberField label="التحمّل" value={v.excess} onChange={set('excess')} min={0} max={100000} step={1000} suffix="ريال" />
        </>
      }
      results={
        <>
          <dl className="results">
            <div><dt>حالة التأمين</dt><dd className={r.underInsured ? 'bad' : 'good'}>{r.underInsured ? 'نقص تأمين' : 'تأمين كافٍ'}</dd></div>
            <div><dt>نسبة التغطية</dt><dd><bdi dir="ltr">{fmt(r.ratio * 100)}%</bdi></dd></div>
            <div><dt>بعد تطبيق النسبية</dt><dd><Money value={r.afterAverage} /></dd></div>
            <div><dt>التعويض المستحق</dt><dd><strong><Money value={r.payout} /></strong></dd></div>
          </dl>
          <SplitBar ariaLabel="توزيع الخسارة" parts={[{ label: 'يدفعه المؤمِّن', value: r.payout, color: 'var(--chart-1)' }, { label: 'يتحمله المؤمَّن له', value: r.insuredBears, color: 'var(--chart-3)' }]} />
          <p className="formula"><bdi dir="ltr">Payout = Loss × (Sum insured ÷ Value)</bdi></p>
        </>
      }
      interpretation={
        <p>
          {!r.underInsured
            ? 'مبلغ التأمين يغطي القيمة كاملة، فلا أثر للنسبية؛ يُدفع التعويض حتى مبلغ التأمين بعد التحمّل.'
            : applies === 'yes'
              ? `المؤمَّن له أمّن ${fmt(r.ratio * 100)}% فقط من القيمة، فيُعوَّض بالنسبة نفسها من الخسارة ويتحمل الباقي بنفسه.`
              : 'رغم نقص التأمين، لا تتضمن الوثيقة شرط النسبية في هذا المثال، فتُعوَّض الخسارة حتى مبلغ التأمين.'}
        </p>
      }
    />
  );
}

/* ============================================================ Contribution */
export const contributionMeta: LabMeta = {
  id: 'contribution',
  title: 'مختبر المشاركة في التعويض',
  chapterId: 'c8',
  objective: 'أن تحسب حصة كل مؤمِّن عند وجود أكثر من وثيقة تغطي الخسارة نفسها، بطريقتين، وتفسّر الفرق.',
  variables: [
    { name: 'مبلغ التأمين لكل وثيقة', desc: 'الحد الأقصى لمسؤولية كل مؤمِّن.' },
    { name: 'طريقة مبلغ التأمين', desc: 'الحصة = الخسارة × (مبلغ تأمين الوثيقة ÷ مجموع مبالغ التأمين).' },
    { name: 'طريقة المسؤولية المستقلة', desc: 'تُحسب مسؤولية كل مؤمِّن كأنه الوحيد، ثم تُوزع الخسارة بنسبة هذه المسؤوليات.' },
  ],
  rules: [
    'الوثائق تغطي المصلحة نفسها والشيء نفسه والخطر نفسه (شروط المشاركة متحققة).',
    'المسؤولية المستقلة هنا = الأقل من الخسارة ومبلغ التأمين (دون نسبية أو تحمّل للتبسيط).',
    'اختيار الطريقة في الواقع يعتمد على نوع التأمين وشروط الوثائق.',
  ],
  predict: {
    question: 'وثيقتان بمبلغي 10,000 و20,000 وخسارة 6,000. بطريقة المسؤولية المستقلة، كم تدفع كل منهما؟',
    options: ['2,000 و4,000', '3,000 و3,000', '6,000 و0'],
    answer: 1,
    reveal: 'كل وثيقة مسؤولة منفردة عن 6,000 كاملة، فتتساوى المسؤوليتان وتُقسم الخسارة مناصفة.',
  },
  mistake: {
    mistake: 'جمع التعويضات من كل الوثائق.',
    correction: 'المؤمَّن له يُعوَّض مرة واحدة بقدر خسارته، والمؤمِّنون يتقاسمونها.',
  },
};

export function ContributionLab({ onComplete }: LabProps) {
  const init = { loss: 6000, a: 10000, b: 20000, c: 0 };
  const [v, setV] = useState(init);
  const set = (k: keyof typeof init) => (x: number) => setV((o) => ({ ...o, [k]: x }));
  const policies = [
    { name: 'وثيقة أ', sumInsured: v.a },
    { name: 'وثيقة ب', sumInsured: v.b },
    ...(v.c > 0 ? [{ name: 'وثيقة ج', sumInsured: v.c }] : []),
  ];
  const bySI = contributionBySumInsured(v.loss, policies);
  const byIL = contributionIndependent(v.loss, policies);
  const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-4)'];
  return (
    <LabShell
      meta={contributionMeta}
      onComplete={onComplete}
      onReset={() => setV(init)}
      controls={
        <>
          <NumberField label="الخسارة" value={v.loss} onChange={set('loss')} min={0} max={100000} step={500} suffix="ريال" />
          <NumberField label="مبلغ تأمين وثيقة أ" value={v.a} onChange={set('a')} min={0} max={100000} step={500} suffix="ريال" />
          <NumberField label="مبلغ تأمين وثيقة ب" value={v.b} onChange={set('b')} min={0} max={100000} step={500} suffix="ريال" />
          <NumberField label="مبلغ تأمين وثيقة ج (اختياري)" value={v.c} onChange={set('c')} min={0} max={100000} step={500} suffix="ريال" />
        </>
      }
      results={
        <>
          <div className="scroll-x">
            <table className="tbl">
              <thead>
                <tr>
                  <th>الوثيقة</th>
                  <th>المسؤولية المنفردة</th>
                  <th>حسب مبلغ التأمين</th>
                  <th>حسب المسؤولية المستقلة</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p, i) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td><bdi dir="ltr">{fmt(bySI[i].independentLiability)}</bdi></td>
                    <td><bdi dir="ltr">{fmt(bySI[i].share)}</bdi></td>
                    <td><bdi dir="ltr">{fmt(byIL[i].share)}</bdi></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SplitBar ariaLabel="الحصص بطريقة المسؤولية المستقلة" parts={byIL.map((s, i) => ({ label: s.name, value: s.share, color: colors[i] }))} />
        </>
      }
      interpretation={
        <p>
          في الطريقتين يحصل المؤمَّن له على <Money value={Math.min(v.loss, policies.reduce((s, p) => s + p.sumInsured, 0))} /> فقط. تختلف الحصص لأن طريقة مبلغ التأمين تحمّل الوثيقة الأكبر نصيبًا أكبر دائمًا،
          بينما تنظر طريقة المسؤولية المستقلة إلى ما كانت كل وثيقة ستدفعه منفردة؛ ففي الخسائر الصغيرة التي تغطيها كل وثيقة كاملة تتقارب الحصص.
        </p>
      }
    />
  );
}

/* ============================================================ Subrogation */
export const subrogationMeta: LabMeta = {
  id: 'subrogation',
  title: 'مختبر الحلول',
  chapterId: 'c8',
  objective: 'أن تتبع انتقال حق الرجوع على الطرف المسؤول إلى شركة التأمين بعد الدفع، وحدود ما يمكنها استرداده.',
  variables: [
    { name: 'الخسارة الكلية', desc: 'قيمة الضرر الذي تسبب فيه الطرف الثالث.' },
    { name: 'التحمّل', desc: 'الجزء غير المؤمَّن الذي يتحمله المؤمَّن له.' },
    { name: 'المسترد من الطرف المسؤول', desc: 'ما أمكن تحصيله فعليًا من المتسبب أو من مؤمِّنه.' },
  ],
  rules: [
    'قاعدة هذا المثال (وفق صياغة افتراضية للوثيقة): يحتفظ المؤمِّن بالمسترد حتى ما دفعه، وما زاد يعود للمؤمَّن له.',
    'توزيع الاسترداد الجزئي بين المؤمِّن والخسائر غير المؤمَّنة قد يختلف بحسب النظام وصياغة الوثيقة — مسجّل للمراجعة.',
    'لا ينطبق الحلول ضد المؤمَّن له نفسه، ولا في العقود غير التعويضية كتأمين الحياة.',
  ],
  predict: {
    question: 'دفعت شركة التأمين 45,000 واستردت من المتسبب 60,000. ماذا تفعل بالفرق؟',
    options: ['تحتفظ به كربح', 'يعود الفرق للمؤمَّن له', 'يُقسم مناصفة'],
    answer: 1,
    reveal: 'الحلول لا يسمح للمؤمِّن بالربح: يسترد حتى ما دفع فقط.',
  },
  mistake: {
    mistake: 'الاعتقاد بأن المؤمَّن له يستطيع قبض التعويض ثم المطالبة بكامل الخسارة من المتسبب لنفسه.',
    correction: 'هذا يجعله يُعوَّض مرتين؛ بعد الدفع ينتقل حق الرجوع بقدر ما دفع المؤمِّن.',
  },
};

export function SubrogationLab({ onComplete }: LabProps) {
  const init = { loss: 50000, excess: 5000, si: 100000, recovery: 30000 };
  const [v, setV] = useState(init);
  const [avail, setAvail] = useState<'yes' | 'no'>('yes');
  const set = (k: keyof typeof init) => (x: number) => setV((o) => ({ ...o, [k]: x }));
  const r = subrogation({ totalLoss: v.loss, excess: v.excess, sumInsured: v.si, recovery: v.recovery, available: avail === 'yes' });
  return (
    <LabShell
      meta={subrogationMeta}
      onComplete={onComplete}
      onReset={() => {
        setV(init);
        setAvail('yes');
      }}
      controls={
        <>
          <Segmented label="هل يوجد طرف ثالث يمكن الرجوع عليه؟" value={avail} onChange={setAvail} options={[{ value: 'yes', label: 'نعم: طرف ثالث مسؤول' }, { value: 'no', label: 'لا: المتسبب هو المؤمَّن له نفسه' }]} />
          <NumberField label="الخسارة الكلية" value={v.loss} onChange={set('loss')} min={0} max={500000} step={1000} suffix="ريال" />
          <NumberField label="التحمّل" value={v.excess} onChange={set('excess')} min={0} max={50000} step={500} suffix="ريال" />
          <NumberField label="مبلغ التأمين" value={v.si} onChange={set('si')} min={0} max={500000} step={1000} suffix="ريال" />
          <NumberField label="المسترد من الطرف المسؤول" value={v.recovery} onChange={set('recovery')} min={0} max={500000} step={1000} suffix="ريال" />
        </>
      }
      results={
        <>
          <ol className="timeline-steps">
            <li><span>1</span> وقعت الخسارة: <Money value={v.loss} /></li>
            <li><span>2</span> دفعت شركة التأمين: <Money value={r.insurerPaid} /> (المؤمَّن له تحمّل <Money value={r.insuredUninsured} />)</li>
            <li><span>3</span> {avail === 'yes' ? <>انتقل حق الرجوع للمؤمِّن بحدود ما دفع، واستُرد: <Money value={Math.min(v.recovery, v.loss)} /></> : 'لا يمكن الحلول ضد المؤمَّن له نفسه؛ لا استرداد.'}</li>
            <li><span>4</span> للمؤمِّن: <Money value={r.toInsurer} /> — للمؤمَّن له: <Money value={r.toInsured} /></li>
          </ol>
          <p className="verdict">صافي تكلفة المؤمِّن: <strong><Money value={r.insurerNetCost} /></strong></p>
        </>
      }
      interpretation={
        <p>
          {avail === 'no'
            ? 'الحلول يقوم على الرجوع على طرف آخر مسؤول؛ لا يمكن للمؤمِّن أن يرجع على عميله الذي دفع له.'
            : r.toInsured > 0
              ? 'المسترد تجاوز ما دفعه المؤمِّن، فعاد الفائض للمؤمَّن له وفق قاعدة المثال. الحلول يمنع ربح أي طرف.'
              : 'المؤمِّن يسترد حتى ما دفعه فقط. الحلول يمنع المؤمَّن له من التعويض مرتين ويُبقي المسؤولية على المتسبب.'}
        </p>
      }
    />
  );
}
