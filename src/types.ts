export type ChipType = 'B200' | 'B300' | 'GB300' | 'H100' | 'H200' | 'MI350X';

export type Phase = 'INSTALL' | 'BURN_IN' | 'LIVE';

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
  installationMonth: number; // 0-based month index
  installationYear: number;
  siteId: string;
  dateAnnounced: string; // ISO date string
  fundingType: FundingType;
  leaseType: LeaseType;
  residualCap?: number; // percentage, only for leases
  leaseTerm?: number; // months, only for leases
  apr?: number; // percentage, only for leases
  phases: {
    installation: {
      duration: number; // months
      costPerUnit: number;
    };
    burnIn: {
      duration: number; // months
      costPerUnit: number;
    };
    live: {
      revenuePerUnit: number; // monthly
    };
  };
}

export interface MonthData {
  month: number;
  year: number;
  phase: Phase | null;
  value: number;
}
