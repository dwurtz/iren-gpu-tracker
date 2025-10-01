import React from 'react';
import { X, Edit } from 'lucide-react';
import { Batch } from '../types';
import { ProfitabilitySettings } from './SettingsModal';
import { useModalBackdrop } from './ModalBackdrop';
import { ClickableVariable } from './ClickableVariable';

interface CellDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  monthIndex: number;
  phase: 'INSTALLATION' | 'BURN_IN' | 'LIVE' | null;
  cumulativeProfit: number;
  monthlyValue: number;
  previousCumulative?: number;
  settings: ProfitabilitySettings;
  onOpenSettings: (field?: string) => void;
  onEditBatch?: () => void;
}

export const CellDetailModal: React.FC<CellDetailModalProps> = ({
  isOpen,
  onClose,
  batch,
  monthIndex,
  phase,
  cumulativeProfit,
  monthlyValue: _monthlyValue,
  previousCumulative = 0,
  settings,
  onOpenSettings,
  onEditBatch
}) => {
  useModalBackdrop(isOpen);
  
  if (!isOpen || !batch) return null;

  // Format values using the same logic as the table
  const formatValue = (value: number) => {
    if (value === 0) return '$0';
    const sign = value < 0 ? '-' : '';
    const absValue = Math.abs(value);
    
    if (absValue >= 1000000000) {
      const billions = absValue / 1000000000;
      return `${sign}$${billions.toFixed(2)}B`;
    } else if (absValue >= 1000000) {
      const millions = absValue / 1000000;
      return `${sign}$${millions.toFixed(1)}M`;
    } else if (absValue >= 1000) {
      const thousands = absValue / 1000;
      return `${sign}$${thousands.toFixed(1)}K`;
    } else {
      return `${sign}$${absValue.toFixed(0)}`;
    }
  };


  // const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsSinceInstallation = monthIndex;
  
  // Calculate chip-specific rate (needed in JSX)
  const gpuHourRate = batch.chipType === 'B200' ? settings.gpuHourRate.b200 : settings.gpuHourRate.gb300;
  
  // Calculate detailed breakdown based on phase
  const getPhaseDetails = () => {
    try {
      const hoursPerMonth = 730; // Average hours per month
      const utilizationRate = settings.utilizationRate / 100; // From settings
      const datacenterOverhead = settings.datacenterOverhead; // From settings
      // Calculate electrical cost based on actual GPU usage (same as calculations.ts)
      const hoursGpusRun = hoursPerMonth * utilizationRate; // Hours GPUs actually run
      const powerPerGpuKw = batch.chipType === 'B200' ? settings.gpuPowerConsumption.b200 : settings.gpuPowerConsumption.gb300; // kW per GPU from settings
      const totalPowerKw = batch.quantity * powerPerGpuKw;
      const baseElectricalCost = hoursGpusRun * totalPowerKw * settings.electricityCost;
      const electricalCost = baseElectricalCost * settings.electricalOverhead; // Apply PUE multiplier
      
      // GPU financing calculations (same as main calculations)
      const annualInterestRate = settings.interestRate / 100; // From settings
      const monthlyInterestRate = annualInterestRate / 12;
      const loanTermMonths = 36;
      
      const calculateMonthlyPayment = (principal: number) => {
        if (monthlyInterestRate === 0) return principal / loanTermMonths;
        return principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) / 
               (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);
      };
      
      const gpuCostPerUnit = batch.chipType === 'B200' ? settings.upfrontGpuCost.b200 : settings.upfrontGpuCost.gb300;
      const totalGpuCost = gpuCostPerUnit * batch.quantity;
      const monthlyGpuPayment = calculateMonthlyPayment(totalGpuCost);
      const installationCostPerGpu = batch.chipType === 'B200' ? settings.installationCost.b200 : settings.installationCost.gb300; // From settings - chip-specific
      const totalInstallationCost = installationCostPerGpu * batch.quantity;
      
      // GPU Financing section (shown in all phases)
      const gpuFinancingSection = {
        label: 'GPU Cost (Financed)',
        value: (
          <span title={`Formula: P × [r(1+r)^n] / [(1+r)^n - 1] where P = ${formatValue(totalGpuCost)}, r = ${(settings.interestRate / 12).toFixed(3)}% monthly, n = 36 months`}>
            {batch.quantity.toLocaleString()} GPUs × <ClickableVariable title="Click to edit upfront GPU cost in settings" field={`upfrontGpuCost.${batch.chipType.toLowerCase()}`} onOpenSettings={onOpenSettings}>{formatValue(gpuCostPerUnit)}</ClickableVariable> ÷ 36 months @ {settings.interestRate}% = {formatValue(monthlyGpuPayment)}
          </span>
        )
      };

      switch (phase) {
        case 'INSTALLATION':
          const monthlyInstallationCost = totalInstallationCost / batch.phases.installation.duration;
          const totalMonthlyCost = monthlyGpuPayment + monthlyInstallationCost;
          
          return {
            title: 'Installation Phase',
            details: [
              gpuFinancingSection,
              { 
                label: 'Installation Cost', 
                value: (
                  <span>
                    {batch.quantity.toLocaleString()} × <ClickableVariable title="Click to edit installation cost in settings" field={`installationCost.${batch.chipType.toLowerCase()}`} onOpenSettings={onOpenSettings}>{formatValue(installationCostPerGpu)}</ClickableVariable>{batch.phases.installation.duration !== 1 && ` ÷ ${batch.phases.installation.duration} months`} = {formatValue(monthlyInstallationCost)}
                  </span>
                )
              },
            ],
            monthlyRevenue: 0,
            monthlyCosts: totalMonthlyCost,
            netMonthly: -totalMonthlyCost
          };
          
        case 'BURN_IN':
          const burnInOverhead = (datacenterOverhead * batch.quantity) + electricalCost;
          const totalBurnInCost = monthlyGpuPayment + burnInOverhead;
          
          return {
            title: 'Burn-in Phase',
            details: [
              gpuFinancingSection,
              { 
                label: 'Datacenter Overhead', 
                value: (
                  <span>
                    {batch.quantity.toLocaleString()} × <ClickableVariable title="Click to edit datacenter overhead in settings" field="datacenterOverhead" onOpenSettings={onOpenSettings}>{formatValue(datacenterOverhead)}</ClickableVariable> = {formatValue(datacenterOverhead * batch.quantity)}
                  </span>
                )
              },
              { 
                label: 'Electrical Cost', 
                value: (
                  <span>
                    {hoursGpusRun.toLocaleString()}h × <ClickableVariable title="Click to edit GPU power consumption in settings" field={`gpuPowerConsumption.${batch.chipType.toLowerCase()}`} onOpenSettings={onOpenSettings}>{totalPowerKw.toLocaleString()}kW</ClickableVariable> × <ClickableVariable title="Click to edit electricity cost in settings" field="electricityCost" onOpenSettings={onOpenSettings}>${settings.electricityCost}</ClickableVariable>/kWh × <ClickableVariable title="Click to edit PUE multiplier in settings" field="electricalOverhead" onOpenSettings={onOpenSettings}>{settings.electricalOverhead}</ClickableVariable> PUE = {formatValue(electricalCost)}
                  </span>
                )
              },
            ],
            monthlyRevenue: 0,
            monthlyCosts: totalBurnInCost,
            netMonthly: -totalBurnInCost
          };
          
        case 'LIVE':
          const monthlyRevenue = batch.quantity * hoursPerMonth * utilizationRate * gpuHourRate;
          const liveOverhead = (datacenterOverhead * batch.quantity) + electricalCost;
          
          // Check if GPU payments are still active (first 36 months from installation)
          const gpuPaymentActive = monthsSinceInstallation < loanTermMonths;
          const totalMonthlyCosts = liveOverhead + (gpuPaymentActive ? monthlyGpuPayment : 0);
          const netMonthly = monthlyRevenue - totalMonthlyCosts;
          
          const details = [];
          
          // Add GPU financing section (show even if paid off)
          if (gpuPaymentActive) {
            details.push(gpuFinancingSection);
          } else {
            details.push({ 
              label: 'GPU Cost (Financed)', 
              value: (
                <div className="text-right">
                  <div className="font-semibold text-base">$0</div>
                  <div className="text-xs text-gray-500">Loan paid off (36 months complete)</div>
                </div>
              )
            });
          }
          
          details.push(
            { 
              label: 'Datacenter Overhead', 
              value: (
                <span>
                  {batch.quantity.toLocaleString()} × <ClickableVariable title="Click to edit datacenter overhead in settings" field="datacenterOverhead" onOpenSettings={onOpenSettings}>{formatValue(datacenterOverhead)}</ClickableVariable> = {formatValue(datacenterOverhead * batch.quantity)}
                </span>
              )
            },
            { 
              label: 'Electrical Cost', 
              value: (
                <span>
                  {hoursGpusRun.toLocaleString()}h × <ClickableVariable title="Click to edit GPU power consumption in settings" field={`gpuPowerConsumption.${batch.chipType.toLowerCase()}`} onOpenSettings={onOpenSettings}>{totalPowerKw.toLocaleString()}kW</ClickableVariable> × <ClickableVariable title="Click to edit electricity cost in settings" field="electricityCost" onOpenSettings={onOpenSettings}>${settings.electricityCost}</ClickableVariable>/kWh × <ClickableVariable title="Click to edit PUE multiplier in settings" field="electricalOverhead" onOpenSettings={onOpenSettings}>{settings.electricalOverhead}</ClickableVariable> PUE = {formatValue(electricalCost)}
                </span>
              )
            }
          );
          
          return {
            title: 'Live Phase',
            details,
            monthlyRevenue,
            monthlyCosts: totalMonthlyCosts,
            netMonthly
          };
          
        default:
          return {
            title: 'No Activity',
            details: [
              { label: 'Status', value: 'Batch not yet installed' }
            ],
            monthlyRevenue: 0,
            monthlyCosts: 0,
            netMonthly: 0
          };
      }
    } catch (error) {
      console.error('Error in getPhaseDetails:', error);
      return {
        title: 'Error',
        details: [
          { label: 'Error', value: 'Unable to calculate details' }
        ],
        monthlyRevenue: 0,
        monthlyCosts: 0,
        netMonthly: 0
      };
    }
  };

  const phaseDetails = getPhaseDetails();

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-16 z-[9999]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-2xl h-[75vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {batch?.name || 'Unknown Batch'} - Month {monthsSinceInstallation + 1}
          </h2>
          <div className="flex items-center space-x-2">
            {onEditBatch && (
              <button 
                onClick={onEditBatch} 
                className="text-gray-500 hover:text-gray-700"
                title="Edit batch details"
              >
                <Edit size={20} />
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
        

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-medium text-xl mb-4 text-center">{phaseDetails.title}</h3>
            
            <div className="space-y-4">
              <div className="py-2 border-b">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg text-gray-700">Revenue:</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatValue(phaseDetails.monthlyRevenue)}
                  </span>
                </div>
                {phaseDetails.monthlyRevenue > 0 && (
                  <div className="ml-4 space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>• Hours per Month:</span>
                      <span>730</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Utilization Rate:</span>
                      <span><ClickableVariable title="Click to edit utilization rate in settings" field="utilizationRate" onOpenSettings={onOpenSettings}>{settings.utilizationRate}%</ClickableVariable></span>
                    </div>
                    <div className="flex justify-between">
                      <span>• GPU Hour Rate:</span>
                      <span><ClickableVariable title="Click to edit GPU hour rate in settings" field={`gpuHourRate.${batch.chipType.toLowerCase()}`} onOpenSettings={onOpenSettings}>${gpuHourRate}</ClickableVariable></span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Revenue per GPU:</span>
                      <span>730 × <ClickableVariable field="utilizationRate" onOpenSettings={onOpenSettings}>{settings.utilizationRate}%</ClickableVariable> × <ClickableVariable field={`gpuHourRate.${batch.chipType.toLowerCase()}`} onOpenSettings={onOpenSettings}>${gpuHourRate}</ClickableVariable> = {formatValue(730 * (settings.utilizationRate / 100) * gpuHourRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Number of GPUs:</span>
                      <span>{batch?.quantity?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>• Total Revenue:</span>
                      <span>{batch?.quantity?.toLocaleString()} × {formatValue(730 * (settings.utilizationRate / 100) * gpuHourRate)} = {formatValue(phaseDetails.monthlyRevenue)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="py-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg text-gray-700">Costs:</span>
                  <span className="font-bold text-lg text-red-600">
                    {formatValue(phaseDetails.monthlyCosts)}
                  </span>
                </div>
                <div className="ml-4 space-y-1 text-sm text-gray-600">
                  {phaseDetails.details.map((detail, index) => (
                    <div key={index} className="flex justify-between">
                      <span>• {detail.label}:</span>
                      <span>{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="py-3 border-t-2 border-gray-300 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Net Profit This Month:</span>
                  <span className="text-sm text-gray-600">
                    {formatValue(phaseDetails.monthlyRevenue)} - {formatValue(phaseDetails.monthlyCosts)} = <span className={`font-bold text-lg ${(cumulativeProfit - previousCumulative) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatValue(cumulativeProfit - previousCumulative)}</span>
                  </span>
                </div>
              </div>
              
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">Cumulative Impact:</span>
              <span className="text-sm text-gray-600">
                {formatValue(previousCumulative)} + {formatValue(cumulativeProfit - previousCumulative)} = <span className={`font-bold text-lg ${cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatValue(cumulativeProfit)}</span>
              </span>
            </div>
          </div>
        </div>

        </div>
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
