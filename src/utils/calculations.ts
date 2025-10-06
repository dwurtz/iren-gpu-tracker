import { Batch, MonthData, ChipType } from '../types';
import { ProfitabilitySettings } from '../components/SettingsModal';

// Helper function to get chip-specific settings
const getChipSettings = (chipType: ChipType, settings: ProfitabilitySettings) => {
  const key = chipType.toLowerCase() as 'b200' | 'b300' | 'gb300' | 'h100' | 'h200' | 'mi350x';
  return {
    gpuHourRate: settings.gpuHourRate[key],
    powerConsumption: 1000 / settings.gpusPerMW[key], // Derive from GPUs/MW (1000 kW / GPUs per MW)
    upfrontCost: settings.upfrontGpuCost[key],
    effectiveGpuCost: settings.effectiveGpuCost[key],
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
  const powerPerGpuKw = chipSettings.powerConsumption;
  
  // GPU financing terms
  const isCashPurchase = batch.fundingType === 'Cash';
  const gpuCostPerUnit = chipSettings.upfrontCost;
  
  // Track cumulative deployment percentage
  let cumulativeDeployedPercent = 0;
  
  for (let i = 0; i < totalMonths; i++) {
    const currentMonth = (startMonth + i) % 12;
    const currentYear = startYear + Math.floor((startMonth + i) / 12);
    
    // Calculate months since installation start
    const installationStartIndex = 
      (batch.installationYear - startYear) * 12 + (batch.installationMonth - startMonth);
    const monthsSinceInstallation = i - installationStartIndex;
    
    let monthlyValue = 0;
    let percentDeployed = 0;
    
    if (monthsSinceInstallation >= 0) {
      // Get deployment percentage for this specific month
      // deploymentSchedule uses same indexing as MONTHS array (0 = Aug'23)
      const deploymentThisMonth = batch.deploymentSchedule[i] || 0;
      cumulativeDeployedPercent = Math.min(100, cumulativeDeployedPercent + deploymentThisMonth);
      percentDeployed = cumulativeDeployedPercent;
      
      // Calculate number of GPUs deployed this month (new deployments only)
      const newGpusDeployed = (deploymentThisMonth / 100) * batch.quantity;
      const totalGpusDeployed = (percentDeployed / 100) * batch.quantity;
      
      // === COSTS FOR NEW DEPLOYMENTS THIS MONTH ===
      
      // 1. Installation costs for newly deployed GPUs
      const installationCostThisMonth = newGpusDeployed * chipSettings.installationCost;
      
      // 2. GPU costs (calculate interest from batch APR)
      const loanTermMonths = batch.leaseTerm || 36;
      const annualInterestRate = batch.apr || 0;
      const monthlyInterestRate = annualInterestRate / 100 / 12;
      
      const calculateTotalInterestPerGpu = () => {
        if (isCashPurchase || monthlyInterestRate === 0) return 0;
        
        // Calculate monthly payment
        const monthlyPayment = gpuCostPerUnit * 
          (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) / 
          (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);
        
        // Total interest = (monthly payment × months) - principal
        return (monthlyPayment * loanTermMonths) - gpuCostPerUnit;
      };
      
      const interestPremiumPerGpu = calculateTotalInterestPerGpu();
      const gpuPrincipalCost = newGpusDeployed * gpuCostPerUnit;
      const gpuInterestPremium = newGpusDeployed * interestPremiumPerGpu;
      
      // === ONGOING COSTS FOR ALL DEPLOYED GPUS ===
      
      // 4. Datacenter overhead for all deployed GPUs
      const datacenterOverheadCost = totalGpusDeployed * datacenterOverheadPerGpu;
      
      // 5. Electrical cost for all deployed GPUs
      const hoursGpusRun = hoursPerMonth * utilizationRate;
      const totalPowerKw = totalGpusDeployed * powerPerGpuKw;
      const baseElectricalCost = hoursGpusRun * totalPowerKw * settings.electricityCost;
      const electricalCost = baseElectricalCost * settings.electricalOverhead; // Apply PUE
      
      // === REVENUE FOR ALL DEPLOYED GPUS ===
      const monthlyRevenue = totalGpusDeployed * hoursPerMonth * utilizationRate * gpuHourRate;
      
      // === NET MONTHLY PROFIT ===
      const totalCosts = installationCostThisMonth + gpuPrincipalCost + gpuInterestPremium + 
                         datacenterOverheadCost + electricalCost;
      monthlyValue = monthlyRevenue - totalCosts;
      
      cumulativeProfit += monthlyValue;
    }
    
    data.push({
      month: currentMonth,
      year: currentYear,
      percentDeployed,
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
      percentDeployed: 0, // Not applicable for totals
      value: monthTotal,
    });
  }
  
  return totals;
};
