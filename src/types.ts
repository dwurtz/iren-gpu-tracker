export type ChipType = 'B200' | 'B300' | 'GB300' | 'GB200 NVL72' | 'GB300 NVL72' | 'H100' | 'H200' | 'MI350X';

export interface Site {
  id: string;
  name: string;
  location: string;
  capacityMW: number;
  status: 'operating' | 'under-construction' | 'secured';
}

export type FundingType = 'Cash' | 'Lease';
export type LeaseType = 'FMV' | null;

export interface Batch {
  id: string;
  name: string;
  chipType: ChipType;
  quantity: number;
  installationMonth: number; // 0-based month index (first month of deployment)
  installationYear: number;
  siteId: string;
  dateAnnounced: string; // ISO date string
  deliveryDate: string; // ISO date string - first month with >=1% deployed
  fundingType: FundingType;
  leaseType: LeaseType;
  residualCap?: number; // percentage, only for leases
  leaseTerm?: number; // months, only for leases
  apr?: number; // percentage, only for leases
  deploymentSchedule: { [monthIndex: number]: number }; // monthIndex -> percentage deployed (0-100)
}

export interface MonthData {
  month: number;
  year: number;
  percentDeployed: number; // 0-100, cumulative percentage of batch deployed by this month
  value: number; // cumulative profit
}
