import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ChipType, Batch, Site } from '../types';
import { useModalBackdrop } from './ModalBackdrop';
import { ClickableVariable } from './ClickableVariable';
import { ProfitabilitySettings } from './SettingsModal';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (batch: Omit<Batch, 'id'>) => void;
  sites: Site[];
  onEditSite: (siteId: string) => void;
  onOpenSettings: (field?: string) => void;
  settings: ProfitabilitySettings;
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({ isOpen, onClose, onSave, sites, onEditSite, onOpenSettings, settings }) => {
  useModalBackdrop(isOpen);
  const [formData, setFormData] = useState<{
    chipType: ChipType;
    quantity: number;
    installationMonth: number;
    installationYear: number;
    siteId: string;
    dateAnnounced: string;
    fundingType: 'Cash' | 'Lease';
    leaseType: 'FMV' | null;
    residualCap?: number;
    leaseTerm?: number;
    apr?: number;
  }>({
    chipType: 'B200' as ChipType,
    quantity: 100,
    installationMonth: new Date().getMonth(),
    installationYear: new Date().getFullYear(),
    siteId: sites.length > 0 ? sites[0].id : 'site-canal-flats',
    dateAnnounced: new Date().toISOString().split('T')[0],
    fundingType: 'Lease',
    leaseType: 'FMV',
    residualCap: 20,
    leaseTerm: 36,
    apr: 9,
  });

  const getGpusPerMW = () => {
    const chipKey = formData.chipType.toLowerCase() as 'b200' | 'b300' | 'gb300' | 'h100' | 'h200' | 'mi350x';
    return settings.gpusPerMW[chipKey];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const gpusPerMW = getGpusPerMW();
    const mwEquivalent = (formData.quantity / gpusPerMW).toFixed(2);
    const site = sites.find(s => s.id === formData.siteId);
    const siteName = site ? site.name : '';
    const batch: Omit<Batch, 'id'> = {
      name: `${formData.quantity.toLocaleString()} ${formData.chipType}s\n(${mwEquivalent}MW${siteName ? ` • ${siteName}` : ''})`,
      chipType: formData.chipType,
      quantity: formData.quantity,
      installationMonth: formData.installationMonth,
      installationYear: formData.installationYear,
      siteId: formData.siteId,
      dateAnnounced: formData.dateAnnounced,
      fundingType: formData.fundingType,
      leaseType: formData.fundingType === 'Lease' ? formData.leaseType : null,
      residualCap: formData.fundingType === 'Lease' ? formData.residualCap : undefined,
      leaseTerm: formData.fundingType === 'Lease' ? formData.leaseTerm : undefined,
      apr: formData.fundingType === 'Lease' ? formData.apr : undefined,
      phases: {
        installation: {
          duration: 1, // Default 1 month
          costPerUnit: 0, // Not used - costs come from global settings
        },
        burnIn: {
          duration: 1, // Default 1 month
          costPerUnit: 0, // Not used
        },
        live: {
          revenuePerUnit: 0, // Calculated from settings, not stored per batch
        },
      },
    };

    onSave(batch);
    onClose();
    
    // Reset form
    setFormData({
      chipType: 'B200',
      quantity: 100,
      installationMonth: new Date().getMonth(),
      installationYear: new Date().getFullYear(),
      siteId: sites.length > 0 ? sites[0].id : 'site-canal-flats',
      dateAnnounced: new Date().toISOString().split('T')[0],
      fundingType: 'Lease',
      leaseType: 'FMV',
      residualCap: 20,
      leaseTerm: 36,
      apr: 9,
    });
  };

  if (!isOpen) return null;

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-16 z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[75vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">New Batch</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chip Type
            </label>
            <select
              value={formData.chipType}
              onChange={(e) => setFormData({ ...formData, chipType: e.target.value as ChipType })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="B200">B200</option>
              <option value="B300">B300</option>
              <option value="GB300">GB300</option>
              <option value="H100">H100</option>
              <option value="H200">H200</option>
              <option value="MI350X">MI350X</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity (Number of GPUs)
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.quantity && formData.chipType ? (
                <span>
                  ≈ {formData.quantity.toLocaleString()} ÷ <ClickableVariable title="Click to edit GPUs per MW in settings" field={`gpusPerMW.${formData.chipType.toLowerCase()}`} onOpenSettings={onOpenSettings}>{getGpusPerMW()}</ClickableVariable> = {(formData.quantity / getGpusPerMW()).toFixed(2)}MW
                </span>
              ) : (
                'Enter quantity to see MW equivalent'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Installation Month
              </label>
              <select
                value={formData.installationMonth}
                onChange={(e) => setFormData({ ...formData, installationMonth: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={formData.installationYear}
                onChange={(e) => setFormData({ ...formData, installationYear: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="2024"
                max="2030"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Announced
            </label>
            <input
              type="date"
              value={formData.dateAnnounced}
              onChange={(e) => setFormData({ ...formData, dateAnnounced: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Funding Type
              </label>
              <select
                value={formData.fundingType}
                onChange={(e) => {
                  const fundingType = e.target.value as 'Cash' | 'Lease';
                  setFormData({ 
                    ...formData, 
                    fundingType,
                    leaseType: fundingType === 'Lease' ? 'FMV' : null,
                    residualCap: fundingType === 'Lease' ? 20 : undefined,
                    leaseTerm: fundingType === 'Lease' ? 36 : undefined,
                    apr: fundingType === 'Lease' ? 9 : undefined
                  });
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Cash">Cash</option>
                <option value="Lease">Lease</option>
              </select>
            </div>
            {formData.fundingType === 'Lease' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lease Type
                </label>
                <select
                  value={formData.leaseType || ''}
                  onChange={(e) => setFormData({ ...formData, leaseType: e.target.value as 'FMV' })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="FMV">FMV</option>
                </select>
              </div>
            )}
          </div>

          {formData.fundingType === 'Lease' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Residual Cap (%)
                </label>
                <input
                  type="number"
                  value={formData.residualCap}
                  onChange={(e) => setFormData({ ...formData, residualCap: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term (months)
                </label>
                <input
                  type="number"
                  value={formData.leaseTerm}
                  onChange={(e) => setFormData({ ...formData, leaseTerm: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  APR (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.apr}
                  onChange={(e) => setFormData({ ...formData, apr: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site
            </label>
            <div className="flex items-center gap-2">
              <select
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.capacityMW} MW)
                  </option>
                ))}
              </select>
              {formData.siteId && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSite(formData.siteId);
                  }}
                  className="px-3 py-2 text-sm text-green-600 border border-green-600 rounded-md hover:bg-green-50"
                >
                  Edit Site
                </button>
              )}
            </div>
          </div>

        </form>
        </div>
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-400 text-white rounded-md hover:bg-green-500"
            >
              Add Batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
