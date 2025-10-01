import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ChipType, Batch, Site } from '../types';
import { useModalBackdrop } from './ModalBackdrop';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (batch: Omit<Batch, 'id'>) => void;
  sites: Site[];
  onEditSite: (siteId: string) => void;
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({ isOpen, onClose, onSave, sites, onEditSite }) => {
  useModalBackdrop(isOpen);
  const [formData, setFormData] = useState({
    name: '',
    chipType: 'B200' as ChipType,
    quantity: 100,
    installationMonth: new Date().getMonth(),
    installationYear: new Date().getFullYear(),
    siteId: sites.length > 0 ? sites[0].id : 'site-canal-flats',
    installationDuration: 1,
    installationCost: 1523,
    burnInDuration: 1,
    burnInCost: 1723,
    liveRevenue: 400,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const batch: Omit<Batch, 'id'> = {
      name: formData.name,
      chipType: formData.chipType,
      quantity: formData.quantity,
      installationMonth: formData.installationMonth,
      installationYear: formData.installationYear,
      siteId: formData.siteId,
      phases: {
        installation: {
          duration: formData.installationDuration,
          costPerUnit: formData.installationCost,
        },
        burnIn: {
          duration: formData.burnInDuration,
          costPerUnit: formData.burnInCost,
        },
        live: {
          revenuePerUnit: formData.liveRevenue,
        },
      },
    };

    onSave(batch);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      chipType: 'B200',
      quantity: 100,
      installationMonth: new Date().getMonth(),
      installationYear: new Date().getFullYear(),
      installationDuration: 1,
      installationCost: 1523,
      burnInDuration: 1,
      burnInCost: 1723,
      liveRevenue: 400,
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
              Batch Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 502 B200"
              required
            />
          </div>

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
              <option value="GB300">GB300</option>
              <option value="H100">H100</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              required
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Installation Cost per Unit
              </label>
              <input
                type="number"
                value={formData.installationCost}
                onChange={(e) => setFormData({ ...formData, installationCost: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Burn-in Cost per Unit
              </label>
              <input
                type="number"
                value={formData.burnInCost}
                onChange={(e) => setFormData({ ...formData, burnInCost: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Live Revenue per Unit (monthly)
            </label>
            <input
              type="number"
              value={formData.liveRevenue}
              onChange={(e) => setFormData({ ...formData, liveRevenue: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>

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
              Add Batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
