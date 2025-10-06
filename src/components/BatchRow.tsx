import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Batch, MonthData } from '../types';
import { CellDetailModal } from './CellDetailModal';

interface BatchRowProps {
  batch: Batch;
  monthlyData: MonthData[];
  onEdit: (batch: Batch) => void;
  onDelete: (batchId: string) => void;
  onEditSite?: (siteId: string) => void;
  isFirstOfYear?: boolean;
  selectedCell?: { batchId: string; monthIndex: number } | null;
  onCellSelect?: (batchId: string, monthIndex: number) => void;
  onClearSelection?: () => void;
  globalMinValue?: number;
  globalMaxValue?: number;
  settings?: any; // ProfitabilitySettings
  onOpenSettings?: (field?: string) => void;
  onUpdateDeployment?: (batchId: string, monthIndex: number, percentage: number) => void;
}


export const BatchRow: React.FC<BatchRowProps> = ({ 
  batch, 
  monthlyData, 
  onEdit, 
  onDelete, 
  isFirstOfYear = false, 
  selectedCell, 
  onCellSelect, 
  onClearSelection, 
  globalMinValue, 
  globalMaxValue, 
  settings, 
  onOpenSettings,
  onUpdateDeployment
}) => {
  const [modalCell, setModalCell] = useState<{
    monthIndex: number;
    percentDeployed: number;
    cumulativeProfit: number;
    monthlyValue: number;
    previousCumulative?: number;
  } | null>(null);

  // Update modal when selected cell changes via arrow keys
  useEffect(() => {
    if (selectedCell?.batchId === batch.id && modalCell !== null && selectedCell) {
      const data = monthlyData[selectedCell.monthIndex];
      if (data && data.percentDeployed > 0) {
        // Find the previous cell that actually has data
        let previousCumulative = 0;
        for (let i = selectedCell.monthIndex - 1; i >= 0; i--) {
          if (monthlyData[i] && monthlyData[i].percentDeployed > 0) {
            previousCumulative = monthlyData[i].value;
            break;
          }
        }
        
        setModalCell({
          monthIndex: selectedCell.monthIndex,
          percentDeployed: data.percentDeployed,
          cumulativeProfit: data.value,
          monthlyValue: 0,
          previousCumulative
        });
      }
    }
  }, [selectedCell?.batchId, selectedCell?.monthIndex, batch.id, monthlyData]);

  const formatValue = (value: number) => {
    if (value === 0) return '';
    const sign = value < 0 ? '-' : '';
    const absValue = Math.abs(value);
    
    if (absValue >= 1000000000) {
      const billions = absValue / 1000000000;
      return `${sign}$${billions.toFixed(1)}B`;
    } else if (absValue >= 1000000) {
      const millions = absValue / 1000000;
      return `${sign}$${millions.toFixed(0)}M`;
    } else {
      const thousands = absValue / 1000;
      return `${sign}$${thousands.toFixed(0)}K`;
    }
  };

  const getProfitColorStyle = (value: number, percentDeployed: number) => {
    // Empty cells are gray
    if (percentDeployed === 0) {
      return {
        backgroundColor: '#f9fafb',
        color: '#374151',
      };
    }

    // Use global min/max for consistent scaling
    const maxLoss = globalMinValue || -100000000;
    const maxProfit = globalMaxValue || 100000000;

    if (value < 0) {
      // Red gradient for losses
      const intensity = Math.abs(value) / Math.abs(maxLoss); // Linear scale
      const red = Math.round(220 + (255 - 220) * intensity);
      const green = Math.round(180 - 100 * intensity);
      const blue = Math.round(180 - 100 * intensity);
      
      return {
        backgroundColor: `rgb(${red}, ${green}, ${blue})`,
        color: intensity > 0.3 ? '#7f1d1d' : '#991b1b',
      };
    } else {
      // Green gradient for profits
      const intensity = value / maxProfit; // Linear scale
      const red = Math.round(180 - 80 * intensity);
      const green = Math.round(220 - 40 * intensity);
      const blue = Math.round(180 - 80 * intensity);
      
      return {
        backgroundColor: `rgb(${red}, ${green}, ${blue})`,
        color: intensity > 0.3 ? '#065f46' : '#047857',
      };
    }
  };

  const handleCellClick = (index: number) => {
    const data = monthlyData[index];
    // Check if this is a valid month for this batch (after installation start)
    const batchStartIndex = (batch.installationYear - 2023) * 12 + (batch.installationMonth - 7);
    if (data && index >= batchStartIndex) {
      onCellSelect?.(batch.id, index);
      
      // Find previous cumulative value
      let previousCumulative = 0;
      for (let i = index - 1; i >= batchStartIndex; i--) {
        if (monthlyData[i]) {
          previousCumulative = monthlyData[i].value;
          break;
        }
      }
      
      setModalCell({
        monthIndex: index,
        percentDeployed: data.percentDeployed,
        cumulativeProfit: data.value,
        monthlyValue: 0,
        previousCumulative
      });
    }
  };

  // Calculate final profit (last non-zero value)
  const finalProfit = monthlyData.reduce((max, data) => data.value !== 0 ? data.value : max, 0);

  // Parse batch name to extract quantity, chip type, MW, and site
  const batchNameLines = batch.name.split('\n');
  const batchTitle = batchNameLines[0];
  const batchSubtext = batchNameLines[1] || '';

  return (
    <tr className={`border-t border-gray-200 ${isFirstOfYear ? 'border-t-2' : ''} hover:bg-gray-50`}>
      <td className="px-4 py-3 text-left sticky left-0 bg-white z-20 border-r border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-emerald-600 underline cursor-pointer" onClick={() => onEdit(batch)}>
              {batchTitle}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {batchSubtext}
            </div>
          </div>
          <div className="flex space-x-1 ml-2">
            <button
              onClick={() => onEdit(batch)}
              className="text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(batch.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </td>
      
      {monthlyData.map((data, index) => {
        const isSelected = selectedCell?.batchId === batch.id && selectedCell?.monthIndex === index;
        const isYearBoundary = index === 4 || index === 16 || index === 28 || index === 40 || index === 52 || index === 64;
        const isFirstMonth = index === 0;
        
        // Check if this month is after batch installation started
        const batchStartIndex = (batch.installationYear - 2023) * 12 + (batch.installationMonth - 7);
        const isBatchActive = index >= batchStartIndex;
        
        // Check if previous month was already at 100%
        const prevData = index > 0 ? monthlyData[index - 1] : null;
        const wasFullyDeployed = prevData && prevData.percentDeployed === 100;
        
        return (
          <td 
            key={index}
            data-batch-id={batch.id}
            data-month-index={index}
            className={`px-2 py-2 text-center text-sm ${isFirstMonth ? 'border-l border-gray-200' : ''} ${isYearBoundary ? 'border-r-2 border-gray-200' : 'border-r border-gray-200'} ${isBatchActive ? 'cursor-pointer hover:opacity-80' : ''}`}
            style={{
              minWidth: '100px',
              ...getProfitColorStyle(data.value, data.percentDeployed),
              ...(isSelected ? { 
                outline: '3px solid white',
                outlineOffset: '-3px',
                zIndex: 10,
                position: 'relative'
              } : {})
            }}
            onClick={() => isBatchActive && handleCellClick(index)}
          >
            <div className="space-y-1">
              {isBatchActive && (
                <>
                  {!wasFullyDeployed && (
                    <div className="text-xs opacity-75">
                      {data.percentDeployed.toFixed(0)}% deployed
                    </div>
                  )}
                  <div className="font-medium">
                    {formatValue(data.value)}
                  </div>
                </>
              )}
            </div>
          </td>
        );
      })}
      
      <td className="px-4 py-3 text-center font-medium sticky right-0 bg-white z-30 border-l">
        <div className={finalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
          {formatValue(finalProfit)}
        </div>
      </td>
      
      <CellDetailModal
        isOpen={modalCell !== null}
        onClose={() => {
          setModalCell(null);
          setTimeout(() => {
            onClearSelection?.();
          }, 0);
        }}
        batch={batch}
        monthIndex={modalCell?.monthIndex || 0}
        percentDeployed={modalCell?.percentDeployed || 0}
        cumulativeProfit={modalCell?.cumulativeProfit || 0}
        monthlyValue={modalCell?.monthlyValue || 0}
        previousCumulative={modalCell?.previousCumulative || 0}
        settings={settings || {} as any}
        onOpenSettings={onOpenSettings || (() => {})}
        onEditBatch={() => onEdit(batch)}
        onUpdateDeployment={onUpdateDeployment}
      />
    </tr>
  );
};
