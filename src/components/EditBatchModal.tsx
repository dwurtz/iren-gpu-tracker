import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Batch, ChipType, Site } from '../types';
import { useModalBackdrop } from './ModalBackdrop';
import { ClickableVariable } from './ClickableVariable';
import { ProfitabilitySettings } from './SettingsModal';

interface EditBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  onSave: (updatedBatch: Batch) => void;
  sites: Site[];
  onEditSite: (siteId: string) => void;
  onOpenSettings: (field?: string) => void;
  settings: ProfitabilitySettings;
  highlightField?: string;
}

export const EditBatchModal: React.FC<EditBatchModalProps> = ({ isOpen, onClose, batch, onSave, sites, onEditSite, onOpenSettings, settings, highlightField }) => {
  useModalBackdrop(isOpen);
  const [formData, setFormData] = useState<Partial<Batch>>(batch || {});

  // Function to get highlight classes for pulsing effect
  const getHighlightClass = (fieldName: string) => {
    if (highlightField === fieldName) {
      return "animate-pulse bg-yellow-200 border-yellow-400";
    }
    return "";
  };

  React.useEffect(() => {
    if (batch) {
      setFormData(batch);
    }
  }, [batch]);

  const getGpusPerMW = () => {
    if (!formData.chipType) return 532;
    const chipKey = formData.chipType.toLowerCase() as 'b200' | 'b300' | 'gb300' | 'h100' | 'h200' | 'mi350x';
    return settings.gpusPerMW[chipKey];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !formData.quantity || !formData.chipType) return;

    const gpusPerMW = getGpusPerMW();
    const mwEquivalent = (formData.quantity / gpusPerMW).toFixed(2);
    const site = sites.find(s => s.id === formData.siteId);
    const siteName = site ? site.name : '';
    const updatedBatch: Batch = {
      ...batch,
      ...formData,
      name: `${formData.quantity.toLocaleString()} ${formData.chipType}s\n(${mwEquivalent}MW${siteName ? ` • ${siteName}` : ''})`,
      quantity: formData.quantity,
      chipType: formData.chipType,
    };

    onSave(updatedBatch);
    onClose();
  };

  if (!isOpen || !batch) return null;

  // Format the installation month and year for the header
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const installMonth = monthNames[batch.installationMonth] || batch.installationMonth.toString();
  const installDate = `${installMonth} ${batch.installationYear}`;

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-16 z-[10001]">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Edit Batch - {installDate}</h2>
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
              value={formData.chipType || ''}
              onChange={(e) => setFormData({ ...formData, chipType: e.target.value as ChipType })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select chip type</option>
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
              value={formData.quantity || ''}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="1"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Installation Start Date
            </label>
            <input
              type="month"
              value={`${formData.installationYear}-${String((formData.installationMonth || 0) + 1).padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                setFormData({ 
                  ...formData, 
                  installationYear: parseInt(year),
                  installationMonth: parseInt(month) - 1
                });
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Announced
            </label>
            <input
              type="date"
              value={formData.dateAnnounced || ''}
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
                value={formData.fundingType || 'Lease'}
                onChange={(e) => {
                  const fundingType = e.target.value as 'Cash' | 'Lease';
                  setFormData({ 
                    ...formData, 
                    fundingType,
                    leaseType: fundingType === 'Lease' ? 'FMV' : null,
                    residualCap: fundingType === 'Lease' ? (formData.residualCap || 20) : undefined,
                    leaseTerm: fundingType === 'Lease' ? (formData.leaseTerm || 36) : undefined,
                    apr: fundingType === 'Lease' ? (formData.apr || 9) : undefined
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
                  value={formData.leaseType || 'FMV'}
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
                  value={formData.residualCap || 20}
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
                  value={formData.leaseTerm || 36}
                  onChange={(e) => setFormData({ ...formData, leaseTerm: parseInt(e.target.value) })}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('leaseTerm')}`}
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
                  value={formData.apr || 9}
                  onChange={(e) => setFormData({ ...formData, apr: parseFloat(e.target.value) })}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${getHighlightClass('apr')}`}
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
                value={formData.siteId || ''}
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
                    onEditSite(formData.siteId!);
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
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
