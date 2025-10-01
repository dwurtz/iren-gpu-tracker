export type ChipType = 'B200' | 'GB300' | 'H100';

export type Phase = 'INSTALLATION' | 'BURN_IN' | 'LIVE';

export interface Site {
  id: string;
  name: string;
  location: string;
  capacityMW: number;
  status: 'operating' | 'under-construction' | 'secured';
}

export interface Batch {
  id: string;
  name: string;
  chipType: ChipType;
  quantity: number;
  installationMonth: number; // 0-based month index
  installationYear: number;
  siteId: string;
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
