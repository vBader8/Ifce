import { useMemo, useState } from 'react';
import { LabShell, type LabMeta, type LabProps } from './LabShell';
import { NumberField, Money, Segmented } from '../components/ui';
import { pooling, riskTransfer, selfInsurance, simulatePool, coInsuranceSplit, totalShare, fmt } from '../engine/calc';
import { MiniBars, SplitBar } from './charts';
import { newSeed } from '../engine/random';

/* ============================================================ Risk matrix */
export const riskMatrixMeta: LabMeta = {
  id: 'risk-matrix',
  title: 'مختبر الخطر: التكرار × الشدة',
  chapterId: 'c1',
  objective: 'أن ترى كيف يحدد تكرار الخطر وشدته الاستجابة الأنسب: التجنّب أو التقليل أو الاحتفاظ أو التحويل بالتأمين.',
  variables: [
    { name: 'التكرار', desc: 'مدى احتمال وقوع الحدث خلال فترة (1 نادر جدًا ← 5 متكرر جدًا).' },
    { name: 'الشدة', desc: 'حجم الأثر المالي إن وقع الحدث (1 بسيط ← 5 مدمّر).' },
  ],
  rules: [
    'هذا تصنيف تعليمي مبسط؛ القرار الفعلي يراعي أيضًا التكلفة والقدرة المالية والمتطلبات النظامية.',
    'تكرار مرتفع (4–5) وشدة مرتفعة (4–5) ← تجنّب أو تغيير جذري في النشاط.',
    'تكرار منخفض (1–3) وشدة مرتفعة (4–5) ← تحويل بالتأمين مع وقاية.',
    'تكرار مرتفع (4–5) وشدة منخفضة (1–3) ← تقليل (وقاية) مع احتفاظ.',
    'غير ذلك ← احتفاظ مع مراقبة.',
  ],
  predict: {
    question: 'حريق نادر جدًا لكنه قد يدمّر المصنع بالكامل. ما الاستجابة الأنسب؟',
    options: ['التجنّب', 'التحويل بالتأمين مع الوقاية', 'الاحتفاظ', 'التقليل فقط'],
    answer: 1,
    reveal: 'النادر الشديد يُحوَّل أثره المالي لأن المنشأة لا تستطيع تحمّله، مع إجراءات وقاية.',
  },
  mistake: {
    mistake: 'تأمين كل خطر مهما كان صغيرًا ومتكررًا.',
    correction: 'الأخطار الصغيرة المتكررة غالبًا تُعالج بالتقليل والاحتفاظ لأن تأمينها مكلف.',
  },
};

export function respondTo(freq: number, sev: number): { key: string; label: string; desc: string } {
  if (freq >= 4 && sev >= 4) return { key: 'avoid', label: 'تجنّب', desc: 'الخطر متكرر وشديد معًا؛ تأمينه مكلف جدًا وقد لا يُقبل. الأفضل تجنّب النشاط أو تغييره جذريًا.' };
  if (sev >= 4) return { key: 'transfer', label: 'تحويل بالتأمين + وقاية', desc: 'نادر لكنه شديد: لا يمكن تحمّله منفردًا، فيُحوَّل أثره المالي بالتأمين مع الاستمرار في الوقاية.' };
  if (freq >= 4) return { key: 'reduce', label: 'تقليل + احتفاظ', desc: 'متكرر لكنه صغير الأثر: إجراءات الوقاية تقلل تكراره، وتكلفته يمكن الاحتفاظ بها.' };
  return { key: 'retain', label: 'احتفاظ مع مراقبة', desc: 'منخفض التكرار والشدة: يمكن تحمّله ضمن الميزانية مع متابعته.' };
}

const PRESETS = [
  { label: 'كسر زجاج واجهة', f: 4, s: 1 },
  { label: 'حريق مستودع', f: 1, s: 5 },
  { label: 'أعطال حاسوب', f: 5, s: 2 },
  { label: 'نقل مواد متفجرة بطرق خطرة', f: 4, s: 5 },
];

export function RiskMatrixLab({ onComplete }: LabProps) {
  const [f, setF] = useState(2);
  const [s, setS] = useState(4);
  const r = respondTo(f, s);
  return (
    <LabShell
      meta={riskMatrixMeta}
      onComplete={onComplete}
      onReset={() => {
        setF(2);
        setS(4);
      }}
      controls={
        <>
          <NumberField label="التكرار" value={f} onChange={setF} min={1} max={5} />
          <NumberField label="الشدة" value={s} onChange={setS} min={1} max={5} />
          <div className="preset-row" data-nodrag>
            {PRESETS.map((p) => (
              <button key={p.label} type="button" className="chip" onClick={() => { setF(p.f); setS(p.s); }}>
                {p.label}
              </button>
            ))}
          </div>
        </>
      }
      results={
        <>
          <div className="matrix" role="grid" aria-label="مصفوفة التكرار والشدة">
            {[5, 4, 3, 2, 1].map((sev) => (
              <div role="row" key={sev} className="matrix-row">
                {[1, 2, 3, 4, 5].map((fr) => {
                  const k = respondTo(fr, sev).key;
                  const on = fr === f && sev === s;
                  return (
                    <div role="gridcell" key={fr} className={`cell cell-${k} ${on ? 'on' : ''}`} aria-label={`تكرار ${fr} شدة ${sev}`} aria-selected={on}>
                      {on ? '●' : ''}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="matrix-axes">
              <span>← التكرار يزداد</span>
              <span>الشدة ↑</span>
            </div>
          </div>
          <p className="verdict">
            الاستجابة المقترحة: <strong>{r.label}</strong>
          </p>
        </>
      }
      interpretation={<p>{r.desc}</p>}
    />
  );
}

/* ============================================================ Risk transfer */
export const riskTransferMeta: LabMeta = {
  id: 'risk-transfer',
  title: 'مختبر تحويل الخطر',
  chapterId: 'c1',
  objective: 'أن تقارن الوضع المالي للمؤمَّن له مع التأمين وبدونه، وترى كيف يقلّص التأمين تشتت النتائج.',
  variables: [
    { name: 'الوضع المالي', desc: 'ما يملكه المؤمَّن له في بداية السنة.' },
    { name: 'احتمال الخسارة', desc: 'فرصة وقوع الخسارة خلال السنة.' },
    { name: 'حجم الخسارة', desc: 'المبلغ المفقود إن وقعت الخسارة.' },
    { name: 'القسط', desc: 'تكلفة مؤكدة تُدفع للمؤمِّن.' },
    { name: 'التحمّل', desc: 'الجزء الأول من الخسارة الذي يبقى على المؤمَّن له.' },
  ],
  rules: ['خسارة واحدة على الأكثر في السنة.', 'الخسارة مغطاة بالكامل بعد التحمّل (لا استثناءات ولا حد أقل من الخسارة).'],
  predict: {
    question: 'عندما ترفع التحمّل مع بقاء كل شيء آخر ثابتًا، ماذا يحدث للفارق بين أفضل وأسوأ نتيجة مع التأمين؟',
    options: ['يزداد', 'ينخفض', 'لا يتغير'],
    answer: 0,
    reveal: 'الفارق مع التأمين يساوي التحمّل؛ كلما رفعته احتفظت بجزء أكبر من الخطر.',
  },
  mistake: {
    mistake: 'الاعتقاد بأن المؤمَّن له لا يتحمل أي شيء عند وجود التأمين.',
    correction: 'يتحمل القسط دائمًا، والتحمّل عند الخسارة، وأي جزء غير مغطى.',
  },
};

export function RiskTransferLab({ onComplete }: LabProps) {
  const init = { wealth: 300000, p: 5, sev: 150000, premium: 9000, excess: 2500 };
  const [v, setV] = useState(init);
  const r = riskTransfer({ wealth: v.wealth, probability: v.p / 100, severity: v.sev, premium: v.premium, excess: v.excess });
  const set = (k: keyof typeof init) => (n: number) => setV((o) => ({ ...o, [k]: n }));
  return (
    <LabShell
      meta={riskTransferMeta}
      onComplete={onComplete}
      onReset={() => setV(init)}
      controls={
        <>
          <NumberField label="الوضع المالي" value={v.wealth} onChange={set('wealth')} min={50000} max={1000000} step={10000} suffix="ريال" />
          <NumberField label="احتمال الخسارة" value={v.p} onChange={set('p')} min={0} max={50} step={0.5} suffix="%" />
          <NumberField label="حجم الخسارة" value={v.sev} onChange={set('sev')} min={0} max={500000} step={5000} suffix="ريال" />
          <NumberField label="القسط" value={v.premium} onChange={set('premium')} min={0} max={60000} step={500} suffix="ريال" />
          <NumberField label="التحمّل" value={v.excess} onChange={set('excess')} min={0} max={50000} step={500} suffix="ريال" />
        </>
      }
      results={
        <>
          <table className="tbl">
            <thead>
              <tr>
                <th>الحالة</th>
                <th>بدون تأمين</th>
                <th>مع التأمين</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>لا خسارة</td>
                <td><Money value={r.uninsured.noLoss} /></td>
                <td><Money value={r.insured.noLoss} /></td>
              </tr>
              <tr>
                <td>وقعت الخسارة</td>
                <td><Money value={r.uninsured.withLoss} /></td>
                <td><Money value={r.insured.withLoss} /></td>
              </tr>
              <tr>
                <td>الفارق (التشتت)</td>
                <td className="bad"><Money value={r.uninsured.range} /></td>
                <td className="good"><Money value={r.insured.range} /></td>
              </tr>
              <tr>
                <td>القيمة المتوقعة</td>
                <td><Money value={r.uninsured.expected} /></td>
                <td><Money value={r.insured.expected} /></td>
              </tr>
            </tbody>
          </table>
          <SplitBar
            ariaLabel="توزيع الخسارة عند وقوعها"
            parts={[
              { label: 'يتحمله المؤمَّن له (التحمّل)', value: r.retained, color: 'var(--chart-3)' },
              { label: 'يُحوَّل إلى المؤمِّن', value: r.transferred, color: 'var(--chart-1)' },
            ]}
          />
        </>
      }
      interpretation={
        <p>
          الخسارة المتوقعة سنويًا <Money value={r.expectedLoss} />. التأمين يحوّل <Money value={r.transferred} /> من الخسارة إلى المؤمِّن عند وقوعها،
          فيتقلص الفارق بين أفضل وأسوأ نتيجة من <Money value={r.uninsured.range} /> إلى <Money value={r.insured.range} />.
          {v.premium > r.expectedLoss
            ? ' القسط أعلى من الخسارة المتوقعة لأنه يشمل المصاريف والهامش؛ المؤمَّن له يدفع هذا الفرق مقابل الاستقرار.'
            : ' القسط هنا لا يزيد على الخسارة المتوقعة؛ في الواقع يتضمن القسط عادةً تحميلًا فوقها.'}
        </p>
      }
    />
  );
}

/* ============================================================ Pooling */
export const poolingMeta: LabMeta = {
  id: 'pooling',
  title: 'مختبر تجميع الأخطار',
  chapterId: 'c1',
  objective: 'أن ترى كيف تُدفع خسائر القلة من مساهمات الكثرة، وكيف يزيد استقرار النتائج كلما كبرت المجموعة.',
  variables: [
    { name: 'عدد المشتركين', desc: 'عدد الوحدات المتشابهة المستقلة في الصندوق.' },
    { name: 'احتمال الخسارة', desc: 'احتمال تعرض كل مشترك لخسارة خلال السنة.' },
    { name: 'حجم الخسارة', desc: 'قيمة الخسارة الواحدة.' },
    { name: 'التحميل', desc: 'نسبة تضاف للقسط الصافي لتغطية المصاريف والهامش.' },
  ],
  rules: ['الأخطار مستقلة ومتشابهة.', 'كل مشترك يتعرض لخسارة واحدة على الأكثر سنويًا.', 'المحاكاة عشوائية قابلة للتكرار (بذرة محددة).'],
  predict: {
    question: 'إذا رفعت عدد المشتركين من 50 إلى 5,000 مع بقاء الاحتمال ثابتًا، ماذا يحدث لتذبذب عدد الخسائر حول المتوقع نسبيًا؟',
    options: ['يزداد', 'ينخفض بوضوح', 'يبقى كما هو'],
    answer: 1,
    reveal: 'قانون الأعداد الكبيرة: النتائج تقترب نسبيًا من المتوقع كلما زاد عدد الوحدات المستقلة.',
  },
  mistake: {
    mistake: 'الظن أن زيادة العدد تجعل خسارة كل فرد متوقعة.',
    correction: 'الذي يتحسن هو توقع نتائج المجموعة، أما الفرد فيبقى غير متأكد.',
  },
};

export function PoolingLab({ onComplete }: LabProps) {
  const init = { n: 200, p: 2, loss: 100000, loading: 25 };
  const [v, setV] = useState(init);
  const [seed, setSeed] = useState(2025);
  const set = (k: keyof typeof init) => (x: number) => setV((o) => ({ ...o, [k]: x }));
  const r = pooling({ members: v.n, probability: v.p / 100, loss: v.loss, loading: v.loading / 100 });
  const sims = useMemo(() => simulatePool(v.n, v.p / 100, 10, seed), [v.n, v.p, seed]);
  const avgDev = sims.reduce((s, c) => s + Math.abs(c - r.expectedClaims), 0) / sims.length;
  const relDev = r.expectedClaims > 0 ? (avgDev / r.expectedClaims) * 100 : 0;
  return (
    <LabShell
      meta={poolingMeta}
      onComplete={onComplete}
      onReset={() => {
        setV(init);
        setSeed(2025);
      }}
      controls={
        <>
          <NumberField label="عدد المشتركين" value={v.n} onChange={set('n')} min={10} max={10000} step={10} />
          <NumberField label="احتمال الخسارة" value={v.p} onChange={set('p')} min={0.5} max={30} step={0.5} suffix="%" />
          <NumberField label="حجم الخسارة" value={v.loss} onChange={set('loss')} min={1000} max={500000} step={1000} suffix="ريال" />
          <NumberField label="التحميل" value={v.loading} onChange={set('loading')} min={0} max={100} step={5} suffix="%" />
          <button type="button" className="btn btn-small" onClick={() => setSeed(newSeed())} data-nodrag>
            ⟳ محاكاة 10 سنوات جديدة
          </button>
        </>
      }
      results={
        <>
          <dl className="results">
            <div><dt>الخسائر المتوقعة (عددًا)</dt><dd><bdi dir="ltr">{fmt(r.expectedClaims)}</bdi></dd></div>
            <div><dt>المساهمة العادلة (القسط الصافي)</dt><dd><Money value={r.purePremium} /></dd></div>
            <div><dt>القسط الإجمالي بعد التحميل</dt><dd><Money value={r.grossPremium} /></dd></div>
            <div><dt>إجمالي الصندوق الصافي</dt><dd><Money value={r.fund} /></dd></div>
          </dl>
          <MiniBars values={sims} labels={sims.map((_, i) => `${i + 1}`)} reference={r.expectedClaims} referenceLabel={`المتوقع ${fmt(r.expectedClaims)}`} ariaLabel="عدد الخسائر الفعلية في كل سنة من المحاكاة مقارنة بالمتوقع" />
          <p className="small">متوسط الانحراف عن المتوقع في المحاكاة: <bdi dir="ltr">{fmt(relDev)}%</bdi></p>
        </>
      }
      interpretation={
        <p>
          كل مشترك يدفع <Money value={r.purePremium} /> صافيًا، فيتكوّن صندوق يكفي نظريًا للخسائر المتوقعة. مع {fmt(v.n)} مشترك ينحرف عدد الخسائر
          الفعلي عن المتوقع بنحو <bdi dir="ltr">{fmt(relDev)}%</bdi> في المتوسط.
          {v.n < 500 ? ' جرّب زيادة العدد لترى كيف تقل النسبة.' : ' لاحظ أن الانحراف النسبي صغير مع المجموعات الكبيرة.'}
        </p>
      }
    />
  );
}

/* ============================================================ Self-insurance */
export const selfInsuranceMeta: LabMeta = {
  id: 'self-insurance',
  title: 'مختبر التأمين الذاتي',
  chapterId: 'c1',
  objective: 'أن تقارن تكلفة الاحتفاظ المخطط عبر صندوق ذاتي بتكلفة شراء التأمين، وترى خطر الخسارة المبكرة.',
  variables: [
    { name: 'عدد السنوات', desc: 'مدة المقارنة.' },
    { name: 'احتمال الخسارة السنوي', desc: 'فرصة وقوع خسارة كبيرة في كل سنة.' },
    { name: 'حجم الخسارة', desc: 'قيمة الخسارة إن وقعت.' },
    { name: 'القسط البديل', desc: 'القسط السنوي لو اشترت المنشأة تأمينًا.' },
    { name: 'مساهمة الصندوق', desc: 'المبلغ السنوي المخصص للصندوق الذاتي.' },
  ],
  rules: ['خسارة واحدة على الأكثر سنويًا.', 'العجز يُموَّل من موارد أخرى ويُضاف إلى تكلفة الاحتفاظ.', 'لا يُحتسب عائد استثمار الصندوق للتبسيط.'],
  predict: {
    question: 'إذا وقعت خسارة كبيرة في السنة الأولى، ما المشكلة الرئيسية للتأمين الذاتي؟',
    options: ['الصندوق لم يتراكم بعد فيظهر عجز', 'ترتفع الأقساط المدفوعة', 'لا توجد مشكلة'],
    answer: 0,
    reveal: 'الصندوق يحتاج وقتًا ليتراكم؛ الخسارة المبكرة تولّد عجزًا يجب تمويله.',
  },
  mistake: {
    mistake: 'مقارنة متوسط الخسائر بالقسط فقط.',
    correction: 'يجب مراعاة التوقيت والتذبذب والقدرة على تمويل العجز.',
  },
};

export function SelfInsuranceLab({ onComplete }: LabProps) {
  const init = { years: 10, p: 15, sev: 400000, premium: 80000, contrib: 65000 };
  const [v, setV] = useState(init);
  const [seed, setSeed] = useState(7);
  const set = (k: keyof typeof init) => (x: number) => setV((o) => ({ ...o, [k]: x }));
  const r = selfInsurance({ years: v.years, probability: v.p / 100, severity: v.sev, premium: v.premium, fundContribution: v.contrib, seed });
  const last = r.timeline[r.timeline.length - 1];
  const cheaper = last.cumulativeRetainedCost < last.cumulativePremiums;
  return (
    <LabShell
      meta={selfInsuranceMeta}
      onComplete={onComplete}
      onReset={() => {
        setV(init);
        setSeed(7);
      }}
      controls={
        <>
          <NumberField label="عدد السنوات" value={v.years} onChange={set('years')} min={1} max={20} />
          <NumberField label="احتمال الخسارة السنوي" value={v.p} onChange={set('p')} min={0} max={60} suffix="%" />
          <NumberField label="حجم الخسارة" value={v.sev} onChange={set('sev')} min={0} max={2000000} step={10000} suffix="ريال" />
          <NumberField label="القسط البديل" value={v.premium} onChange={set('premium')} min={0} max={300000} step={1000} suffix="ريال" />
          <NumberField label="مساهمة الصندوق" value={v.contrib} onChange={set('contrib')} min={0} max={300000} step={1000} suffix="ريال" />
          <button type="button" className="btn btn-small" onClick={() => setSeed(newSeed())} data-nodrag>
            ⟳ سيناريو سنوات جديد
          </button>
        </>
      }
      results={
        <>
          <div className="scroll-x">
            <table className="tbl tbl-compact">
              <thead>
                <tr>
                  <th>السنة</th>
                  <th>الخسارة</th>
                  <th>رصيد الصندوق</th>
                  <th>العجز</th>
                </tr>
              </thead>
              <tbody>
                {r.timeline.map((t) => (
                  <tr key={t.year} className={t.shortfall > 0 ? 'row-bad' : ''}>
                    <td>{t.year}</td>
                    <td><bdi dir="ltr">{fmt(t.loss)}</bdi></td>
                    <td><bdi dir="ltr">{fmt(t.fundBalance)}</bdi></td>
                    <td><bdi dir="ltr">{fmt(t.shortfall)}</bdi></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="results">
            <div><dt>تكلفة الاحتفاظ التراكمية</dt><dd><Money value={last.cumulativeRetainedCost} /></dd></div>
            <div><dt>الأقساط التراكمية لو أمّنت</dt><dd><Money value={last.cumulativePremiums} /></dd></div>
            <div><dt>أكبر عجز سنوي</dt><dd className={r.maxShortfall > 0 ? 'bad' : ''}><Money value={r.maxShortfall} /></dd></div>
          </dl>
        </>
      }
      interpretation={
        <p>
          في هذا السيناريو كان التأمين الذاتي {cheaper ? 'أقل' : 'أعلى'} تكلفة من شراء التأمين. {r.maxShortfall > 0 ? 'لكن ظهر عجز في سنة واحدة على الأقل يجب تمويله من موارد أخرى — وهذا هو الخطر الحقيقي للاحتفاظ.' : 'ولم يظهر عجز لأن الصندوق كان كافيًا عند وقوع الخسائر.'} غيّر السيناريو عدة مرات لترى تأثير التوقيت.
        </p>
      }
    />
  );
}

/* ============================================================ Co-insurance */
export const coinsuranceMeta: LabMeta = {
  id: 'coinsurance',
  title: 'مختبر المشاركة في التأمين',
  chapterId: 'c1',
  objective: 'أن توزع خسارة على مؤمِّنين مشاركين وفق حصصهم، وتلاحظ أن كل مشارك ملتزم بحصته فقط.',
  variables: [
    { name: 'الخسارة المغطاة', desc: 'قيمة الخسارة المستحقة وفق الوثيقة.' },
    { name: 'حصة كل مؤمِّن', desc: 'النسبة المتفق عليها مسبقًا من الخطر.' },
  ],
  rules: ['مجموع الحصص يجب أن يساوي 100% لتغطية الخطر كاملًا.', 'لا يضمن أي مشارك حصة غيره في هذا المثال.'],
  predict: {
    question: 'إذا تعثر أحد المؤمِّنين المشاركين، هل يدفع المؤمِّن القائد حصته تلقائيًا؟',
    options: ['نعم دائمًا', 'لا، ما لم يُتفق على ذلك'],
    answer: 1,
    reveal: 'التزام كل مشارك محصور بحصته؛ القائد ينسق ولا يضمن.',
  },
  mistake: {
    mistake: 'اعتبار المشاركة في التأمين هي نفسها التأمين المزدوج.',
    correction: 'المشاركة ترتيب مقصود بنسب مسبقة؛ المزدوج وثائق مستقلة متداخلة تُسوّى بقواعد المشاركة في التعويض.',
  },
};

export function CoInsuranceLab({ onComplete }: LabProps) {
  const init = { loss: 2400000, a: 45, b: 35, c: 20 };
  const [v, setV] = useState(init);
  const [failed, setFailed] = useState<'none' | 'c'>('none');
  const set = (k: keyof typeof init) => (x: number) => setV((o) => ({ ...o, [k]: x }));
  const insurers = [
    { name: 'المؤمِّن القائد (أ)', share: v.a },
    { name: 'المؤمِّن ب', share: v.b },
    { name: 'المؤمِّن ج', share: v.c },
  ];
  const split = coInsuranceSplit(v.loss, insurers);
  const total = totalShare(insurers);
  const paid = split.reduce((s, x, i) => s + (failed === 'c' && i === 2 ? 0 : x.amount), 0);
  return (
    <LabShell
      meta={coinsuranceMeta}
      onComplete={onComplete}
      onReset={() => {
        setV(init);
        setFailed('none');
      }}
      controls={
        <>
          <NumberField label="الخسارة المغطاة" value={v.loss} onChange={set('loss')} min={0} max={10000000} step={50000} suffix="ريال" />
          <NumberField label="حصة المؤمِّن القائد (أ)" value={v.a} onChange={set('a')} min={0} max={100} suffix="%" />
          <NumberField label="حصة المؤمِّن ب" value={v.b} onChange={set('b')} min={0} max={100} suffix="%" />
          <NumberField label="حصة المؤمِّن ج" value={v.c} onChange={set('c')} min={0} max={100} suffix="%" />
          <Segmented
            label="حالة المؤمِّن ج"
            value={failed}
            onChange={setFailed}
            options={[
              { value: 'none', label: 'جميع المشاركين يدفعون' },
              { value: 'c', label: 'تعثّر المؤمِّن ج' },
            ]}
          />
        </>
      }
      results={
        <>
          {total !== 100 && <p className="warn-note">مجموع الحصص {fmt(total)}% — يجب أن يساوي 100% لتغطية الخطر كاملًا.</p>}
          <SplitBar
            ariaLabel="توزيع الخسارة بين المؤمِّنين"
            parts={split.map((s, i) => ({ label: s.name + (failed === 'c' && i === 2 ? ' (متعثر)' : ''), value: s.amount, color: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'][i] }))}
          />
          <dl className="results">
            <div><dt>المحصّل فعليًا للمؤمَّن له</dt><dd><Money value={paid} /></dd></div>
            <div><dt>غير المحصّل</dt><dd className={v.loss - paid > 0 ? 'bad' : ''}><Money value={Math.max(0, v.loss - paid)} /></dd></div>
          </dl>
        </>
      }
      interpretation={
        <p>
          كل مؤمِّن يدفع حصته المتفق عليها فقط. {failed === 'c' ? 'عند تعثر المؤمِّن ج لا تنتقل حصته تلقائيًا إلى القائد أو إلى ب، فيبقى للمؤمَّن له حق المطالبة تجاه ج نفسه.' : 'جرّب حالة تعثر أحد المشاركين لترى أثر الالتزام الفردي.'}
        </p>
      }
    />
  );
}
