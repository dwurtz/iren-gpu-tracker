import React, { useState, useEffect } from 'react';
import { Plus, Settings, RotateCcw } from 'lucide-react';
import { Batch, Site, ChipType } from './types';
import { NewBatchModal } from './components/NewBatchModal';
import { BatchRow } from './components/BatchRow';
import { SettingsModal, ProfitabilitySettings } from './components/SettingsModal';
import { EditBatchModal } from './components/EditBatchModal';
import { SiteEditorModal } from './components/SiteEditorModal';
import ARRModal from './components/ARRModal';
import { ModalBackdrop } from './components/ModalBackdrop';
import { calculateMonthlyData, calculateTotals } from './utils/calculations';

// Extended timeline: Sep 2025 to Dec 2029 (52 months for 36-month breakeven analysis)
const MONTHS = [
  "Sep '25", "Oct '25", "Nov '25", "Dec '25", // 2025 (4 months)
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
    b200: 532, // air cooled (CONSTANT)
    gb300: 432, // liquid cooled
    h100: 500, // air cooled
  },
  upfrontGpuCost: {
    b200: 46000, // air cooled
    gb300: 80000, // liquid cooled
    h100: 35000, // air cooled
  },
  gpuPowerConsumption: {
    b200: 1.7, // 1700W per B200 baseline rack power (before PUE)
    gb300: 2.1, // 2100W per GB300 baseline rack power (before PUE)
    h100: 1.4, // 1400W per H100 baseline rack power (before PUE)
  },
  installationCost: {
    b200: 20, // per GPU
    gb300: 20, // per GPU
    h100: 20, // per GPU
  },
  gpuHourRate: {
    b200: 3.65, // $3.65 per GPU hour
    gb300: 5.50, // $5.50 per GPU hour
    h100: 2.50, // $2.50 per GPU hour
  },
  interestRate: 9, // 9% for first 3 years
  electricityCost: 0.0325, // per kWh
  datacenterOverhead: 150, // per GPU per month
  electricalOverhead: 1.5, // PUE multiplier
  utilizationRate: 90, // 90% utilization
};

// Calculate costs and revenue for 36-month breakeven
const calculateProfitability = (settings: ProfitabilitySettings, chipType: 'B200' | 'GB300') => {
  // const gpuCount = chipType === 'B200' ? settings.gpusPerMW.b200 : settings.gpusPerMW.gb300;
  const upfrontCost = chipType === 'B200' ? settings.upfrontGpuCost.b200 : settings.upfrontGpuCost.gb300;
  
  // Monthly costs - chip-specific
  const installationCostPerGpu = chipType === 'B200' ? settings.installationCost.b200 : settings.installationCost.gb300;
  const monthlyDatacenterOverhead = settings.datacenterOverhead;
  
  // Monthly revenue (assuming 730 hours per month) - chip-specific
  // const monthlyRevenuePerGpu = settings.gpuHourRate * 730 * (settings.utilizationRate / 100);
  
  // For 36-month breakeven, total revenue should equal total costs
  // Total costs = upfront + installation + 36 months of overhead
  const totalCostPerGpu = upfrontCost + installationCostPerGpu + (monthlyDatacenterOverhead * 36);
  
  // Adjust revenue to achieve breakeven at 36 months
  const adjustedMonthlyRevenue = totalCostPerGpu / 36;
  
  return {
    installationCost: installationCostPerGpu,
    burnInCost: monthlyDatacenterOverhead, // burn-in phase overhead
    monthlyRevenue: adjustedMonthlyRevenue,
  };
};

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
  
  // Default batches based on screenshot
  const defaultBatchConfig = [
    { month: 8, year: 2025, quantity: 4000, chipType: 'B200' as ChipType, siteId: 'site-prince-george' }, // Sep 2025
    { month: 9, year: 2025, quantity: 4500, chipType: 'B200' as ChipType, siteId: 'site-prince-george' }, // Oct 2025
    { month: 10, year: 2025, quantity: 5000, chipType: 'B200' as ChipType, siteId: 'site-prince-george' }, // Nov 2025
    { month: 11, year: 2025, quantity: 5000, chipType: 'B200' as ChipType, siteId: 'site-prince-george' }, // Dec 2025
    { month: 0, year: 2026, quantity: 5500, chipType: 'B200' as ChipType, siteId: 'site-prince-george' }, // Jan 2026
    { month: 1, year: 2026, quantity: 5500, chipType: 'B200' as ChipType, siteId: 'site-childress' }, // Feb 2026
    { month: 2, year: 2026, quantity: 5500, chipType: 'B200' as ChipType, siteId: 'site-childress' }, // Mar 2026
    { month: 3, year: 2026, quantity: 5500, chipType: 'B200' as ChipType, siteId: 'site-childress' }, // Apr 2026
  ];
  
  defaultBatchConfig.forEach((config, index) => {
    const gpusPerMW = config.chipType === 'B200' ? settings.gpusPerMW.b200 : settings.gpusPerMW.gb300;
    const mwEquivalent = (config.quantity / gpusPerMW).toFixed(2);
    const site = sites.find(s => s.id === config.siteId);
    const siteName = site ? site.name : '';
    const profitability = calculateProfitability(settings, config.chipType as 'B200' | 'GB300');
    
    batches.push({
      id: `batch-${index}`,
      name: `${config.quantity.toLocaleString()} ${config.chipType}s\n(${mwEquivalent}MW${siteName ? ` • ${siteName}` : ''})`,
      chipType: config.chipType,
      quantity: config.quantity,
      installationMonth: config.month,
      installationYear: config.year,
      siteId: config.siteId,
      phases: {
        installation: { 
          duration: 1, 
          costPerUnit: profitability.installationCost 
        },
        burnIn: { 
          duration: 1, 
          costPerUnit: profitability.burnInCost 
        },
        live: { 
          revenuePerUnit: profitability.monthlyRevenue 
        },
      },
    });
  });
  
  return batches;
};

// Initialize batches from storage or create defaults
const initializeBatches = (settings: ProfitabilitySettings, sites: Site[]): Batch[] => {
  const storedBatches = loadBatchesFromStorage();
  if (storedBatches && storedBatches.length > 0) {
    console.log('Loaded batches from storage:', storedBatches.length);
    return storedBatches;
  }
  
  console.log('Creating default batch configuration');
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
        const batchData = calculateMonthlyData(currentBatch, 8, 2025, 52, settings);
        
        let newMonthIndex = selectedCell.monthIndex;
        
        if (event.key === 'ArrowLeft') {
          // Move left, find previous valid cell
          for (let i = selectedCell.monthIndex - 1; i >= 0; i--) {
            if (batchData[i]?.phase) {
              newMonthIndex = i;
              break;
            }
          }
        } else if (event.key === 'ArrowRight') {
          // Move right, find next valid cell
          for (let i = selectedCell.monthIndex + 1; i < batchData.length; i++) {
            if (batchData[i]?.phase) {
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

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
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

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all batches and settings to default values? This will delete all current batches and reset all profitability settings.')) {
      // Reset settings to defaults
      setSettings(defaultSettings);
      
      // Reset batches to defaults
      const defaultBatches = createDefaultBatches(defaultSettings, sites);
      setBatches(defaultBatches);
      saveBatchesToStorage(defaultBatches);
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
    calculateMonthlyData(batch, 8, 2025, 52, settings) // Sept 2025 to Dec 2029
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
      const totalMonths = 52; // Sept 2025 to Dec 2029
      
      for (let monthIndex = 0; monthIndex < totalMonths; monthIndex++) {
        let liveGPUs = 0;
        
        // Count GPUs that are live in this month
        batches.forEach((batch, batchIndex) => {
          const batchData = allBatchData[batchIndex];
          if (batchData && batchData[monthIndex] && batchData[monthIndex].phase === 'LIVE') {
            liveGPUs += batch.quantity || 0;
          }
        });
        
        // Calculate forward 12-month revenue based on live GPUs
        // Note: This is an approximation - we use average of B200 and GB300 rates for mixed fleets
        const hoursPerMonth = 730;
        const utilizationRate = settings.utilizationRate / 100;
        const avgGpuHourRate = (settings.gpuHourRate.b200 + settings.gpuHourRate.gb300) / 2;
        const monthlyRevenuePerGPU = hoursPerMonth * utilizationRate * avgGpuHourRate;
        const annualRevenue = liveGPUs * monthlyRevenuePerGPU * 12;
        
        arrData.push({ value: annualRevenue || 0 });
      }
      
      return arrData;
    } catch (error) {
      console.error('Error calculating ARR:', error);
      // Return empty array with 52 zero values as fallback
      return Array.from({ length: 52 }, () => ({ value: 0 }));
    }
  };

  const arrData = calculateARR();

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
          <table className="w-full border-collapse" style={{ minHeight: '100%', display: 'table' }}>
              <thead className="sticky top-0 z-40" style={{ display: 'table-header-group' }}>
                {/* Year headers */}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50 z-50" style={{ minWidth: '240px', width: '240px' }}></th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r" colSpan={4}>2025</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r" colSpan={12}>2026</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r" colSpan={12}>2027</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r" colSpan={12}>2028</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r" colSpan={12}>2029</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-24 sticky right-0 bg-gray-50 z-50 border-l"></th>
                </tr>
                {/* Month headers */}
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 sticky left-0 bg-white z-50" style={{ minWidth: '240px', width: '240px' }}></th>
                  {MONTHS.map((month, index) => {
                    // Add heavier border at year boundaries (after Dec, which is at indices 3, 15, 27, 39)
                    const isYearBoundary = index === 3 || index === 15 || index === 27 || index === 39 || index === 51;
                    return (
                      <th key={index} className={`px-2 py-3 text-center text-xs font-medium text-gray-600 ${isYearBoundary ? 'border-r-2 border-gray-200' : 'border-r border-gray-200'}`} style={{ minWidth: '80px' }}>
                        {month}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide w-24 sticky right-0 bg-white z-50 border-l">
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
                    {/* TOTAL row */}
                    <tr className="border-t-2 border-gray-200 bg-white font-medium">
                      <td className="px-4 py-3 text-gray-700 text-xs font-semibold uppercase tracking-wide sticky left-0 bg-white z-50 border-r">CUMULATIVE PROFIT</td>
                      {totals.map((data, index) => {
                        const isYearBoundary = index === 3 || index === 15 || index === 27 || index === 39 || index === 51;
                        return (
                          <td key={index} className={`px-2 py-3 text-center text-sm ${isYearBoundary ? 'border-r-2 border-gray-200' : 'border-r border-gray-200'}`} style={{ minWidth: '80px' }}>
                            {data.value !== 0 && (
                              <div className={data.value < 0 ? 'text-red-600' : 'text-green-600'}>
                                {formatValue(data.value)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-bold sticky right-0 bg-white z-50 border-l">
                        <div className={grandTotal < 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatValue(grandTotal)}
                        </div>
                      </td>
                    </tr>
                    
                    {/* ARR row */}
                    <tr className="border-t border-gray-200 bg-white font-medium">
                      <td className="px-4 py-3 text-gray-700 text-xs font-semibold uppercase tracking-wide sticky left-0 bg-white z-50 border-r">ARR</td>
                      {arrData.map((data, index) => {
                        const isYearBoundary = index === 3 || index === 15 || index === 27 || index === 39 || index === 51;
                        return (
                          <td 
                            key={index} 
                            className={`px-2 py-3 text-center text-sm ${isYearBoundary ? 'border-r-2 border-gray-200' : 'border-r border-gray-200'} cursor-pointer hover:bg-gray-50`}
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
                      <td className="px-4 py-3 text-center font-bold sticky right-0 bg-white z-50 border-l">
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
        }}
        batch={editingBatch}
        onSave={handleSaveEditBatch}
        sites={sites}
        onEditSite={handleEditSite}
        onOpenSettings={handleOpenSettings}
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
        onEditBatch={handleEditBatch}
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
    </div>
      )}
    </>
  );
}

export default App;
