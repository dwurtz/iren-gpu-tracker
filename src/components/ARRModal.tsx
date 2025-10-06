import React from 'react';
import { X } from 'lucide-react';
import { Batch } from '../types';
import { useModalBackdrop } from './ModalBackdrop';

interface ARRModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthIndex: number;
  batches: Batch[];
  allBatchData: { value: number; percentDeployed: number }[][];
  settings: {
    utilizationRate: number;
    gpuHourRate: {
      b200: number;
      b300: number;
      gb300: number;
      h100: number;
      h200: number;
      mi350x: number;
    };
  };
  onOpenCellModal?: (batch: Batch, monthIndex: number) => void;
}

const ARRModal: React.FC<ARRModalProps> = ({
  isOpen,
  onClose,
  monthIndex,
  batches,
  allBatchData,
  settings,
  onOpenCellModal
}) => {
  useModalBackdrop(isOpen);
  
  if (!isOpen) return null;

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

  // Calculate ARR breakdown for this month
  const calculateARRBreakdown = () => {
    const monthNames = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const monthName = monthNames[monthIndex] || `Month ${monthIndex + 1}`;
    
    // Calculate year based on monthIndex (0=Sep 2025, 4=Jan 2026, etc.)
    const year = 2025 + Math.floor((monthIndex + 4) / 12); // +4 because we start at Sep (month 9)
    const displayName = `${monthName} ${year}`;
    
    const liveBatches: Array<{
      batch: Batch;
      gpuCount: number;
      monthlyRevenue: number;
      annualRevenue: number;
      installDate: string;
      sortKey: number;
    }> = [];

    let totalLiveGPUs = 0;
    let totalARR = 0;

    // Find all batches that have live GPUs in this month
    batches.forEach((batch, batchIndex) => {
      const batchData = allBatchData[batchIndex];
      if (batchData && batchData[monthIndex]) {
        const percentDeployed = batchData[monthIndex].percentDeployed;
        if (percentDeployed > 0) {
          const gpuCount = (percentDeployed / 100) * (batch.quantity || 0);
          totalLiveGPUs += gpuCount;

        // Calculate revenue for this batch - chip-specific
        const hoursPerMonth = 730;
        const utilizationRate = settings.utilizationRate / 100;
        const chipKey = batch.chipType.toLowerCase() as 'b200' | 'b300' | 'gb300' | 'h100' | 'h200' | 'mi350x';
        const gpuHourRate = settings.gpuHourRate[chipKey];
        const monthlyRevenuePerGPU = hoursPerMonth * utilizationRate * gpuHourRate;
        const monthlyRevenue = gpuCount * monthlyRevenuePerGPU;
        const annualRevenue = monthlyRevenue * 12;
        totalARR += annualRevenue;

        // Format install date
        // installationMonth is 0-11 where 0=Jan, 8=Sep
        const monthNamesForIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const installMonth = monthNamesForIndex[batch.installationMonth] || batch.installationMonth.toString();
        const installDate = `${installMonth} ${batch.installationYear}`;

        // Create sort key: year * 100 + month for chronological sorting
        const sortKey = batch.installationYear * 100 + batch.installationMonth;

        liveBatches.push({
          batch,
          gpuCount,
          monthlyRevenue,
          annualRevenue,
          installDate,
          sortKey
        });
        }
      }
    });

    // Sort by installation date (oldest first)
    liveBatches.sort((a, b) => a.sortKey - b.sortKey);

    return {
      monthName,
      displayName,
      totalLiveGPUs,
      totalARR,
      liveBatches
    };
  };

  const breakdown = calculateARRBreakdown();

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-16 z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">ARR Calculation - {breakdown.displayName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Batch Contributions */}
            {breakdown.liveBatches.length > 0 ? (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Batch Contributions</h3>
                <div className="space-y-2">
                  {breakdown.liveBatches.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div className="col-span-2">
                        <div className="text-sm font-medium text-blue-600 bg-blue-50 rounded px-3 py-1 text-center">
                          {item.installDate}
                        </div>
                      </div>
                      <div className="col-span-5">
                        <div 
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenCellModal) {
                              onOpenCellModal(item.batch, monthIndex);
                              // Don't close - keep ARR modal open in background
                            }
                          }}
                        >
                          {item.batch.name}
                        </div>
                      </div>
                      <div className="col-span-5 text-right">
                        <div className="text-sm text-gray-600">
                          {formatValue(item.monthlyRevenue)} × 12 = <span className="font-medium text-green-600">{formatValue(item.annualRevenue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total ARR */}
                <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-gray-300">
                  <span className="text-lg font-semibold">Total ARR:</span>
                  <span className="text-xl font-bold text-green-600">{formatValue(breakdown.totalARR)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-500">No GPUs are live in {breakdown.monthName}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARRModal;
