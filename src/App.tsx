import React, { useState, useEffect } from 'react';
import { Plus, Settings, RotateCcw, Info } from 'lucide-react';
import { Batch, Site, ChipType, LeaseType } from './types';
import { NewBatchModal } from './components/NewBatchModal';
import { BatchRow } from './components/BatchRow';
import { SettingsModal, ProfitabilitySettings } from './components/SettingsModal';
import { EditBatchModal } from './components/EditBatchModal';
import { SiteEditorModal } from './components/SiteEditorModal';
import ARRModal from './components/ARRModal';
import { WelcomeModal } from './components/WelcomeModal';
import { ModalBackdrop } from './components/ModalBackdrop';
import { calculateMonthlyData, calculateTotals } from './utils/calculations';

// Extended timeline: Aug 2023 to Dec 2029 (77 months total)
const MONTHS = [
  "Aug '23", "Sep '23", "Oct '23", "Nov '23", "Dec '23", // 2023 (5 months)
  "Jan '24", "Feb '24", "Mar '24", "Apr '24", "May '24", "Jun '24", "Jul '24", "Aug '24", "Sep '24", "Oct '24", "Nov '24", "Dec '24", // 2024 (12 months)
  "Jan '25", "Feb '25", "Mar '25", "Apr '25", "May '25", "Jun '25", "Jul '25", "Aug '25", "Sep '25", "Oct '25", "Nov '25", "Dec '25", // 2025 (12 months)
  "Jan '26", "Feb '26", "Mar '26", "Apr '26", "May '26", "Jun '26", "Jul '26", "Aug '26", "Sep '26", "Oct '26", "Nov '26", "Dec '26", // 2026 (12 months)
  "Jan '27", "Feb '27", "Mar '27", "Apr '27", "May '27", "Jun '27", "Jul '27", "Aug '27", "Sep '27", "Oct '27", "Nov '27", "Dec '27", // 2027 (12 months)
  "Jan '28", "Feb '28", "Mar '28", "Apr '28", "May '28", "Jun '28", "Jul '28", "Aug '28", "Sep '28", "Oct '28", "Nov '28", "Dec '28", // 2028 (12 months)
  "Jan '29", "Feb '29", "Mar '29", "Apr '29", "May '29", "Jun '29", "Jul '29", "Aug '29", "Sep '29", "Oct '29", "Nov '29", "Dec '29" // 2029 (12 months)
];
// const YEARS = [
//   2025, 2025, 2025, 2025, // 2025
//   2026, 2026, 2026, 2026, 2026, 2026, 2026, 2026, 2026, 2026, 2026, 2026, // 2026
//   2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, 2027, // 2027
//   2028, 2028, 2028, 2028, 2028, 2028, 2028, 2028, 2028, 2028, 2028, 2028, // 2028
//   2029, 2029, 2029, 2029, 2029, 2029, 2029, 2029 // 2029
// ];

// Default profitability settings
const defaultSettings: ProfitabilitySettings = {
  gpusPerMW: {
    b200: 532, // 500-550 GPUs/MW (~1.8-2.0 kW/GPU) - good
    b300: 520, // 500-540 GPUs/MW (~1.85-2.0 kW/GPU) - good for planning
    gb300: 432, // 420-460 GPUs/MW (~2.17-2.38 kW/GPU) - right in the pocket
    h100: 620, // 600-650 GPUs/MW (~1.5-1.65 kW/GPU) - bumped from 500
    h200: 580, // 560-610 GPUs/MW (~1.64-1.8 kW/GPU) - bumped from 485
    mi350x: 475, // 460-500 GPUs/MW (~2.0-2.17 kW/GPU) - fine
  },
  upfrontGpuCost: {
    b200: 46233, // Principal cost per GPU
    b300: 58674, // Principal cost per GPU
    gb300: 80000, // Principal cost per GPU
    h100: 39216, // Principal cost per GPU
    h200: 40648, // Principal cost per GPU
    mi350x: 43637, // Principal cost per GPU
  },
  effectiveGpuCost: {
    b200: 52927, // Effective cost per GPU including financing
    b300: 66061, // Effective cost per GPU including financing
    gb300: 87715, // Effective cost per GPU including financing
    h100: 39216, // Effective cost per GPU (cash purchase, no interest)
    h200: 40648, // Effective cost per GPU (cash purchase, no interest)
    mi350x: 49955, // Effective cost per GPU including financing
  },
  installationCost: {
    b200: 20, // per GPU
    b300: 20, // per GPU
    gb300: 20, // per GPU
    h100: 20, // per GPU
    h200: 20, // per GPU
    mi350x: 20, // per GPU
  },
  gpuHourRate: {
    b200: 3.08, // $3.08 per GPU hour (2yr-payback rate)
    b300: 3.85, // $3.85 per GPU hour (2yr-payback rate)
    gb300: 5.11, // $5.11 per GPU hour (2yr-payback rate)
    h100: 2.28, // $2.28 per GPU hour (2yr-payback rate)
    h200: 2.37, // $2.37 per GPU hour (2yr-payback rate)
    mi350x: 2.91, // $2.91 per GPU hour (2yr-payback rate)
  },
  electricityCost: 0.0325, // per kWh
  datacenterOverhead: 150, // per GPU per month
  electricalOverhead: 1.5, // PUE multiplier
  utilizationRate: 100, // 100% utilization
};

// No longer need calculateProfitability - costs/revenue are now calculated based on deployment %

// Default sites based on IREN public filings
const createDefaultSites = (): Site[] => {
  return [
    { id: 'site-canal-flats', name: 'Canal Flats', location: 'British Columbia', capacityMW: 30, status: 'operating' },
    { id: 'site-prince-george', name: 'Prince George', location: 'British Columbia', capacityMW: 50, status: 'operating' },
    { id: 'site-mackenzie', name: 'Mackenzie', location: 'British Columbia', capacityMW: 80, status: 'operating' },
    { id: 'site-childress', name: 'Childress', location: 'Texas', capacityMW: 750, status: 'under-construction' },
    { id: 'site-sweetwater-1', name: 'Sweetwater 1', location: 'West Texas (Nolan County)', capacityMW: 1400, status: 'secured' },
    { id: 'site-sweetwater-2', name: 'Sweetwater 2', location: 'West Texas', capacityMW: 600, status: 'secured' },
  ];
};

// Storage utilities for batches and sites
const BATCHES_STORAGE_KEY = 'iren-energization-batches';
const SITES_STORAGE_KEY = 'iren-sites';

const saveBatchesToStorage = (batches: Batch[]) => {
  try {
    localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(batches));
  } catch (error) {
    console.error('Failed to save batches to storage:', error);
  }
};

const loadBatchesFromStorage = (): Batch[] | null => {
  try {
    const stored = localStorage.getItem(BATCHES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load batches from storage:', error);
    return null;
  }
};

const saveSitesToStorage = (sites: Site[]) => {
  try {
    localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites));
  } catch (error) {
    console.error('Failed to save sites to storage:', error);
  }
};

const loadSitesFromStorage = (): Site[] | null => {
  try {
    const stored = localStorage.getItem(SITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load sites from storage:', error);
    return null;
  }
};

// Create default batch configuration (only used for initial setup)
const createDefaultBatches = (settings: ProfitabilitySettings, sites: Site[]): Batch[] => {
  const batches: Batch[] = [];
  
  // Default batches based on provided data - PR Date is used as announcement date
  const defaultBatchConfig = [
    { dateAnnounced: '2023-08-29', month: 7, year: 2023, quantity: 248, chipType: 'H100' as ChipType, siteId: 'site-prince-george', fundingType: 'Cash' as const, leaseType: null, residualCap: undefined, leaseTerm: undefined, apr: undefined },
    { dateAnnounced: '2024-02-14', month: 1, year: 2024, quantity: 568, chipType: 'H100' as ChipType, siteId: 'site-prince-george', fundingType: 'Cash' as const, leaseType: null, residualCap: undefined, leaseTerm: undefined, apr: undefined },
    { dateAnnounced: '2024-09-16', month: 8, year: 2024, quantity: 1080, chipType: 'H200' as ChipType, siteId: 'site-prince-george', fundingType: 'Cash' as const, leaseType: null, residualCap: undefined, leaseTerm: undefined, apr: undefined },
    { dateAnnounced: '2025-07-03', month: 6, year: 2025, quantity: 1300, chipType: 'B200' as ChipType, siteId: 'site-prince-george', fundingType: 'Lease' as const, leaseType: 'FMV', residualCap: 20, leaseTerm: 36, apr: 9 },
    { dateAnnounced: '2025-07-03', month: 6, year: 2025, quantity: 1100, chipType: 'B300' as ChipType, siteId: 'site-prince-george', fundingType: 'Lease' as const, leaseType: 'FMV', residualCap: 20, leaseTerm: 36, apr: 9 },
    { dateAnnounced: '2025-08-25', month: 7, year: 2025, quantity: 4200, chipType: 'B200' as ChipType, siteId: 'site-prince-george', fundingType: 'Lease' as const, leaseType: 'FMV', residualCap: 20, leaseTerm: 36, apr: 9 },
    { dateAnnounced: '2025-08-28', month: 7, year: 2025, quantity: 1200, chipType: 'B300' as ChipType, siteId: 'site-prince-george', fundingType: 'Cash' as const, leaseType: null, residualCap: undefined, leaseTerm: undefined, apr: undefined },
    { dateAnnounced: '2025-09-22', month: 8, year: 2025, quantity: 4200, chipType: 'B200' as ChipType, siteId: 'site-prince-george', fundingType: 'Lease' as const, leaseType: 'FMV', residualCap: 20, leaseTerm: 36, apr: 9 },
    { dateAnnounced: '2025-09-22', month: 8, year: 2025, quantity: 1100, chipType: 'MI350X' as ChipType, siteId: 'site-prince-george', fundingType: 'Lease' as const, leaseType: 'FMV', residualCap: 20, leaseTerm: 36, apr: 9 },
    { dateAnnounced: '2025-09-22', month: 8, year: 2025, quantity: 7100, chipType: 'B300' as ChipType, siteId: 'site-prince-george', fundingType: 'Lease' as const, leaseType: 'FMV', residualCap: 20, leaseTerm: 36, apr: 9 },
    { dateAnnounced: '2025-08-28', month: 9, year: 2025, quantity: 1200, chipType: 'GB300' as ChipType, siteId: 'site-prince-george', fundingType: 'Lease' as const, leaseType: 'FMV', residualCap: 20, leaseTerm: 24, apr: 9 },
  ];
  
  defaultBatchConfig.forEach((config, index) => {
    const chipKey = config.chipType.toLowerCase() as 'b200' | 'b300' | 'gb300' | 'h100' | 'h200' | 'mi350x';
    const gpusPerMW = settings.gpusPerMW[chipKey];
    const mwEquivalent = (config.quantity / gpusPerMW).toFixed(2);
    const site = sites.find(s => s.id === config.siteId);
    const siteName = site ? site.name : '';
    
    // Create deployment schedule based on batch-specific rollout
    // MONTHS array starts at Aug 2023 (index 0), so we need to offset
    // Aug 2023 = index 0, Sep 2023 = index 1, etc.
    const startIndex = (config.year - 2023) * 12 + (config.month - 7);
    let deploymentSchedule: { [monthIndex: number]: number } = {};
    
    // Custom deployment schedules based on latest screenshot
    if (config.quantity === 4200 && config.chipType === 'B200' && config.month === 7) {
      // First 4,200 B200s: 20%, 30%, 55%, 70%, 85%, 100%
      deploymentSchedule = {
        [startIndex + 1]: 20,  // Sep '25
        [startIndex + 2]: 10,  // Oct '25 (20+10=30%)
        [startIndex + 3]: 25,  // Nov '25 (30+25=55%)
        [startIndex + 4]: 15,  // Dec '25 (55+15=70%)
        [startIndex + 5]: 15,  // Jan '26 (70+15=85%)
        [startIndex + 6]: 15,  // Feb '26 (85+15=100%)
      };
    } else if (config.quantity === 1200 && config.chipType === 'GB300') {
      // 1,200 GB300s: 25%, 25%, 50%, 75%, 100%
      deploymentSchedule = {
        [startIndex]: 25,      // Oct '25
        [startIndex + 1]: 0,   // Nov '25 (25+0=25%)
        [startIndex + 2]: 25,  // Dec '25 (25+25=50%)
        [startIndex + 3]: 25,  // Jan '26 (50+25=75%)
        [startIndex + 4]: 25,  // Feb '26 (75+25=100%)
      };
    } else if (config.quantity === 4200 && config.chipType === 'B200' && config.month === 8) {
      // Second 4,200 B200s: 10%, 15%, 25%, 35%, 55%, 75%, 100%
      deploymentSchedule = {
        [startIndex + 2]: 10,  // Nov '25
        [startIndex + 3]: 5,   // Dec '25 (10+5=15%)
        [startIndex + 4]: 10,  // Jan '26 (15+10=25%)
        [startIndex + 5]: 10,  // Feb '26 (25+10=35%)
        [startIndex + 6]: 20,  // Mar '26 (35+20=55%)
        [startIndex + 7]: 20,  // Apr '26 (55+20=75%)
        [startIndex + 8]: 25,  // May '26 (75+25=100%)
      };
    } else if (config.quantity === 1200 && config.chipType === 'B300') {
      // 1,200 B300s: 50%, 75%, 100%
      deploymentSchedule = {
        [startIndex + 5]: 50,  // Jan '26
        [startIndex + 6]: 25,  // Feb '26 (50+25=75%)
        [startIndex + 7]: 25,  // Mar '26 (75+25=100%)
      };
    } else if (config.quantity === 1100 && config.chipType === 'MI350X') {
      // 1,100 MI350Xs: 25%, 50%, 75%, 100%
      deploymentSchedule = {
        [startIndex + 5]: 25,  // Jan '26
        [startIndex + 6]: 25,  // Feb '26 (25+25=50%)
        [startIndex + 7]: 25,  // Mar '26 (50+25=75%)
        [startIndex + 8]: 25,  // Apr '26 (75+25=100%)
      };
    } else if (config.quantity === 7100 && config.chipType === 'B300') {
      // 7,100 B300s: 25%, 50%, 75%, 100%
      deploymentSchedule = {
        [startIndex + 5]: 25,  // Jan '26
        [startIndex + 6]: 25,  // Feb '26 (25+25=50%)
        [startIndex + 7]: 25,  // Mar '26 (50+25=75%)
        [startIndex + 8]: 25,  // Apr '26 (75+25=100%)
      };
    } else {
      // Default deployment for other batches: immediate 4-month rollout (100%)
      deploymentSchedule = {
        [startIndex]: 25,
        [startIndex + 1]: 25,
        [startIndex + 2]: 25,
        [startIndex + 3]: 25,
      };
    }
    
    // Calculate delivery date and actual installation start - first month with at least 1% deployed
    let deliveryDate = config.dateAnnounced; // Default to announcement date
    let actualInstallMonth = config.month;
    let actualInstallYear = config.year;
    let cumulativePercent = 0;
    const sortedMonths = Object.keys(deploymentSchedule).map(Number).sort((a, b) => a - b);
    
    for (const monthIdx of sortedMonths) {
      cumulativePercent += deploymentSchedule[monthIdx];
      if (cumulativePercent >= 1) {
        // Convert month index back to year/month
        // monthIdx is relative to Aug 2023 (index 0)
        const totalMonths = monthIdx + 7; // Add 7 to account for Aug being month 7
        const deliveryYear = 2023 + Math.floor(totalMonths / 12);
        const deliveryMonth = totalMonths % 12;
        deliveryDate = `${deliveryYear}-${String(deliveryMonth + 1).padStart(2, '0')}-01`;
        
        // Set installation start to match first deployment month (to avoid interest before delivery)
        actualInstallYear = deliveryYear;
        actualInstallMonth = deliveryMonth;
        break;
      }
    }
    
    batches.push({
      id: `batch-${index}`,
      name: `${config.quantity.toLocaleString()} ${config.chipType}s\n(${mwEquivalent}MW${siteName ? ` • ${siteName}` : ''})`,
      chipType: config.chipType,
      quantity: config.quantity,
      installationMonth: actualInstallMonth,
      installationYear: actualInstallYear,
      siteId: config.siteId,
      dateAnnounced: config.dateAnnounced,
      deliveryDate,
      fundingType: config.fundingType,
      leaseType: config.leaseType as LeaseType,
      residualCap: config.residualCap,
      leaseTerm: config.leaseTerm,
      apr: config.apr,
      deploymentSchedule,
    });
  });
  
  return batches;
};

// Migrate old batches to new format (add deploymentSchedule and deliveryDate if missing)
const migrateBatch = (batch: any): Batch => {
  // Remove phases if they exist
  const { phases, ...batchWithoutPhases } = batch;
  
  // Only create deployment schedule if it's missing
  if (!batch.deploymentSchedule || Object.keys(batch.deploymentSchedule).length === 0) {
    console.log('Migrating batch without deployment schedule:', batch.name);
    const startIndex = (batch.installationYear - 2023) * 12 + (batch.installationMonth - 7);
    const deploymentSchedule: { [monthIndex: number]: number } = {
      [startIndex]: 25,
      [startIndex + 1]: 25,
      [startIndex + 2]: 25,
      [startIndex + 3]: 25,
    };
    
    // Calculate delivery date for migrated batch
    const totalMonths = startIndex + 7;
    const deliveryYear = 2023 + Math.floor(totalMonths / 12);
    const deliveryMonth = totalMonths % 12;
    const deliveryDate = `${deliveryYear}-${String(deliveryMonth + 1).padStart(2, '0')}-01`;
    
    return {
      ...batchWithoutPhases,
      deploymentSchedule,
      deliveryDate: deliveryDate || batch.dateAnnounced,
    } as Batch;
  }
  
  // Calculate delivery date if missing
  if (!batch.deliveryDate) {
    let deliveryDate = batch.dateAnnounced;
    let cumulativePercent = 0;
    const sortedMonths = Object.keys(batch.deploymentSchedule).map(Number).sort((a, b) => a - b);
    
    for (const monthIdx of sortedMonths) {
      cumulativePercent += batch.deploymentSchedule[monthIdx];
      if (cumulativePercent >= 1) {
        const totalMonths = monthIdx + 7;
        const deliveryYear = 2023 + Math.floor(totalMonths / 12);
        const deliveryMonth = totalMonths % 12;
        deliveryDate = `${deliveryYear}-${String(deliveryMonth + 1).padStart(2, '0')}-01`;
        break;
      }
    }
    
    return {
      ...batchWithoutPhases,
      deliveryDate,
    } as Batch;
  }
  
  // Batch already has deployment schedule and delivery date, preserve it
  return batchWithoutPhases as Batch;
};

// Batch configuration version - increment this when default batches change
const BATCH_CONFIG_VERSION = 10;

// Initialize batches from storage or create defaults
const initializeBatches = (settings: ProfitabilitySettings, sites: Site[]): Batch[] => {
  const storedVersion = localStorage.getItem('batchConfigVersion');
  const storedBatches = loadBatchesFromStorage();
  
  // If version has changed, ignore stored batches and use defaults
  if (storedVersion !== String(BATCH_CONFIG_VERSION)) {
    console.log('Batch configuration version changed, loading new defaults');
    localStorage.setItem('batchConfigVersion', String(BATCH_CONFIG_VERSION));
    const defaultBatches = createDefaultBatches(settings, sites);
    saveBatchesToStorage(defaultBatches);
    return defaultBatches;
  }
  
  if (storedBatches && storedBatches.length > 0) {
    console.log('Loaded batches from storage:', storedBatches.length);
    // Migrate old batches if needed
    const migratedBatches = storedBatches.map(migrateBatch);
    // Save migrated batches back to storage
    saveBatchesToStorage(migratedBatches);
    return migratedBatches;
  }
  
  console.log('Creating default batch configuration');
  localStorage.setItem('batchConfigVersion', String(BATCH_CONFIG_VERSION));
  const defaultBatches = createDefaultBatches(settings, sites);
  saveBatchesToStorage(defaultBatches);
  return defaultBatches;
};

function App() {
  const [settings, setSettings] = useState<ProfitabilitySettings>(defaultSettings);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  
  // Initialize sites and batches on component mount
  React.useEffect(() => {
    const storedSites = loadSitesFromStorage();
    const sitesToUse = storedSites && storedSites.length > 0 ? storedSites : createDefaultSites();
    if (!storedSites || storedSites.length === 0) {
      saveSitesToStorage(sitesToUse);
    }
    setSites(sitesToUse);
    setBatches(initializeBatches(defaultSettings, sitesToUse));
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [highlightField, setHighlightField] = useState<string | undefined>(undefined);
  const [highlightBatchField, setHighlightBatchField] = useState<string | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ batchId: string; monthIndex: number } | null>(null);
  const [isARRModalOpen, setIsARRModalOpen] = useState(false);
  const [selectedARRMonth, setSelectedARRMonth] = useState<number | null>(null);
  const [isSiteEditorOpen, setIsSiteEditorOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize based on actual window width
    return typeof window !== 'undefined' && window.innerWidth < 550;
  });
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    // Check if user has seen the welcome modal before
    return !localStorage.getItem('welcomeModalSeen');
  });

  // Check screen size for mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const shouldBeMobile = width < 550;
      console.log('Window width:', width, 'isMobile:', shouldBeMobile);
      setIsMobile(shouldBeMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle arrow key navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedCell) return;
      
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        
        const currentBatchIndex = batches.findIndex(b => b.id === selectedCell.batchId);
        if (currentBatchIndex === -1) return;
        
        const currentBatch = batches[currentBatchIndex];
        const batchData = calculateMonthlyData(currentBatch, 7, 2023, 77, settings);
        
        let newMonthIndex = selectedCell.monthIndex;
        
        // Calculate batch start index
        const batchStartIndex = (currentBatch.installationYear - 2023) * 12 + (currentBatch.installationMonth - 7);
        
        if (event.key === 'ArrowLeft') {
          // Move left, find previous valid cell (after batch start)
          for (let i = selectedCell.monthIndex - 1; i >= batchStartIndex; i--) {
            if (batchData[i]) {
              newMonthIndex = i;
              break;
            }
          }
        } else if (event.key === 'ArrowRight') {
          // Move right, find next valid cell (after batch start)
          for (let i = selectedCell.monthIndex + 1; i < batchData.length; i++) {
            if (batchData[i] && i >= batchStartIndex) {
              newMonthIndex = i;
              break;
            }
          }
        }
        
        if (newMonthIndex !== selectedCell.monthIndex) {
          setSelectedCell({
            batchId: selectedCell.batchId,
            monthIndex: newMonthIndex
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, batches]);

  const handleAddBatch = (batchData: Omit<Batch, 'id'>) => {
    const newBatch: Batch = {
      ...batchData,
      id: Date.now().toString(),
    };
    const updatedBatches = [...batches, newBatch];
    setBatches(updatedBatches);
    saveBatchesToStorage(updatedBatches);
  };

  const handleEditBatch = (batch: Batch, field?: string) => {
    setEditingBatch(batch);
    setHighlightBatchField(field);
    setIsEditModalOpen(true);
  };

  const handleSaveEditBatch = (updatedBatch: Batch) => {
    const updatedBatches = batches.map(batch => 
      batch.id === updatedBatch.id ? updatedBatch : batch
    );
    setBatches(updatedBatches);
    saveBatchesToStorage(updatedBatches);
    setEditingBatch(null);
  };

  const handleDeleteBatch = (batchId: string) => {
    const updatedBatches = batches.filter(batch => batch.id !== batchId);
    setBatches(updatedBatches);
    saveBatchesToStorage(updatedBatches);
  };

  const handleUpdateDeployment = (batchId: string, monthIndex: number, percentage: number) => {
    const updatedBatches = batches.map(batch => {
      if (batch.id === batchId) {
        // Calculate cumulative deployment before this month
        const previousCumulative = Object.entries(batch.deploymentSchedule)
          .filter(([idx]) => parseInt(idx) < monthIndex)
          .reduce((sum, [, pct]) => sum + pct, 0);
        
        // Constraints:
        // 1. Can't go below 0% total (previousCumulative + thisMonth >= 0)
        // 2. Can't exceed 100% total (previousCumulative + thisMonth <= 100)
        const minAllowed = -previousCumulative; // This ensures cumulative stays >= 0
        const maxAllowed = 100 - previousCumulative; // Max we can add this month
        const clampedPercentage = Math.max(minAllowed, Math.min(percentage, maxAllowed));
        
        // Calculate what the new cumulative total will be after this update
        const newCumulativeTotal = previousCumulative + clampedPercentage;
        
        // Update the deployment schedule
        const updatedSchedule = { ...batch.deploymentSchedule };
        updatedSchedule[monthIndex] = clampedPercentage;
        
        // If we've reached 100%, clear all future deployments
        // Otherwise, adjust future deployments proportionally if needed
        if (newCumulativeTotal >= 100) {
          // Clear all future months
          Object.keys(updatedSchedule).forEach(key => {
            const keyNum = parseInt(key);
            if (keyNum > monthIndex) {
              delete updatedSchedule[keyNum];
            }
          });
        } else {
          // Calculate remaining deployment capacity
          const remainingCapacity = 100 - newCumulativeTotal;
          
          // Get future months and their current percentages
          const futureMonths = Object.entries(updatedSchedule)
            .filter(([idx]) => parseInt(idx) > monthIndex)
            .sort(([a], [b]) => parseInt(a) - parseInt(b));
          
          if (futureMonths.length > 0) {
            const futureTotal = futureMonths.reduce((sum, [, pct]) => sum + pct, 0);
            
            // If future deployments exceed remaining capacity, scale them down proportionally
            if (futureTotal > remainingCapacity) {
              const scaleFactor = remainingCapacity / futureTotal;
              futureMonths.forEach(([idx, pct]) => {
                updatedSchedule[parseInt(idx)] = pct * scaleFactor;
              });
            }
          }
        }
        
        return {
          ...batch,
          deploymentSchedule: updatedSchedule
        };
      }
      return batch;
    });
    
    setBatches(updatedBatches);
    saveBatchesToStorage(updatedBatches);
  };

  const handleWelcomeClose = () => {
    localStorage.setItem('welcomeModalSeen', 'true');
    setIsWelcomeOpen(false);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all batches and settings to default values? This will delete all current batches and reset all profitability settings.')) {
      // Reset settings to defaults
      setSettings(defaultSettings);
      
      // Reset batches to defaults
      const defaultBatches = createDefaultBatches(defaultSettings, sites);
      setBatches(defaultBatches);
      saveBatchesToStorage(defaultBatches);
      localStorage.setItem('batchConfigVersion', String(BATCH_CONFIG_VERSION));
    }
  };

  const handleEditSite = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (site) {
      setEditingSite(site);
      setIsSiteEditorOpen(true);
    }
  };

  const handleSaveSite = (updatedSite: Site) => {
    const updatedSites = sites.map(site =>
      site.id === updatedSite.id ? updatedSite : site
    );
    setSites(updatedSites);
    saveSitesToStorage(updatedSites);
    setEditingSite(null);
  };

  const handleSaveSettings = (newSettings: ProfitabilitySettings) => {
    setSettings(newSettings);
    // Note: Batches are now persistent data, settings changes don't regenerate them
    // Users can modify individual batches as needed
  };

  const handleOpenSettings = (field?: string) => {
    setHighlightField(field);
    setIsSettingsOpen(true);
  };

  // Calculate data for all batches
  const allBatchData = batches.map(batch => 
    calculateMonthlyData(batch, 7, 2023, 77, settings) // Aug 2023 to Dec 2029
  );
  
  const totals = calculateTotals(allBatchData);
  const grandTotal = totals.length > 0 ? totals[totals.length - 1].value : 0;

  // Calculate global min/max values for consistent color scaling
  const globalMinValue = Math.min(
    ...allBatchData.flat().map(data => data.value).filter(value => value !== 0)
  );
  const globalMaxValue = Math.max(
    ...allBatchData.flat().map(data => data.value).filter(value => value !== 0)
  );

  // Calculate ARR (Annual Recurring Revenue) for each month
  const calculateARR = () => {
    try {
      const arrData: { value: number }[] = [];
      const totalMonths = 77; // Aug 2023 to Dec 2029
      
      for (let monthIndex = 0; monthIndex < totalMonths; monthIndex++) {
        let totalARR = 0;
        
        // Calculate ARR for each batch based on its deployed percentage
        batches.forEach((batch, batchIndex) => {
          const batchData = allBatchData[batchIndex];
          if (batchData && batchData[monthIndex]) {
            const percentDeployed = batchData[monthIndex].percentDeployed;
            
            // Only count deployed GPUs
            if (percentDeployed > 0) {
              const deployedGpuCount = (percentDeployed / 100) * (batch.quantity || 0);
              
              // Use chip-specific rates
              const hoursPerMonth = 730;
              const utilizationRate = settings.utilizationRate / 100;
              const chipKey = batch.chipType.toLowerCase() as 'b200' | 'b300' | 'gb300' | 'h100' | 'h200' | 'mi350x';
              const gpuHourRate = settings.gpuHourRate[chipKey];
              const monthlyRevenuePerGPU = hoursPerMonth * utilizationRate * gpuHourRate;
              const annualRevenue = deployedGpuCount * monthlyRevenuePerGPU * 12;
              
              totalARR += annualRevenue;
            }
          }
        });
        
        arrData.push({ value: totalARR || 0 });
      }
      
      return arrData;
    } catch (error) {
      console.error('Error calculating ARR:', error);
      // Return empty array with 77 zero values as fallback
      return Array.from({ length: 77 }, () => ({ value: 0 }));
    }
  };

  const arrData = calculateARR();

  // Calculate live chip count for each month
  const calculateLiveChipCount = () => {
    const liveChipData: { value: number }[] = [];
    const totalMonths = 77; // Aug 2023 to Dec 2029
    
    for (let monthIndex = 0; monthIndex < totalMonths; monthIndex++) {
      let totalLiveChips = 0;
      
      // Sum up deployed GPUs from all batches
      batches.forEach((batch, batchIndex) => {
        const batchData = allBatchData[batchIndex];
        if (batchData && batchData[monthIndex]) {
          const percentDeployed = batchData[monthIndex].percentDeployed;
          if (percentDeployed > 0) {
            const deployedGpuCount = (percentDeployed / 100) * (batch.quantity || 0);
            totalLiveChips += deployedGpuCount;
          }
        }
      });
      
      liveChipData.push({ value: totalLiveChips });
    }
    
    return liveChipData;
  };

  const liveChipData = calculateLiveChipCount();

  // Format numbers with K for thousands, M for millions, B for billions
  const formatValue = (value: number) => {
    if (value === 0) return '';
    const sign = value < 0 ? '-' : '';
    const absValue = Math.abs(value);
    
    if (absValue >= 1000000000) {
      const billions = absValue / 1000000000;
      return `${sign}$${billions.toFixed(2)}B`;
    } else if (absValue >= 1000000) {
      const millions = absValue / 1000000;
      return `${sign}$${millions.toFixed(1)}M`;
    } else {
      const thousands = absValue / 1000;
      return `${sign}$${thousands.toFixed(1)}K`;
    }
  };

  // Format chip count (full numbers with commas, no dollar sign)
  const formatChipCount = (value: number) => {
    if (value === 0) return '';
    return Math.round(value).toLocaleString();
  };

  return (
    <>
      <ModalBackdrop />
      {/* Mobile/Small Screen Warning - Only for phones (< 550px) */}
      {isMobile ? (
        <div className="fixed inset-0 bg-white z-[10000] flex flex-col items-center justify-center p-8 text-center">
          <img src="https://iren.com/icons/logo.svg" alt="IREN" className="h-16 mb-6" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">GPU Tracker</h1>
          <p className="text-gray-600 text-lg mb-2">This app does not support mobile screen sizes.</p>
          <p className="text-gray-600 text-lg">Please view on a larger screen.</p>
        </div>
      ) : (
      <div className="h-screen bg-gray-100 flex flex-col">
      {/* Fixed Header */}
      <div className="flex justify-between items-center px-6 py-3 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img src="https://iren.com/icons/logo.svg" alt="IREN" className="h-8" />
          <h1 className="text-xl font-semibold text-gray-700">GPU Tracker</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
          >
            <RotateCcw size={16} />
            <span className="text-sm font-medium">RESET</span>
          </button>
          <button
            onClick={() => setIsWelcomeOpen(true)}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
          >
            <Info size={16} />
            <span className="text-sm font-medium">ABOUT</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
          >
            <Settings size={16} />
            <span className="text-sm font-medium">SETTINGS</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-green-400 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">NEW BATCH</span>
          </button>
        </div>
      </div>

      {/* Matrix Table Container */}
      <div className="flex-1 bg-white overflow-hidden relative">
        <div className="h-full w-full overflow-auto">
          <table className="w-full" style={{ minHeight: '100%', display: 'table', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead className="sticky top-0 z-40" style={{ display: 'table-header-group' }}>
                {/* Year headers */}
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50 z-50 border-r border-b border-gray-200" style={{ minWidth: '240px', width: '240px' }}></th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-r border-b border-gray-200" colSpan={5}>2023</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-r border-b border-gray-200" colSpan={12}>2024</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-r border-b border-gray-200" colSpan={12}>2025</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-r border-b border-gray-200" colSpan={12}>2026</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-r border-b border-gray-200" colSpan={12}>2027</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-r border-b border-gray-200" colSpan={12}>2028</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-r border-b border-gray-200" colSpan={12}>2029</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-24 sticky right-0 bg-gray-50 z-50 border-l border-b border-gray-200"></th>
                </tr>
                {/* Month headers */}
                <tr className="bg-white">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 sticky left-0 bg-white z-50 border-b border-gray-200" style={{ minWidth: '240px', width: '240px' }}></th>
                  {MONTHS.map((month, index) => {
                    // Add heavier border at year boundaries (after Dec, which is at indices 3, 15, 27, 39)
                    const isYearBoundary = index === 3 || index === 15 || index === 27 || index === 39 || index === 51;
                    const isFirstMonth = index === 0;
                    return (
                      <th key={index} className={`px-2 py-3 text-center text-xs font-medium text-gray-600 bg-white border-b border-gray-200 ${isFirstMonth ? 'border-l border-gray-200' : ''} ${isYearBoundary ? 'border-r-2 border-gray-200' : 'border-r border-gray-200'}`} style={{ minWidth: '80px' }}>
                        {month}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide w-24 sticky right-0 bg-white z-50 border-l border-b border-gray-200">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody style={{ display: 'table-row-group' }}>
                {(() => {
                  const rows: JSX.Element[] = [];
                  
                  // Sort batches by installation date (year, then month)
                  const sortedBatches = [...batches].sort((a, b) => {
                    if (a.installationYear !== b.installationYear) {
                      return a.installationYear - b.installationYear;
                    }
                    return a.installationMonth - b.installationMonth;
                  });
                  
                  let currentYear: number | null = null;
                  
                  sortedBatches.forEach((batch) => {
                    // Find the original index for accessing allBatchData
                    const batchIndex = batches.findIndex(b => b.id === batch.id);
                    
                    // Check if this is the first batch of a new year
                    const isFirstOfYear = currentYear !== batch.installationYear;
                    if (isFirstOfYear) {
                      currentYear = batch.installationYear;
                    }
                    
                    // Add the batch row
                    rows.push(
                      <BatchRow
                        key={batch.id}
                        batch={batch}
                        monthlyData={allBatchData[batchIndex] || []}
                        isFirstOfYear={isFirstOfYear}
                        onEdit={handleEditBatch}
                        onDelete={handleDeleteBatch}
                        onEditSite={handleEditSite}
                        selectedCell={selectedCell}
                        onCellSelect={(batchId, monthIndex) => setSelectedCell({ batchId, monthIndex })}
                        onClearSelection={() => setSelectedCell(null)}
                        globalMinValue={globalMinValue}
                        globalMaxValue={globalMaxValue}
                        settings={settings}
                        onOpenSettings={handleOpenSettings}
                        onUpdateDeployment={handleUpdateDeployment}
                      />
                    );
                  });
                  
                  return rows;
                })()}
              </tbody>
              
              
              {/* Sticky bottom total rows */}
              <tfoot className="sticky bottom-0 z-40" style={{ display: 'table-footer-group' }}>
                {batches.length > 0 && (
                  <>
                    {/* Live Chip Count row */}
                    <tr className="bg-white font-medium">
                      <td className="px-4 py-3 text-gray-700 text-xs font-semibold uppercase tracking-wide sticky left-0 bg-white z-50 border-r border-t-8 border-t-white border-b border-gray-200">LIVE CHIP COUNT</td>
                      {liveChipData.map((data, index) => {
                        const isYearBoundary = index === 4 || index === 16 || index === 28 || index === 40 || index === 52 || index === 64;
                        const isFirstMonth = index === 0;
                        const previousValue = index > 0 ? liveChipData[index - 1]?.value || 0 : 0;
                        const change = data.value - previousValue;
                        return (
                          <td key={index} className={`px-2 py-3 text-center text-sm bg-white border-t-8 border-t-white border-b border-gray-200 ${isFirstMonth ? 'border-l border-gray-200' : ''} ${isYearBoundary ? 'border-r-2 border-gray-200' : 'border-r border-gray-200'}`} style={{ minWidth: '80px' }}>
                            {data.value !== 0 && (
                              <div className="text-gray-700">
                                {change !== 0 && (
                                  <div className="text-[10px] text-gray-500 mb-0.5">
                                    {change > 0 ? '+' : ''}{formatChipCount(change)}
                                  </div>
                                )}
                                {formatChipCount(data.value)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-bold sticky right-0 bg-white z-50 border-l border-t-8 border-t-white border-b border-gray-200">
                        <div className="text-gray-700">
                          {formatChipCount(liveChipData[liveChipData.length - 1]?.value || 0)}
                        </div>
                      </td>
                    </tr>
                    
                    {/* CUMULATIVE PROFIT row */}
                    <tr className="bg-white font-medium">
                      <td className="px-4 py-3 text-gray-700 text-xs font-semibold uppercase tracking-wide sticky left-0 bg-white z-50 border-r border-t border-b border-gray-200">CUMULATIVE PROFIT</td>
                      {totals.map((data, index) => {
                        const isYearBoundary = index === 3 || index === 15 || index === 27 || index === 39 || index === 51;
                        const isFirstMonth = index === 0;
                        return (
                          <td key={index} className={`px-2 py-3 text-center text-sm bg-white border-t border-b border-gray-200 ${isFirstMonth ? 'border-l border-gray-200' : ''} ${isYearBoundary ? 'border-r-2 border-gray-200' : 'border-r border-gray-200'}`} style={{ minWidth: '80px' }}>
                            {data.value !== 0 && (
                              <div className={data.value < 0 ? 'text-red-600' : 'text-green-600'}>
                                {formatValue(data.value)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-bold sticky right-0 bg-white z-50 border-l border-t border-b border-gray-200">
                        <div className={grandTotal < 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatValue(grandTotal)}
                        </div>
                      </td>
                    </tr>
                    
                    {/* ARR row */}
                    <tr className="bg-white font-medium">
                      <td className="px-4 py-3 text-gray-700 text-xs font-semibold uppercase tracking-wide sticky left-0 bg-white z-50 border-r border-t border-b border-gray-200">ARR</td>
                      {arrData.map((data, index) => {
                        const isYearBoundary = index === 3 || index === 15 || index === 27 || index === 39 || index === 51;
                        const isFirstMonth = index === 0;
                        return (
                          <td 
                            key={index} 
                            className={`px-2 py-3 text-center text-sm bg-white border-t border-b border-gray-200 ${isFirstMonth ? 'border-l border-gray-200' : ''} ${isYearBoundary ? 'border-r-2 border-gray-200' : 'border-r border-gray-200'} cursor-pointer hover:bg-gray-50`}
                            style={{ minWidth: '80px' }}
                          onClick={() => {
                            setSelectedARRMonth(index);
                            setIsARRModalOpen(true);
                          }}
                        >
                          {data.value > 0 && (
                            <div className="text-green-600 font-medium">
                              {formatValue(data.value)}
                            </div>
                          )}
                        </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-bold sticky right-0 bg-white z-50 border-l border-t border-b border-gray-200">
                        <div className="text-green-600">
                          {formatValue(arrData.length > 0 ? arrData[arrData.length - 1].value : 0)}
                        </div>
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>
          
        {batches.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No batches added yet</p>
              <p className="text-sm">Click "NEW BATCH" to add your first GPU batch</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewBatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddBatch}
        sites={sites}
        onEditSite={handleEditSite}
        onOpenSettings={handleOpenSettings}
        settings={settings}
      />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setHighlightField(undefined);
        }}
        settings={settings}
        onSave={handleSaveSettings}
        highlightField={highlightField}
      />

      <EditBatchModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBatch(null);
          setHighlightBatchField(undefined);
        }}
        batch={editingBatch}
        onSave={handleSaveEditBatch}
        highlightField={highlightBatchField}
        sites={sites}
        onEditSite={handleEditSite}
        onOpenSettings={handleOpenSettings}
        settings={settings}
      />

      <ARRModal
        isOpen={isARRModalOpen}
        onClose={() => {
          setIsARRModalOpen(false);
          setSelectedARRMonth(null);
        }}
        monthIndex={selectedARRMonth || 0}
        batches={batches}
        allBatchData={allBatchData}
        settings={settings}
        onOpenCellModal={(batch, monthIndex) => {
          // Set the selected cell which will trigger the BatchRow to open its modal
          setSelectedCell({ batchId: batch.id, monthIndex });
          // Need to trigger the cell click programmatically
          // Use a small delay to ensure the cell is rendered and selected first
          setTimeout(() => {
            const cellElement = document.querySelector(`[data-batch-id="${batch.id}"][data-month-index="${monthIndex}"]`);
            if (cellElement instanceof HTMLElement) {
              cellElement.click();
            }
          }, 100);
        }}
      />

      <SiteEditorModal
        isOpen={isSiteEditorOpen}
        onClose={() => {
          setIsSiteEditorOpen(false);
          setEditingSite(null);
        }}
        site={editingSite}
        onSave={handleSaveSite}
        batches={batches}
      />

      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={handleWelcomeClose}
      />
    </div>
      )}
    </>
  );
}

export default App;
