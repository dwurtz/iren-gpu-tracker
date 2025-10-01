import { Batch, MonthData } from '../types';
import { ProfitabilitySettings } from '../components/SettingsModal';

export const calculateMonthlyData = (batch: Batch, startMonth: number, startYear: number, totalMonths: number, settings: ProfitabilitySettings): MonthData[] => {
  const data: MonthData[] = [];
  let cumulativeProfit = 0;
  
  // Use settings values - chip-specific
  const hoursPerMonth = 730;
  const utilizationRate = settings.utilizationRate / 100;
  const gpuHourRate = batch.chipType === 'B200' ? settings.gpuHourRate.b200 : settings.gpuHourRate.gb300; // Chip-specific rate
  const datacenterOverheadPerGpu = settings.datacenterOverhead;
  // Calculate electrical cost based on actual GPU usage
  const hoursGpusRun = hoursPerMonth * utilizationRate; // Hours GPUs actually run
  const powerPerGpuKw = batch.chipType === 'B200' ? settings.gpuPowerConsumption.b200 : settings.gpuPowerConsumption.gb300; // kW per GPU from settings
  const totalPowerKw = batch.quantity * powerPerGpuKw;
  const baseElectricalCost = hoursGpusRun * totalPowerKw * settings.electricityCost;
  const electricalCost = baseElectricalCost * settings.electricalOverhead; // Apply PUE multiplier
  
  // GPU financing terms from settings
  const annualInterestRate = settings.interestRate / 100;
  const monthlyInterestRate = annualInterestRate / 12;
  const loanTermMonths = 36;
  
  // Calculate monthly payment for GPU financing (like a mortgage)
  const calculateMonthlyPayment = (principal: number) => {
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
    
    let phase: 'INSTALLATION' | 'BURN_IN' | 'LIVE' | null = null;
    let monthlyValue = 0;
    
    if (monthsSinceInstallation >= 0) {
      // Calculate GPU financing payment (applies to all phases for 36 months)
      const gpuCostPerUnit = batch.chipType === 'B200' ? 54500 : 80000;
      const totalGpuCost = gpuCostPerUnit * batch.quantity;
      const monthlyGpuPayment = calculateMonthlyPayment(totalGpuCost);
      
      // Installation costs (one-time, spread over installation period) - chip-specific
      const installationCostPerGpu = batch.chipType === 'B200' ? settings.installationCost.b200 : settings.installationCost.gb300;
      const totalInstallationCost = installationCostPerGpu * batch.quantity;
      
      if (monthsSinceInstallation < batch.phases.installation.duration) {
        // Installation phase - GPU payments + installation costs
        phase = 'INSTALLATION';
        const monthlyInstallationCost = totalInstallationCost / batch.phases.installation.duration;
        monthlyValue = -(monthlyGpuPayment + monthlyInstallationCost);
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
