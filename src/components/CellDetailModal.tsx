import React from 'react';
import { X, Edit2 } from 'lucide-react';
import { Batch } from '../types';
import { ProfitabilitySettings } from './SettingsModal';
import { useModalBackdrop } from './ModalBackdrop';
import { ClickableVariable } from './ClickableVariable';

interface CellDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  monthIndex: number;
  percentDeployed: number;
  cumulativeProfit: number;
  monthlyValue: number;
  previousCumulative?: number;
  settings: ProfitabilitySettings;
  onOpenSettings: (field?: string) => void;
  onEditBatch?: (field?: string) => void;
  onUpdateDeployment?: (batchId: string, monthIndex: number, percentage: number) => void;
}

export const CellDetailModal: React.FC<CellDetailModalProps> = ({
  isOpen,
  onClose,
  batch,
  monthIndex,
  percentDeployed,
  cumulativeProfit,
  monthlyValue: _monthlyValue,
  previousCumulative = 0,
  settings,
  onOpenSettings,
  onEditBatch,
  onUpdateDeployment
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
    } else {
      const thousands = absValue / 1000;
      return `${sign}$${thousands.toFixed(1)}K`;
    }
  };

  // Calculate month relative to batch start
  // monthIndex is from MONTHS array (0 = Aug'23, 1 = Sep'23, etc.)
  // deploymentSchedule uses same indexing
  const batchInstallationIndex = (batch.installationYear - 2023) * 12 + (batch.installationMonth - 7);
  const monthsSinceInstallation = monthIndex - batchInstallationIndex + 1;

  // Get chip-specific settings
  const chipKey = batch.chipType.toLowerCase() as 'b200' | 'b300' | 'gb300' | 'h100' | 'h200' | 'mi350x';
  const hoursPerMonth = 730;
  const utilizationRate = settings.utilizationRate / 100;
  const gpuHourRate = settings.gpuHourRate[chipKey];
  const powerPerGpuKw = 1000 / settings.gpusPerMW[chipKey];
  const installationCostPerGpu = settings.installationCost[chipKey];
  const upfrontCostPerGpu = settings.upfrontGpuCost[chipKey];
  const datacenterOverheadPerGpu = settings.datacenterOverhead;

  // Calculate deployment this month
  // deploymentSchedule uses same indexing as MONTHS array (0 = Aug'23)
  const deploymentThisMonth = batch.deploymentSchedule[monthIndex] || 0;
  const newGpusDeployed = (deploymentThisMonth / 100) * batch.quantity;
  const totalGpusDeployed = (percentDeployed / 100) * batch.quantity;

  // === COSTS ===
  
  // 1. Installation costs for newly live GPUs
  const installationCost = newGpusDeployed * installationCostPerGpu;

  // 2. GPU costs - independent of deployment %
  const isCashPurchase = batch.fundingType === 'Cash';
  const totalBatchGpuCost = upfrontCostPerGpu * batch.quantity;
  
  let gpuCostThisMonth = 0;
  let monthlyGpuPayment = 0;
  
  if (isCashPurchase) {
    // Cash purchase: full cost in first month only
    if (monthsSinceInstallation === 1) {
      gpuCostThisMonth = totalBatchGpuCost;
    }
  } else {
    // Financed: fixed monthly payment for duration of lease term
    const leaseTerm = batch.leaseTerm || 36;
    const annualInterestRate = batch.apr || 0;
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    
    if (monthlyInterestRate > 0) {
      // Calculate monthly payment using amortization formula
      monthlyGpuPayment = totalBatchGpuCost * 
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, leaseTerm)) / 
        (Math.pow(1 + monthlyInterestRate, leaseTerm) - 1);
    } else {
      // No interest, just divide principal by term
      monthlyGpuPayment = totalBatchGpuCost / leaseTerm;
    }
    
    if (monthsSinceInstallation <= leaseTerm) {
      gpuCostThisMonth = monthlyGpuPayment;
    }
  }

  // 4. Datacenter overhead
  const datacenterOverheadCost = totalGpusDeployed * datacenterOverheadPerGpu;

  // 5. Electrical cost
  const hoursGpusRun = hoursPerMonth * utilizationRate;
  const totalPowerKw = totalGpusDeployed * powerPerGpuKw;
  const baseElectricalCost = hoursGpusRun * totalPowerKw * settings.electricityCost;
  const electricalCost = baseElectricalCost * settings.electricalOverhead; // Apply PUE

  // === REVENUE ===
  const monthlyRevenue = totalGpusDeployed * hoursPerMonth * utilizationRate * gpuHourRate;

  // === NET MONTHLY PROFIT ===
  const totalCosts = installationCost + gpuCostThisMonth + datacenterOverheadCost + electricalCost;
  const netProfitThisMonth = monthlyRevenue - totalCosts;

  // Month name
  const MONTHS = [
    "Aug '23", "Sep '23", "Oct '23", "Nov '23", "Dec '23",
    "Jan '24", "Feb '24", "Mar '24", "Apr '24", "May '24", "Jun '24", "Jul '24", "Aug '24", "Sep '24", "Oct '24", "Nov '24", "Dec '24",
    "Jan '25", "Feb '25", "Mar '25", "Apr '25", "May '25", "Jun '25", "Jul '25", "Aug '25", "Sep '25", "Oct '25", "Nov '25", "Dec '25",
    "Jan '26", "Feb '26", "Mar '26", "Apr '26", "May '26", "Jun '26", "Jul '26", "Aug '26", "Sep '26", "Oct '26", "Nov '26", "Dec '26",
    "Jan '27", "Feb '27", "Mar '27", "Apr '27", "May '27", "Jun '27", "Jul '27", "Aug '27", "Sep '27", "Oct '27", "Nov '27", "Dec '27",
    "Jan '28", "Feb '28", "Mar '28", "Apr '28", "May '28", "Jun '28", "Jul '28", "Aug '28", "Sep '28", "Oct '28", "Nov '28", "Dec '28",
    "Jan '29", "Feb '29", "Mar '29", "Apr '29", "May '29", "Jun '29", "Jul '29", "Aug '29", "Sep '29", "Oct '29", "Nov '29", "Dec '29"
  ];
  const monthName = MONTHS[monthIndex] || `Month ${monthIndex + 1}`;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-16 z-[10000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-2xl h-[75vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">{monthName}</div>
            <h2 className="text-xl font-semibold text-emerald-600 underline cursor-pointer flex items-center gap-2" onClick={() => onEditBatch?.()}>
              {batch.name.split('\n')[0]}
              <Edit2 size={16} />
            </h2>
            <div className="text-sm text-gray-600 mt-1">
              Month {monthsSinceInstallation} • {percentDeployed.toFixed(0)}% live ({Math.round(totalGpusDeployed).toLocaleString()} GPUs)
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Deployment Section */}
        {onUpdateDeployment && monthsSinceInstallation >= 1 && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Adjust Total Live by End of this Month
            </div>
            <div className="flex items-center gap-4">
              {/* Progress bar */}
              <div 
                className="flex-1 h-8 bg-gray-200 rounded-lg overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = Math.round((x / rect.width) * 100);
                  const targetTotal = Math.max(0, Math.min(100, percentage));
                  const previousTotal = percentDeployed - deploymentThisMonth;
                  const newDeploymentThisMonth = targetTotal - previousTotal;
                  onUpdateDeployment(batch.id, monthIndex, newDeploymentThisMonth);
                }}
              >
                <div 
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${Math.round(percentDeployed)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-700">
                  {Math.round(percentDeployed)}%
                </div>
              </div>
              {/* Text input */}
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={Math.round(percentDeployed)}
                onChange={(e) => {
                  const targetTotal = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                  const previousTotal = percentDeployed - deploymentThisMonth;
                  const newDeploymentThisMonth = targetTotal - previousTotal;
                  onUpdateDeployment(batch.id, monthIndex, newDeploymentThisMonth);
                }}
                className="w-20 px-3 py-2 border border-gray-300 rounded text-sm text-right"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {deploymentThisMonth > 0 
                ? `Going live: ${Math.round(newGpusDeployed).toLocaleString()} GPUs this month (+${deploymentThisMonth}%)`
                : deploymentThisMonth < 0
                ? `Reducing by ${Math.round(Math.abs(newGpusDeployed)).toLocaleString()} GPUs this month (${deploymentThisMonth}%)`
                : 'No change this month'}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Revenue Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-600">Revenue:</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 pr-4">GPU Rental Revenue</td>
                  <td className="py-1 pr-4 text-gray-600">
                    {Math.round(totalGpusDeployed).toLocaleString()} GPUs × {hoursPerMonth} hrs × <ClickableVariable title="Click to edit utilization rate" field="utilizationRate" onOpenSettings={onOpenSettings}>{(utilizationRate * 100).toFixed(0)}%</ClickableVariable> × <ClickableVariable title="Click to edit GPU hour rate" field={`gpuHourRate.${chipKey}`} onOpenSettings={onOpenSettings}>${gpuHourRate.toFixed(2)}/hr</ClickableVariable>
                  </td>
                  <td className="py-1 text-right font-medium">{formatValue(monthlyRevenue)}</td>
                </tr>
                <tr className="border-t border-gray-300">
                  <td className="py-2 pr-4 font-semibold">Total Revenue</td>
                  <td className="py-2 pr-4"></td>
                  <td className="py-2 text-right font-bold">{formatValue(monthlyRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Costs Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-red-600">Costs:</h3>
            <table className="w-full text-sm">
              <tbody>
                {deploymentThisMonth > 0 && (
                  <tr>
                    <td className="py-1 pr-4">Installation Cost</td>
                    <td className="py-1 pr-4 text-gray-600">
                      {Math.round(newGpusDeployed).toLocaleString()} × <ClickableVariable title="Click to edit installation cost" field={`installationCost.${chipKey}`} onOpenSettings={onOpenSettings}>${installationCostPerGpu}</ClickableVariable>
                    </td>
                    <td className="py-1 text-right font-medium">{formatValue(installationCost)}</td>
                  </tr>
                )}
                {gpuCostThisMonth > 0 && (
                  <>
                    <tr>
                      <td className="py-1 pr-4">
                        {isCashPurchase ? 'GPU Cost (Cash)' : `GPU Payment (Month ${monthsSinceInstallation}/${batch.leaseTerm || 36})`}
                      </td>
                      <td className="py-1 pr-4 text-gray-600">
                        {isCashPurchase 
                          ? `${batch.quantity.toLocaleString()} × $${upfrontCostPerGpu.toLocaleString()}`
                          : `$${totalBatchGpuCost.toLocaleString()} @ `
                        }
                        {!isCashPurchase && (
                          <>
                            <span 
                              className="bg-yellow-200 px-1 cursor-pointer hover:bg-yellow-300 transition-colors"
                              onClick={() => onEditBatch?.('apr')}
                              title="Click to edit batch financing terms"
                            >
                              {batch.apr}%
                            </span>
                            {' '}APR / {' '}
                            <span 
                              className="bg-yellow-200 px-1 cursor-pointer hover:bg-yellow-300 transition-colors"
                              onClick={() => onEditBatch?.('leaseTerm')}
                              title="Click to edit batch financing terms"
                            >
                              {batch.leaseTerm || 36} mo
                            </span>
                          </>
                        )}
                      </td>
                      <td className="py-1 text-right font-medium">{formatValue(gpuCostThisMonth)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="py-1 pr-4">Datacenter Overhead</td>
                  <td className="py-1 pr-4 text-gray-600">
                    {Math.round(totalGpusDeployed).toLocaleString()} × <ClickableVariable title="Click to edit datacenter overhead" field="datacenterOverhead" onOpenSettings={onOpenSettings}>${datacenterOverheadPerGpu}/mo</ClickableVariable>
                  </td>
                  <td className="py-1 text-right font-medium">{formatValue(datacenterOverheadCost)}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Electrical Cost</td>
                  <td className="py-1 pr-4 text-gray-600">
                    {hoursGpusRun.toFixed(0)} hrs × {totalPowerKw.toFixed(1)} kW × <ClickableVariable title="Click to edit electricity cost" field="electricityCost" onOpenSettings={onOpenSettings}>${settings.electricityCost}/kWh</ClickableVariable> × <ClickableVariable title="Click to edit PUE" field="electricalOverhead" onOpenSettings={onOpenSettings}>{settings.electricalOverhead}x PUE</ClickableVariable>
                  </td>
                  <td className="py-1 text-right font-medium">{formatValue(electricalCost)}</td>
                </tr>
                <tr className="border-t border-gray-300">
                  <td className="py-2 pr-4 font-semibold">Total Costs</td>
                  <td className="py-2 pr-4"></td>
                  <td className="py-2 text-right font-bold">{formatValue(totalCosts)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Profit This Month */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-3">Net Profit This Month:</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 pr-4">Revenue</td>
                  <td className="py-1 pr-4"></td>
                  <td className="py-1 text-right font-medium">{formatValue(monthlyRevenue)}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Costs</td>
                  <td className="py-1 pr-4"></td>
                  <td className="py-1 text-right font-medium">-{formatValue(totalCosts)}</td>
                </tr>
                <tr className="border-t border-gray-300">
                  <td className="py-2 pr-4 font-semibold">Net Profit</td>
                  <td className="py-2 pr-4"></td>
                  <td className="py-2 text-right font-bold" style={{ color: netProfitThisMonth >= 0 ? '#047857' : '#991b1b' }}>
                    {formatValue(netProfitThisMonth)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cumulative Impact */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-3">Cumulative Impact:</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 pr-4">Previous Cumulative</td>
                  <td className="py-1 pr-4"></td>
                  <td className="py-1 text-right font-medium">{formatValue(previousCumulative)}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">This Month's Impact</td>
                  <td className="py-1 pr-4"></td>
                  <td className="py-1 text-right font-medium">{formatValue(netProfitThisMonth)}</td>
                </tr>
                <tr className="border-t border-gray-300">
                  <td className="py-2 pr-4 font-semibold">New Cumulative Total</td>
                  <td className="py-2 pr-4"></td>
                  <td className="py-2 text-right font-bold" style={{ color: cumulativeProfit >= 0 ? '#047857' : '#991b1b' }}>
                    {formatValue(cumulativeProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
