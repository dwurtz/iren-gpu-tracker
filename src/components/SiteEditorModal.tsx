import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Site, Batch } from '../types';
import { useModalBackdrop } from './ModalBackdrop';

interface SiteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: Site | null;
  onSave: (updatedSite: Site) => void;
  batches: Batch[];
}

export const SiteEditorModal: React.FC<SiteEditorModalProps> = ({ isOpen, onClose, site, onSave, batches }) => {
  useModalBackdrop(isOpen);
  const [formData, setFormData] = useState<Partial<Site>>(site || {});

  React.useEffect(() => {
    if (site) {
      setFormData(site);
    }
  }, [site]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!site || !formData.name || !formData.capacityMW) return;

    const updatedSite: Site = {
      ...site,
      ...formData,
      name: formData.name,
      location: formData.location || site.location,
      capacityMW: formData.capacityMW,
      status: formData.status || site.status,
    };

    onSave(updatedSite);
    onClose();
  };

  if (!isOpen || !site) return null;

  // Calculate utilization
  const allocatedMW = batches
    .filter(batch => batch.siteId === site.id)
    .reduce((total, batch) => {
      // Calculate MW for this batch based on chip type
      const gpusPerMW = batch.chipType === 'B200' ? 532 : 432;
      const batchMW = batch.quantity / gpusPerMW;
      return total + batchMW;
    }, 0);
  
  const utilizationPercent = site.capacityMW > 0 ? (allocatedMW / site.capacityMW) * 100 : 0;

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-16 z-[10002]">
      <div className="bg-white rounded-lg w-full max-w-2xl h-[75vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Edit Site - {site.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Utilization Display */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Site Utilization</span>
              <span className="text-lg font-bold text-blue-600">{utilizationPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all ${utilizationPercent > 100 ? 'bg-red-600' : utilizationPercent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
              <span>{allocatedMW.toFixed(1)} MW allocated</span>
              <span>{site.capacityMW} MW capacity</span>
            </div>
            {utilizationPercent > 100 && (
              <div className="mt-2 text-sm text-red-600 font-medium">
                ⚠️ Warning: Site is over capacity by {(allocatedMW - site.capacityMW).toFixed(1)} MW
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (MW)
              </label>
              <input
                type="number"
                value={formData.capacityMW || ''}
                onChange={(e) => setFormData({ ...formData, capacityMW: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
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

