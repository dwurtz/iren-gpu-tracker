import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Batch, ChipType, Site } from '../types';
import { useModalBackdrop } from './ModalBackdrop';

interface EditBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  onSave: (updatedBatch: Batch) => void;
  sites: Site[];
  onEditSite: (siteId: string) => void;
}

export const EditBatchModal: React.FC<EditBatchModalProps> = ({ isOpen, onClose, batch, onSave, sites, onEditSite }) => {
  useModalBackdrop(isOpen);
  const [formData, setFormData] = useState<Partial<Batch>>(batch || {});

  React.useEffect(() => {
    if (batch) {
      setFormData(batch);
    }
  }, [batch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !formData.quantity || !formData.chipType) return;

    const mwEquivalent = Math.round(formData.quantity / (formData.chipType === 'B200' ? 532 : 432));
    const updatedBatch: Batch = {
      ...batch,
      ...formData,
      name: `${formData.quantity.toLocaleString()} ${formData.chipType}s\n(${mwEquivalent}MW)`,
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
    <div className="fixed inset-0 flex items-start justify-center pt-16 z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[75vh] flex flex-col shadow-2xl">
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
              <option value="GB300">GB300</option>
              <option value="H100">H100</option>
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
              {formData.quantity && formData.chipType ? 
                `≈ ${(formData.quantity / (formData.chipType === 'B200' ? 532 : 432)).toFixed(2)}MW` : 
                'Enter quantity to see MW equivalent'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Installation Month
            </label>
            <select
              value={formData.installationMonth !== undefined ? formData.installationMonth : ''}
              onChange={(e) => setFormData({ ...formData, installationMonth: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select month</option>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Installation Year
            </label>
            <input
              type="number"
              value={formData.installationYear || ''}
              onChange={(e) => setFormData({ ...formData, installationYear: parseInt(e.target.value) || new Date().getFullYear() })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="2025"
              max="2030"
            />
          </div>

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
                  className="px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
