/**
 * Re-derives the keyed answer of every numeric question from the calculation engine, so a typo in an
 * answer key or an engine regression fails the build. Each entry: question id -> numbers the keyed option must contain.
 */
import { questionById } from '../../src/content';
import { average, coInsuranceSplit, contributionBySumInsured, contributionIndependent, indemnity, pooling, reinsuranceSplit, riskTransfer, selfInsurance, subrogation } from '../../src/engine/calc';

const n = (x: number) => new Intl.NumberFormat('en-US').format(Math.round(x));
const ind = (rc: number, dep: number, si: number, excess = 0, salvage = 0) =>
  indemnity({ replacementCost: rc, depreciationPercent: dep, basis: dep ? 'indemnity' : 'reinstatement', sumInsured: si, excess, salvage }).payout;

const EXPECT: Record<string, number[]> = {
  // total retained by the insured in the year = premium + excess
  'c1-l5-s1': [(() => { const r = riskTransfer({ wealth: 200000, probability: 1, severity: 200000, premium: 6000, excess: 5000 }); return 200000 - r.insured.withLoss; })()],
  'c1-l5-s2': [5 * 3000 + 2500, 5 * 4000 + 500],
  'c1-l5-s3': [ind(1200000, 0, 1000000, 10000)],
  'c1-l5-s5': [riskTransfer({ wealth: 500000, probability: 0.1, severity: 200000, premium: 8000, excess: 2000 }).insured.range],
  'c1-l6-m2': [pooling({ members: 1000, probability: 0.01, loss: 100000, loading: 0 }).purePremium],
  'c1-l6-m4': [pooling({ members: 5000, probability: 0.04, loss: 1, loading: 0 }).expectedClaims],
  'c1-l6-s1': [pooling({ members: 2000, probability: 0.03, loss: 15000, loading: 0.2 }).grossPremium],
  'c1-l6-s5': [pooling({ members: 800, probability: 0.05, loss: 20000, loading: 0 }).fund, pooling({ members: 800, probability: 0.05, loss: 20000, loading: 0 }).expectedClaims * 20000],
  'c1-l7-s1': [selfInsurance({ years: 1, probability: 1, severity: 700000, premium: 380000, fundContribution: 300000, seed: 1 }).maxShortfall],
  'c1-l7-s3': [1000000, 6000000 - 1000000],
  'c1-l8-m3': [coInsuranceSplit(500000, [{ name: 'x', share: 30 }])[0].amount],
  'c1-l8-s1': coInsuranceSplit(2400000, [{ name: 'a', share: 45 }, { name: 'b', share: 35 }]).map((x) => x.amount),
  'c2-l3-m3': [reinsuranceSplit({ loss: 2000000, method: 'quota', cededPercent: 30, retention: 0, limit: 0 }).reinsurer],
  'c2-l3-s1': (() => { const r = reinsuranceSplit({ loss: 6000000, method: 'xol', cededPercent: 0, retention: 1000000, limit: 4000000 }); return [r.reinsurer, r.insurerNet]; })(),
  'c2-l3-s4': [200000 * 0.4, reinsuranceSplit({ loss: 500000, method: 'quota', cededPercent: 40, retention: 0, limit: 0 }).reinsurer],
  'c7-l3-m5': [ind(50000, 40, 40000, 2000)],
  'c7-l3-s2': [ind(40000, 30, 35000, 1000, 2000)],
  'c7-l3-s3': [200000 + 30000],
  'c7-l4-m5': [300000],
  'c7-l4-s1': [average({ sumInsured: 500000, valueAtRisk: 5000000, loss: 300000, averageApplies: false, excess: 0 }).payout],
  'c7-l4-s2': [average({ sumInsured: 100000, valueAtRisk: 200000, loss: 40000, averageApplies: true, excess: 0 }).payout],
  'c7-l5-m5': [Math.min(5000, 2000)],
  'c7-l5-s1': [average({ sumInsured: 600000, valueAtRisk: 1000000, loss: 200000, averageApplies: true, excess: 0 }).payout],
  'c7-l5-s3': [average({ sumInsured: 300000, valueAtRisk: 400000, loss: 100000, averageApplies: true, excess: 5000 }).payout],
  'c8-l3-m1': [contributionBySumInsured(8000, [{ name: 'a', sumInsured: 30000 }, { name: 'b', sumInsured: 10000 }])[0].share],
  'c8-l3-m3': contributionIndependent(6000, [{ name: 'a', sumInsured: 10000 }, { name: 'b', sumInsured: 20000 }]).map((s) => s.share),
  'c8-l3-m5': [contributionIndependent(15000, [{ name: 'a', sumInsured: 10000 }, { name: 'b', sumInsured: 20000 }])[1].share],
  'c8-l3-s1': [contributionBySumInsured(40000, [{ name: 'a', sumInsured: 20000 }, { name: 'b', sumInsured: 30000 }, { name: 'c', sumInsured: 50000 }])[2].share],
  'c8-l3-s2': contributionIndependent(8000, [{ name: 'a', sumInsured: 5000 }, { name: 'b', sumInsured: 15000 }]).map((s) => s.share),
  'c8-l4-s3': (() => { const r = subrogation({ totalLoss: 50000, excess: 5000, sumInsured: 1e9, recovery: 50000, available: true }); return [r.toInsurer, r.toInsured]; })(),
  'c8-l5-s3': [150000 - 12000],
};

describe('numeric answer keys match the calculation engine', () => {
  it.each(Object.entries(EXPECT))('%s', (id, values) => {
    const q = questionById.get(id);
    expect(q, `question ${id} exists`).toBeDefined();
    const keyed = q!.options[q!.answer];
    for (const v of values) expect(keyed, `${id}: keyed option should contain ${n(v)}`).toContain(n(v));
    // single-number answers: no distractor may show the same number (multi-number distractors may reuse
    // the same figures with a wrong conclusion, which is a legitimate distractor)
    if (values.length === 1) {
      const others = q!.options.filter((_, i) => i !== q!.answer);
      expect(others.some((o) => o.includes(n(values[0])))).toBe(false);
    }
  });
});
