import { Batch, MonthData, ChipType } from '../types';
import { ProfitabilitySettings } from '../components/SettingsModal';

// Helper function to get chip-specific settings
const getChipSettings = (chipType: ChipType, settings: ProfitabilitySettings) => {
  const key = chipType.toLowerCase() as 'b200' | 'b300' | 'gb300' | 'h100' | 'h200' | 'mi350x';
  return {
    gpuHourRate: settings.gpuHourRate[key],
    powerConsumption: settings.gpuPowerConsumption[key],
    upfrontCost: settings.upfrontGpuCost[key],
    installationCost: settings.installationCost[key],
  };
};

export const calculateMonthlyData = (batch: Batch, startMonth: number, startYear: number, totalMonths: number, settings: ProfitabilitySettings): MonthData[] => {
  const data: MonthData[] = [];
  let cumulativeProfit = 0;
  
  // Use settings values - chip-specific
  const chipSettings = getChipSettings(batch.chipType, settings);
  const hoursPerMonth = 730;
  const utilizationRate = settings.utilizationRate / 100;
  const gpuHourRate = chipSettings.gpuHourRate;
  const datacenterOverheadPerGpu = settings.datacenterOverhead;
  // Calculate electrical cost based on actual GPU usage
  const hoursGpusRun = hoursPerMonth * utilizationRate; // Hours GPUs actually run
  const powerPerGpuKw = chipSettings.powerConsumption;
  const totalPowerKw = batch.quantity * powerPerGpuKw;
  const baseElectricalCost = hoursGpusRun * totalPowerKw * settings.electricityCost;
  const electricalCost = baseElectricalCost * settings.electricalOverhead; // Apply PUE multiplier
  
  // GPU financing terms - now from batch level
  const isCashPurchase = batch.fundingType === 'Cash';
  const annualInterestRate = isCashPurchase ? 0 : (batch.apr || 0) / 100;
  const monthlyInterestRate = annualInterestRate / 12;
  const loanTermMonths = batch.leaseTerm || 36;
  
  // Calculate monthly payment for GPU financing (like a mortgage)
  // For cash purchases, this will be 0
  const calculateMonthlyPayment = (principal: number) => {
    if (isCashPurchase) return 0;
    if (monthlyInterestRate === 0) return principal / loanTermMonths;
    return principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) / 
           (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);
  };
  
  for (let i = 0; i < totalMonths; i++) {
    const currentMonth = (startMonth + i) % 12;
    const currentYear = startYear + Math.floor((startMonth + i) / 12);
    
    // Calculate months since installation start
    const installationStartIndex = 
      (batch.installationYear - startYear) * 12 + (batch.installationMonth - startMonth);
    const monthsSinceInstallation = i - installationStartIndex;
    
    let phase: 'INSTALL' | 'BURN_IN' | 'LIVE' | null = null;
    let monthlyValue = 0;
    
    if (monthsSinceInstallation >= 0) {
      // Calculate GPU financing payment (applies to all phases for 36 months)
      const totalGpuCost = chipSettings.upfrontCost * batch.quantity;
      const monthlyGpuPayment = calculateMonthlyPayment(totalGpuCost);
      
      // Installation costs (one-time, spread over installation period) - chip-specific
      const totalInstallationCost = chipSettings.installationCost * batch.quantity;
      
      if (monthsSinceInstallation < batch.phases.installation.duration) {
        // Installation phase - GPU payments + installation costs
        phase = 'INSTALL';
        const monthlyInstallationCost = totalInstallationCost / batch.phases.installation.duration;
        
        // For cash purchases, include upfront GPU cost in first month only
        const upfrontGpuCost = (isCashPurchase && monthsSinceInstallation === 0) ? totalGpuCost : 0;
        
        monthlyValue = -(monthlyGpuPayment + monthlyInstallationCost + upfrontGpuCost);
      } else if (monthsSinceInstallation < batch.phases.installation.duration + batch.phases.burnIn.duration) {
        // Burn-in phase - GPU payments + overhead costs
        phase = 'BURN_IN';
        const monthlyOverhead = (datacenterOverheadPerGpu * batch.quantity) + electricalCost;
        monthlyValue = -(monthlyGpuPayment + monthlyOverhead);
      } else {
        // Live phase - revenue minus (GPU payments + overhead)
        phase = 'LIVE';
        const monthlyRevenue = batch.quantity * hoursPerMonth * utilizationRate * gpuHourRate;
        const monthlyOverhead = (datacenterOverheadPerGpu * batch.quantity) + electricalCost;
        
        // GPU payments continue for 36 months total, then stop
        const monthsFromStart = monthsSinceInstallation;
        const gpuPaymentActive = monthsFromStart < loanTermMonths;
        const totalMonthlyCosts = monthlyOverhead + (gpuPaymentActive ? monthlyGpuPayment : 0);
        
        monthlyValue = monthlyRevenue - totalMonthlyCosts;
      }
      
      cumulativeProfit += monthlyValue;
    }
    
    data.push({
      month: currentMonth,
      year: currentYear,
      phase,
      value: cumulativeProfit,
    });
  }
  
  return data;
};

export const calculateTotals = (allBatchData: MonthData[][]): MonthData[] => {
  if (allBatchData.length === 0) return [];
  
  const totalMonths = allBatchData[0]?.length || 0;
  const totals: MonthData[] = [];
  
  for (let i = 0; i < totalMonths; i++) {
    // Sum the cumulative profits of all batches for this month
    const monthTotal = allBatchData.reduce((sum, batchData) => {
      return sum + (batchData[i]?.value || 0);
    }, 0);
    
    totals.push({
      month: allBatchData[0][i].month,
      year: allBatchData[0][i].year,
      phase: null,
      value: monthTotal,
    });
  }
  
  return totals;
};
