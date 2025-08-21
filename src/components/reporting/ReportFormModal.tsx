'use client';

import { useState, useEffect } from 'react';
import { 
  Report, 
  CreateReportData, 
  UpdateReportData, 
  ReportType, 
  ExportFormat, 
  ScheduleFrequency,
  ReportFilters 
} from '@/types/reports';
import { LoadService } from '@/services/loadService';
import { Customer } from '@/types/loads';

interface ReportFormModalProps {
  report?: Report;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReportData | UpdateReportData) => void;
  loading?: boolean;
}

export default function ReportFormModal({ 
  report, 
  isOpen, 
  onClose, 
  onSubmit, 
  loading 
}: ReportFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'loads' as ReportType,
    description: '',
    format: 'csv' as ExportFormat,
    scheduled: false,
    schedule_frequency: undefined as ScheduleFrequency | undefined,
    filters: {} as ReportFilters
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [carriers, setCarriers] = useState<Array<{ id: number; name: string }>>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        type: report.type,
        description: report.description || '',
        format: 'csv', // Default format for editing
        scheduled: report.scheduled,
        schedule_frequency: report.schedule_frequency || undefined,
        filters: report.filters || {}
      });
    } else {
      setFormData({
        name: '',
        type: 'loads',
        description: '',
        format: 'csv',
        scheduled: false,
        schedule_frequency: undefined,
        filters: {}
      });
    }
  }, [report]);

  useEffect(() => {
    // Load supporting data for filters
    const loadSupportingData = async () => {
      try {
        const [customersData, carriersData, equipmentTypesData] = await Promise.all([
          LoadService.getCustomers(),
          LoadService.getCarriers(),
          LoadService.getEquipmentTypes()
        ]);
        setCustomers(customersData);
        setCarriers(carriersData);
        setEquipmentTypes(equipmentTypesData);
      } catch (error) {
        console.error('Failed to load supporting data:', error);
      }
    };

    if (isOpen) {
      loadSupportingData();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = report 
      ? {
          name: formData.name,
          description: formData.description,
          scheduled: formData.scheduled,
          schedule_frequency: formData.schedule_frequency,
          filters: formData.filters
        } as UpdateReportData
      : {
          name: formData.name,
          type: formData.type,
          description: formData.description,
          format: formData.format,
          scheduled: formData.scheduled,
          schedule_frequency: formData.schedule_frequency,
          filters: formData.filters
        } as CreateReportData;

    onSubmit(submitData);
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value
      }
    }));
  };

  const addToArrayFilter = (key: keyof ReportFilters, value: number) => {
    const currentArray = (formData.filters[key] as number[]) || [];
    if (!currentArray.includes(value)) {
      setFormData(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          [key]: [...currentArray, value]
        }
      }));
    }
  };

  const removeFromArrayFilter = (key: keyof ReportFilters, value: number) => {
    const currentArray = (formData.filters[key] as number[]) || [];
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: currentArray.filter(item => item !== value)
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">
            {report ? 'Edit Report' : 'Create New Report'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Report Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter report name"
                disabled={loading}
              />
            </div>

            {!report && (
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
                  Report Type *
                </label>
                <select
                  id="type"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ReportType }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="loads">Loads</option>
                  <option value="carriers">Carriers</option>
                  <option value="fleet">Fleet</option>
                  <option value="customers">Customers</option>
                </select>
              </div>
            )}

            {!report && (
              <div>
                <label htmlFor="format" className="block text-sm font-medium text-gray-300 mb-1">
                  Export Format
                </label>
                <select
                  id="format"
                  value={formData.format}
                  onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as ExportFormat }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter report description"
              disabled={loading}
            />
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="scheduled"
                checked={formData.scheduled}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled: e.target.checked }))}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-700 rounded"
                disabled={loading}
              />
              <label htmlFor="scheduled" className="ml-2 block text-sm text-gray-300">
                Schedule automatic generation
              </label>
            </div>

            {formData.scheduled && (
              <div>
                <label htmlFor="schedule_frequency" className="block text-sm font-medium text-gray-300 mb-1">
                  Frequency
                </label>
                <select
                  id="schedule_frequency"
                  value={formData.schedule_frequency || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    schedule_frequency: e.target.value as ScheduleFrequency 
                  }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
            )}
          </div>

          {/* Filters Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white border-b border-gray-700 pb-2">
              Report Filters
            </h4>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date_from" className="block text-sm font-medium text-gray-300 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  id="date_from"
                  value={formData.filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="date_to" className="block text-sm font-medium text-gray-300 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  id="date_to"
                  value={formData.filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Type-specific filters */}
            {(formData.type === 'loads' || formData.type === 'customers') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filter by Customers
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto bg-gray-700 rounded-md p-2">
                  {customers.map(customer => (
                    <label key={customer.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(formData.filters.customer_ids || []).includes(customer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addToArrayFilter('customer_ids', customer.id);
                          } else {
                            removeFromArrayFilter('customer_ids', customer.id);
                          }
                        }}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-800 rounded"
                        disabled={loading}
                      />
                      <span className="ml-2 text-sm text-gray-300">{customer.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(formData.type === 'loads' || formData.type === 'carriers') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filter by Carriers
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto bg-gray-700 rounded-md p-2">
                  {carriers.map(carrier => (
                    <label key={carrier.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(formData.filters.carrier_ids || []).includes(carrier.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addToArrayFilter('carrier_ids', carrier.id);
                          } else {
                            removeFromArrayFilter('carrier_ids', carrier.id);
                          }
                        }}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-800 rounded"
                        disabled={loading}
                      />
                      <span className="ml-2 text-sm text-gray-300">{carrier.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formData.type === 'loads' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filter by Equipment Types
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto bg-gray-700 rounded-md p-2">
                  {equipmentTypes.map(equipmentType => (
                    <label key={equipmentType.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(formData.filters.equipment_type_ids || []).includes(equipmentType.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addToArrayFilter('equipment_type_ids', equipmentType.id);
                          } else {
                            removeFromArrayFilter('equipment_type_ids', equipmentType.id);
                          }
                        }}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 bg-gray-800 rounded"
                        disabled={loading}
                      />
                      <span className="ml-2 text-sm text-gray-300">{equipmentType.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : (report ? 'Update Report' : 'Create Report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
