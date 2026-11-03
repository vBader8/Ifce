import { average, coInsuranceSplit, contributionBySumInsured, contributionIndependent, indemnity, pooling, reinsuranceSplit, riskTransfer, selfInsurance, simulatePool, subrogation, totalShare } from '../src/engine/calc';

describe('risk transfer', () => {
  it('computes outcomes with and without insurance', () => {
    const r = riskTransfer({ wealth: 500000, probability: 0.1, severity: 200000, premium: 8000, excess: 2000 });
    expect(r.uninsured.range).toBe(200000);
    expect(r.insured.noLoss).toBe(492000);
    expect(r.insured.withLoss).toBe(490000);
    expect(r.insured.range).toBe(2000);
    expect(r.transferred).toBe(198000);
    expect(r.expectedLoss).toBe(20000);
  });
  it('caps excess at the loss size', () => {
    const r = riskTransfer({ wealth: 100, probability: 1, severity: 50, premium: 0, excess: 80 });
    expect(r.retained).toBe(50);
    expect(r.transferred).toBe(0);
  });
});

describe('pooling', () => {
  it('matches the 1,000 homes example', () => {
    const r = pooling({ members: 1000, probability: 0.01, loss: 200000, loading: 0 });
    expect(r.expectedClaims).toBe(10);
    expect(r.purePremium).toBe(2000);
    expect(r.fund).toBe(2000000);
  });
  it('applies loading', () => {
    expect(pooling({ members: 2000, probability: 0.03, loss: 15000, loading: 0.2 }).grossPremium).toBe(540);
  });
  it('volatility per member halves when members are multiplied by four', () => {
    const a = pooling({ members: 100, probability: 0.05, loss: 10000, loading: 0 }).perMemberStdDev;
    const b = pooling({ members: 400, probability: 0.05, loss: 10000, loading: 0 }).perMemberStdDev;
    expect(b).toBeCloseTo(a / 2, 1);
  });
  it('simulation is deterministic per seed and within bounds', () => {
    const a = simulatePool(500, 0.02, 10, 42);
    expect(a).toEqual(simulatePool(500, 0.02, 10, 42));
    expect(a.every((c) => c >= 0 && c <= 500)).toBe(true);
  });
});

describe('self insurance', () => {
  it('records a shortfall when a loss exceeds the fund', () => {
    const r = selfInsurance({ years: 1, probability: 1, severity: 700000, premium: 380000, fundContribution: 300000, seed: 1 });
    expect(r.timeline[0].shortfall).toBe(400000);
    expect(r.maxShortfall).toBe(400000);
    expect(r.timeline[0].cumulativeRetainedCost).toBe(700000);
  });
  it('accumulates the fund when there are no losses', () => {
    const r = selfInsurance({ years: 3, probability: 0, severity: 100, premium: 50, fundContribution: 40, seed: 1 });
    expect(r.timeline[2].fundBalance).toBe(120);
    expect(r.timeline[2].cumulativePremiums).toBe(150);
  });
});

describe('co-insurance', () => {
  it('splits by share', () => {
    const s = coInsuranceSplit(2400000, [{ name: 'a', share: 45 }, { name: 'b', share: 35 }, { name: 'c', share: 20 }]);
    expect(s.map((x) => x.amount)).toEqual([1080000, 840000, 480000]);
    expect(totalShare([{ name: 'a', share: 45 }, { name: 'b', share: 35 }])).toBe(80);
  });
});

describe('reinsurance', () => {
  it('quota share cedes a fixed percentage', () => {
    expect(reinsuranceSplit({ loss: 1000000, method: 'quota', cededPercent: 40, retention: 0, limit: 0 })).toEqual({ insurerNet: 600000, reinsurer: 400000, aboveLimit: 0 });
  });
  it('excess of loss pays nothing below retention', () => {
    expect(reinsuranceSplit({ loss: 600000, method: 'xol', cededPercent: 0, retention: 1000000, limit: 4000000 }).reinsurer).toBe(0);
  });
  it('excess of loss pays the layer and returns above-limit to the insurer', () => {
    const r = reinsuranceSplit({ loss: 6000000, method: 'xol', cededPercent: 0, retention: 1000000, limit: 4000000 });
    expect(r.reinsurer).toBe(4000000);
    expect(r.aboveLimit).toBe(1000000);
    expect(r.insurerNet).toBe(2000000);
  });
});

describe('indemnity', () => {
  it('deducts depreciation, salvage, excess and caps at sum insured', () => {
    const r = indemnity({ replacementCost: 40000, depreciationPercent: 30, basis: 'indemnity', sumInsured: 35000, excess: 1000, salvage: 2000 });
    expect(r.measuredLoss).toBe(28000);
    expect(r.afterSalvage).toBe(26000);
    expect(r.payout).toBe(25000);
    expect(r.cappedBySumInsured).toBe(false);
  });
  it('reinstatement basis ignores depreciation and can be capped', () => {
    const r = indemnity({ replacementCost: 40000, depreciationPercent: 30, basis: 'reinstatement', sumInsured: 35000, excess: 1000, salvage: 2000 });
    expect(r.measuredLoss).toBe(40000);
    expect(r.payout).toBe(35000);
    expect(r.cappedBySumInsured).toBe(true);
  });
});

describe('average', () => {
  it('applies pro-rata average when under-insured', () => {
    const r = average({ sumInsured: 600000, valueAtRisk: 1000000, loss: 200000, averageApplies: true, excess: 0 });
    expect(r.payout).toBe(120000);
    expect(r.insuredBears).toBe(80000);
    expect(r.underInsured).toBe(true);
  });
  it('pays in full (up to SI) when average does not apply', () => {
    expect(average({ sumInsured: 600000, valueAtRisk: 1000000, loss: 200000, averageApplies: false, excess: 0 }).payout).toBe(200000);
  });
  it('has no effect when adequately insured', () => {
    expect(average({ sumInsured: 1000000, valueAtRisk: 900000, loss: 300000, averageApplies: true, excess: 5000 }).payout).toBe(295000);
  });
  it('never pays more than the sum insured', () => {
    expect(average({ sumInsured: 600000, valueAtRisk: 1000000, loss: 1000000, averageApplies: false, excess: 0 }).payout).toBe(600000);
  });
});

describe('contribution', () => {
  const policies = [{ name: 'A', sumInsured: 10000 }, { name: 'B', sumInsured: 20000 }];
  it('by sum insured', () => {
    expect(contributionBySumInsured(6000, policies).map((s) => s.share)).toEqual([2000, 4000]);
  });
  it('independent liability', () => {
    expect(contributionIndependent(6000, policies).map((s) => s.share)).toEqual([3000, 3000]);
  });
  it('independent liability when the loss exceeds a smaller policy', () => {
    const r = contributionIndependent(15000, policies);
    expect(r.map((s) => s.independentLiability)).toEqual([10000, 15000]);
    expect(r.map((s) => s.share)).toEqual([6000, 9000]);
    expect(r.reduce((a, b) => a + b.share, 0)).toBe(15000);
  });
  it('total payable never exceeds the loss or total cover', () => {
    const r = contributionBySumInsured(50000, policies);
    expect(r.reduce((a, b) => a + b.share, 0)).toBe(30000);
  });
});

describe('subrogation', () => {
  it('insurer recovers up to what it paid; surplus to insured', () => {
    const r = subrogation({ totalLoss: 50000, excess: 5000, sumInsured: 100000, recovery: 50000, available: true });
    expect(r.insurerPaid).toBe(45000);
    expect(r.toInsurer).toBe(45000);
    expect(r.toInsured).toBe(5000);
    expect(r.insurerNetCost).toBe(0);
  });
  it('no recovery when subrogation is unavailable', () => {
    const r = subrogation({ totalLoss: 50000, excess: 5000, sumInsured: 100000, recovery: 30000, available: false });
    expect(r.toInsurer).toBe(0);
    expect(r.insurerNetCost).toBe(45000);
  });
});
