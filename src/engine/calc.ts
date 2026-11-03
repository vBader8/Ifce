/**
 * Pure insurance calculations used by the labs.
 * Every function documents the simplified rule it applies; the labs show the same rule to the learner.
 * Real policies may apply different wording – the labs state "according to the rules of this example".
 */
import { mulberry32 } from './random';

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const nonNeg = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* ------------------------------------------------------------------ Risk & transfer */

export interface RiskTransferInput {
  wealth: number; // financial position before the year
  probability: number; // 0..1 probability of a loss in the year
  severity: number; // amount of loss if it happens
  premium: number; // annual premium paid if insured
  excess: number; // amount retained by the insured on each claim (deductible)
}

export interface RiskTransferResult {
  expectedLoss: number;
  uninsured: { noLoss: number; withLoss: number; expected: number; range: number };
  insured: { noLoss: number; withLoss: number; expected: number; range: number };
  /** Part of the loss shifted to the insurer when the loss happens. */
  transferred: number;
  retained: number;
}

export function riskTransfer(i: RiskTransferInput): RiskTransferResult {
  const p = clamp(i.probability, 0, 1);
  const sev = nonNeg(i.severity);
  const excess = Math.min(nonNeg(i.excess), sev);
  const premium = nonNeg(i.premium);
  const w = i.wealth;
  const retained = excess;
  const transferred = sev - excess;
  const unNo = w;
  const unLoss = w - sev;
  const inNo = w - premium;
  const inLoss = w - premium - retained;
  return {
    expectedLoss: round2(p * sev),
    uninsured: { noLoss: round2(unNo), withLoss: round2(unLoss), expected: round2(w - p * sev), range: round2(unNo - unLoss) },
    insured: {
      noLoss: round2(inNo),
      withLoss: round2(inLoss),
      expected: round2(w - premium - p * retained),
      range: round2(inNo - inLoss),
    },
    transferred: round2(transferred),
    retained: round2(retained),
  };
}

/* ------------------------------------------------------------------ Pooling */

export interface PoolingInput {
  members: number;
  probability: number;
  loss: number;
  /** Expense + margin loading as a fraction of the pure premium, e.g. 0.25 */
  loading: number;
}

export interface PoolingResult {
  expectedClaims: number; // number of claims expected in the pool
  purePremium: number; // fair contribution per member
  grossPremium: number;
  fund: number; // total contributions (pure) collected
  /** Standard deviation of the claims cost per member – shrinks as the pool grows. */
  perMemberStdDev: number;
  /** Coefficient of variation of the total claims – a measure of unpredictability. */
  relativeVolatility: number;
}

export function pooling(i: PoolingInput): PoolingResult {
  const n = Math.max(1, Math.floor(i.members));
  const p = clamp(i.probability, 0, 1);
  const L = nonNeg(i.loss);
  const pure = p * L;
  const sdPerMember = L * Math.sqrt((p * (1 - p)) / n);
  return {
    expectedClaims: round2(n * p),
    purePremium: round2(pure),
    grossPremium: round2(pure * (1 + nonNeg(i.loading))),
    fund: round2(pure * n),
    perMemberStdDev: round2(sdPerMember),
    relativeVolatility: p > 0 ? round2(Math.sqrt((1 - p) / (n * p))) : 0,
  };
}

/** Simulate a number of years for a pool; returns the claims count per year (binomial draws). */
export function simulatePool(members: number, probability: number, years: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const n = Math.max(1, Math.floor(members));
  const out: number[] = [];
  for (let y = 0; y < years; y++) {
    let c = 0;
    for (let k = 0; k < n; k++) if (rand() < probability) c++;
    out.push(c);
  }
  return out;
}

/* ------------------------------------------------------------------ Self-insurance */

export interface SelfInsuranceInput {
  years: number;
  probability: number; // probability of a loss in each year
  severity: number;
  premium: number; // annual premium if insured instead
  fundContribution: number; // annual amount set aside in a self-insurance fund
  seed: number;
}

export interface SelfInsuranceYear {
  year: number;
  loss: number;
  fundBalance: number; // after paying the loss
  cumulativeRetainedCost: number; // contributions + any shortfall paid from other resources
  cumulativePremiums: number;
  shortfall: number; // uncovered amount this year (fund could not pay)
}

export function selfInsurance(i: SelfInsuranceInput): { timeline: SelfInsuranceYear[]; totalLosses: number; maxShortfall: number } {
  const rand = mulberry32(i.seed);
  let balance = 0;
  let cumRet = 0;
  let cumPrem = 0;
  let total = 0;
  let maxShort = 0;
  const timeline: SelfInsuranceYear[] = [];
  for (let y = 1; y <= Math.max(1, Math.floor(i.years)); y++) {
    const loss = rand() < clamp(i.probability, 0, 1) ? nonNeg(i.severity) : 0;
    total += loss;
    balance += nonNeg(i.fundContribution);
    cumRet += nonNeg(i.fundContribution);
    let shortfall = 0;
    if (loss > balance) {
      shortfall = loss - balance;
      cumRet += shortfall;
      balance = 0;
    } else balance -= loss;
    maxShort = Math.max(maxShort, shortfall);
    cumPrem += nonNeg(i.premium);
    timeline.push({
      year: y,
      loss: round2(loss),
      fundBalance: round2(balance),
      cumulativeRetainedCost: round2(cumRet),
      cumulativePremiums: round2(cumPrem),
      shortfall: round2(shortfall),
    });
  }
  return { timeline, totalLosses: round2(total), maxShortfall: round2(maxShort) };
}

/* ------------------------------------------------------------------ Co-insurance (market sharing) */

export interface CoInsurer {
  name: string;
  share: number; // percent of the risk accepted
}

export function coInsuranceSplit(loss: number, insurers: CoInsurer[]): { name: string; amount: number }[] {
  const L = nonNeg(loss);
  return insurers.map((c) => ({ name: c.name, amount: round2((L * nonNeg(c.share)) / 100) }));
}

export function totalShare(insurers: CoInsurer[]): number {
  return round2(insurers.reduce((s, c) => s + nonNeg(c.share), 0));
}

/* ------------------------------------------------------------------ Reinsurance */

export interface ReinsuranceInput {
  loss: number;
  /** quota share: percentage of every risk/loss ceded to the reinsurer */
  method: 'quota' | 'xol';
  cededPercent: number;
  /** excess of loss: insurer retains up to `retention`, reinsurer pays above it up to `limit` */
  retention: number;
  limit: number;
}

export interface ReinsuranceResult {
  insurerNet: number;
  reinsurer: number;
  /** For excess of loss: the part above retention + limit falling back on the insurer. */
  aboveLimit: number;
}

export function reinsuranceSplit(i: ReinsuranceInput): ReinsuranceResult {
  const L = nonNeg(i.loss);
  if (i.method === 'quota') {
    const pct = clamp(i.cededPercent, 0, 100) / 100;
    const re = L * pct;
    return { insurerNet: round2(L - re), reinsurer: round2(re), aboveLimit: 0 };
  }
  const ret = nonNeg(i.retention);
  const lim = nonNeg(i.limit);
  const layer = Math.min(Math.max(L - ret, 0), lim);
  const above = Math.max(L - ret - lim, 0);
  return { insurerNet: round2(L - layer), reinsurer: round2(layer), aboveLimit: round2(above) };
}

/* ------------------------------------------------------------------ Indemnity */

export interface IndemnityInput {
  /** Cost to replace/repair as new */
  replacementCost: number;
  /** Wear and tear / depreciation percentage deducted under the indemnity basis */
  depreciationPercent: number;
  basis: 'indemnity' | 'reinstatement';
  sumInsured: number;
  excess: number;
  /** Value of salvage retained by the insured (deducted from the claim) */
  salvage: number;
}

export interface IndemnityResult {
  measuredLoss: number;
  afterSalvage: number;
  afterExcess: number;
  payout: number;
  cappedBySumInsured: boolean;
  steps: { label: string; value: number }[];
}

/** Order in this example: measure loss -> deduct salvage -> deduct excess -> cap at sum insured. */
export function indemnity(i: IndemnityInput): IndemnityResult {
  const rc = nonNeg(i.replacementCost);
  const dep = clamp(i.depreciationPercent, 0, 100) / 100;
  const measured = i.basis === 'indemnity' ? rc * (1 - dep) : rc;
  const afterSalvage = Math.max(measured - nonNeg(i.salvage), 0);
  const afterExcess = Math.max(afterSalvage - nonNeg(i.excess), 0);
  const si = nonNeg(i.sumInsured);
  const payout = Math.min(afterExcess, si);
  return {
    measuredLoss: round2(measured),
    afterSalvage: round2(afterSalvage),
    afterExcess: round2(afterExcess),
    payout: round2(payout),
    cappedBySumInsured: afterExcess > si,
    steps: [
      { label: 'الخسارة المقيسة', value: round2(measured) },
      { label: 'بعد خصم الحطام (السالفج)', value: round2(afterSalvage) },
      { label: 'بعد خصم التحمل', value: round2(afterExcess) },
      { label: 'التعويض بعد حد مبلغ التأمين', value: round2(payout) },
    ],
  };
}

/* ------------------------------------------------------------------ Average (pro-rata under-insurance) */

export interface AverageInput {
  sumInsured: number;
  valueAtRisk: number; // full value of the property at the time of loss
  loss: number;
  averageApplies: boolean;
  excess: number;
}

export interface AverageResult {
  underInsured: boolean;
  ratio: number; // SI / value (capped at 1)
  afterAverage: number;
  payout: number;
  insuredBears: number;
}

/** Order in this example: apply average to the loss -> deduct excess -> cap at sum insured. */
export function average(i: AverageInput): AverageResult {
  const si = nonNeg(i.sumInsured);
  const v = nonNeg(i.valueAtRisk);
  const L = Math.min(nonNeg(i.loss), v || nonNeg(i.loss));
  const under = v > 0 && si < v;
  const ratio = under ? si / v : 1;
  const afterAvg = i.averageApplies ? L * ratio : L;
  const payout = Math.min(Math.max(afterAvg - nonNeg(i.excess), 0), si);
  return {
    underInsured: under,
    ratio: round2(ratio * 10000) / 10000,
    afterAverage: round2(afterAvg),
    payout: round2(payout),
    insuredBears: round2(L - payout),
  };
}

/* ------------------------------------------------------------------ Contribution */

export interface ContributionPolicy {
  name: string;
  sumInsured: number;
}

export interface ContributionShare {
  name: string;
  /** Liability had this policy been the only one (independent liability). */
  independentLiability: number;
  share: number;
}

/**
 * Rateable proportion by sum insured ("maximum liability" method): share = loss × SI / ΣSI.
 * Total payable is capped at the total of all sums insured.
 */
export function contributionBySumInsured(loss: number, policies: ContributionPolicy[]): ContributionShare[] {
  const L = Math.min(nonNeg(loss), policies.reduce((s, p) => s + nonNeg(p.sumInsured), 0));
  const total = policies.reduce((s, p) => s + nonNeg(p.sumInsured), 0);
  return policies.map((p) => ({
    name: p.name,
    independentLiability: round2(Math.min(nonNeg(loss), nonNeg(p.sumInsured))),
    share: total > 0 ? round2((L * nonNeg(p.sumInsured)) / total) : 0,
  }));
}

/**
 * Independent liability method: each insurer's liability is first calculated as if it were the only insurer
 * (here: min(loss, sum insured)); the loss is then shared in proportion to those liabilities.
 */
export function contributionIndependent(loss: number, policies: ContributionPolicy[]): ContributionShare[] {
  const L0 = nonNeg(loss);
  const ils = policies.map((p) => Math.min(L0, nonNeg(p.sumInsured)));
  const totalIL = ils.reduce((a, b) => a + b, 0);
  const payable = Math.min(L0, totalIL);
  return policies.map((p, k) => ({
    name: p.name,
    independentLiability: round2(ils[k]),
    share: totalIL > 0 ? round2((payable * ils[k]) / totalIL) : 0,
  }));
}

/* ------------------------------------------------------------------ Subrogation */

export interface SubrogationInput {
  totalLoss: number;
  excess: number;
  sumInsured: number;
  /** Amount actually recovered from the responsible third party */
  recovery: number;
  /** Whether subrogation is available in this case (e.g. not against the insured itself) */
  available: boolean;
}

export interface SubrogationResult {
  insurerPaid: number;
  insuredUninsured: number;
  toInsurer: number;
  toInsured: number;
  insurerNetCost: number;
}

/**
 * Simplified rule used in this example's policy wording: the insurer may keep recoveries up to the amount it has paid;
 * any surplus belongs to the insured. (Allocation of partial recoveries between the insurer and the insured's
 * uninsured losses can differ by law and wording – flagged in the scientific review log.)
 */
export function subrogation(i: SubrogationInput): SubrogationResult {
  const L = nonNeg(i.totalLoss);
  const paid = Math.min(Math.max(L - nonNeg(i.excess), 0), nonNeg(i.sumInsured));
  const uninsured = L - paid;
  const rec = i.available ? Math.min(nonNeg(i.recovery), L) : 0;
  const toInsurer = Math.min(rec, paid);
  const toInsured = rec - toInsurer;
  return {
    insurerPaid: round2(paid),
    insuredUninsured: round2(uninsured),
    toInsurer: round2(toInsurer),
    toInsured: round2(toInsured),
    insurerNetCost: round2(paid - toInsurer),
  };
}

export const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);
