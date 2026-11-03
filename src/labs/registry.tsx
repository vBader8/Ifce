import type { ComponentType } from 'react';
import type { LabMeta, LabProps } from './LabShell';
import { RiskMatrixLab, riskMatrixMeta, RiskTransferLab, riskTransferMeta, PoolingLab, poolingMeta, SelfInsuranceLab, selfInsuranceMeta, CoInsuranceLab, coinsuranceMeta } from './RiskLabs';
import { InsurabilityLab, insurabilityMeta, ReinsuranceLab, reinsuranceMeta, IndemnityLab, indemnityMeta, AverageLab, averageMeta, ContributionLab, contributionMeta, SubrogationLab, subrogationMeta } from './PrincipleLabs';
import { ProximateCauseLab, proximateMeta, ContractLab, contractMeta, RegulationMapLab, regulationMeta } from './ScenarioLabs';
import { makeClassifierLab, type ClassifierData } from './ClassifierLab';
import { benefitsData, distributionData, indemnityModsData, insurerTypesData, interestData, marketRolesData, riskCategoriesData, riskComponentsData, subrogationCasesData, techData } from './classifierData';

export interface LabEntry {
  meta: LabMeta;
  Component: ComponentType<LabProps>;
  featured: boolean;
}

const cls = (d: ClassifierData): LabEntry => ({ meta: d.meta, Component: makeClassifierLab(d), featured: false });

export const LABS: Record<string, LabEntry> = {
  'risk-matrix': { meta: riskMatrixMeta, Component: RiskMatrixLab, featured: true },
  'risk-transfer': { meta: riskTransferMeta, Component: RiskTransferLab, featured: true },
  pooling: { meta: poolingMeta, Component: PoolingLab, featured: true },
  'self-insurance': { meta: selfInsuranceMeta, Component: SelfInsuranceLab, featured: true },
  coinsurance: { meta: coinsuranceMeta, Component: CoInsuranceLab, featured: true },
  'insurability-check': { meta: insurabilityMeta, Component: InsurabilityLab, featured: true },
  reinsurance: { meta: reinsuranceMeta, Component: ReinsuranceLab, featured: true },
  contract: { meta: contractMeta, Component: ContractLab, featured: true },
  'proximate-cause': { meta: proximateMeta, Component: ProximateCauseLab, featured: true },
  indemnity: { meta: indemnityMeta, Component: IndemnityLab, featured: true },
  average: { meta: averageMeta, Component: AverageLab, featured: true },
  contribution: { meta: contributionMeta, Component: ContributionLab, featured: true },
  subrogation: { meta: subrogationMeta, Component: SubrogationLab, featured: true },
  'regulation-map': { meta: regulationMeta, Component: RegulationMapLab, featured: true },
  'classify-risk-categories': cls(riskCategoriesData),
  'classify-risk-components': cls(riskComponentsData),
  'classify-benefits': cls(benefitsData),
  'classify-subrogation': cls(subrogationCasesData),
  'classify-indemnity-mods': cls(indemnityModsData),
  'classify-insurable-interest': cls(interestData),
  'classify-market-roles': cls(marketRolesData),
  'classify-insurer-types': cls(insurerTypesData),
  'classify-distribution': cls(distributionData),
  'classify-tech': cls(techData),
};
