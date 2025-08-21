'use client';

import { useState, useEffect } from 'react';
import { Driver, Truck, Trailer, Carrier } from '@/types/loads';

interface LoadAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (assignment: LoadAssignment) => Promise<void>;
  loadId: number;
  drivers: Driver[];
  trucks: Truck[];
  trailers: Trailer[];
  carriers: Carrier[];
  equipmentTypeId: number;
  loading?: boolean;
}

export interface LoadAssignment {
  type: 'carrier' | 'internal';
  carrier_id?: number;
  driver_id?: number;
  truck_id?: number;
  trailer_id?: number;
}

export default function LoadAssignmentModal({
  isOpen,
  onClose,
  onAssign,
  loadId,
  drivers,
  trucks,
  trailers,
  carriers,
  // equipmentTypeId,
  loading = false
}: LoadAssignmentModalProps) {
  const [assignmentType, setAssignmentType] = useState<'carrier' | 'internal'>('internal');
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [selectedTrailer, setSelectedTrailer] = useState('');
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAssignmentType('internal');
      setSelectedCarrier('');
      setSelectedDriver('');
      setSelectedTruck('');
      setSelectedTrailer('');
      setStep(1);
      setErrors({});
    }
  }, [isOpen]);

  // Filter available resources
  const availableDrivers = drivers.filter(driver => driver.status === 'Active');
  const availableTrucks = trucks.filter(truck => truck.status === 'Available');
  const availableTrailers = trailers.filter(trailer => 
    trailer.status === 'Available'
  );
  const activeCarriers = carriers.filter(carrier => !carrier.dnu_flag);

  // Debug logging for trailer assignment issues
  console.log('🚛 Load Assignment Debug:', {
    allTrailers: trailers,
    availableTrailers,
    trailerStatuses: trailers.map(t => ({ id: t.id, number: t.trailer_number, status: t.status, equipmentTypeId: t.equipment_type_id }))
  });

  const handleAssign = async () => {
    const newErrors: Record<string, string> = {};

    if (assignmentType === 'carrier') {
      if (!selectedCarrier) {
        newErrors.carrier = 'Please select a carrier';
      }
    } else {
      if (!selectedDriver) {
        newErrors.driver = 'Please select a driver';
      }
      if (!selectedTruck) {
        newErrors.truck = 'Please select a truck';
      }
      if (!selectedTrailer) {
        newErrors.trailer = 'Please select a trailer';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const assignment: LoadAssignment = {
      type: assignmentType,
      ...(assignmentType === 'carrier' 
        ? { carrier_id: parseInt(selectedCarrier) }
        : {
            driver_id: parseInt(selectedDriver),
            truck_id: parseInt(selectedTruck),
            trailer_id: parseInt(selectedTrailer)
          }
      )
    };

    try {
      await onAssign(assignment);
      onClose();
    } catch (error) {
      console.error('Assignment failed:', error);
    }
  };

  const renderCarrierSelection = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Carrier *
        </label>
        <select
          value={selectedCarrier}
          onChange={(e) => {
            setSelectedCarrier(e.target.value);
            if (errors.carrier) {
              setErrors(prev => ({ ...prev, carrier: '' }));
            }
          }}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Choose carrier...</option>
          {activeCarriers.map(carrier => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.name} {carrier.mc_number ? `(MC: ${carrier.mc_number})` : ''}
            </option>
          ))}
        </select>
        {errors.carrier && (
          <p className="text-red-400 text-sm mt-1">{errors.carrier}</p>
        )}
      </div>

      {selectedCarrier && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Selected Carrier Details</h4>
          {(() => {
            const carrier = activeCarriers.find(c => c.id.toString() === selectedCarrier);
            return carrier ? (
              <div className="text-sm text-gray-300 space-y-1">
                <div>Name: {carrier.name}</div>
                {carrier.mc_number && <div>MC Number: {carrier.mc_number}</div>}
                {carrier.primary_contact_name && <div>Contact: {carrier.primary_contact_name}</div>}
                {carrier.primary_contact_phone && <div>Phone: {carrier.primary_contact_phone}</div>}
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );

  const renderInternalFleetSelection = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Driver * 
              <span className={`ml-2 text-xs px-2 py-1 rounded ${
                availableDrivers.length > 0 
                  ? 'bg-green-600 text-green-100' 
                  : 'bg-red-600 text-red-100'
              }`}>
                {availableDrivers.length} available
              </span>
            </label>
            <select
              value={selectedDriver}
              onChange={(e) => {
                setSelectedDriver(e.target.value);
                if (errors.driver) {
                  setErrors(prev => ({ ...prev, driver: '' }));
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">
                {availableDrivers.length > 0 ? 'Choose driver...' : 'No drivers available'}
              </option>
              {availableDrivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} {driver.license_expiry_date && `(License expires: ${new Date(driver.license_expiry_date).toLocaleDateString()})`}
                </option>
              ))}
            </select>
            {errors.driver && (
              <p className="text-red-400 text-sm mt-1">{errors.driver}</p>
            )}
            {availableDrivers.length === 0 && (
              <p className="text-yellow-400 text-sm mt-1">
                No drivers are currently available for assignment. Check driver status or current assignments.
              </p>
            )}
          </div>

          {selectedDriver && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Selected Driver Details</h4>
              {(() => {
                const driver = availableDrivers.find(d => d.id.toString() === selectedDriver);
                return driver ? (
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>Name: {driver.name}</div>
                    {driver.phone && <div>Phone: {driver.phone}</div>}
                    {driver.license_number && <div>License: {driver.license_number}</div>}
                    {driver.license_expiry_date && (
                      <div>License Expires: {new Date(driver.license_expiry_date).toLocaleDateString()}</div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Truck * 
              <span className={`ml-2 text-xs px-2 py-1 rounded ${
                availableTrucks.length > 0 
                  ? 'bg-green-600 text-green-100' 
                  : 'bg-red-600 text-red-100'
              }`}>
                {availableTrucks.length} available
              </span>
            </label>
            <select
              value={selectedTruck}
              onChange={(e) => {
                setSelectedTruck(e.target.value);
                if (errors.truck) {
                  setErrors(prev => ({ ...prev, truck: '' }));
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">
                {availableTrucks.length > 0 ? 'Choose truck...' : 'No trucks available'}
              </option>
              {availableTrucks.map(truck => (
                <option key={truck.id} value={truck.id}>
                  {truck.truck_number} {truck.license_plate ? `(${truck.license_plate})` : ''}
                </option>
              ))}
            </select>
            {errors.truck && (
              <p className="text-red-400 text-sm mt-1">{errors.truck}</p>
            )}
            {availableTrucks.length === 0 && (
              <p className="text-yellow-400 text-sm mt-1">
                No trucks are currently available for assignment. Check fleet status or truck assignments.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Trailer * 
              <span className={`ml-2 text-xs px-2 py-1 rounded ${
                availableTrailers.length > 0 
                  ? 'bg-green-600 text-green-100' 
                  : 'bg-red-600 text-red-100'
              }`}>
                {availableTrailers.length} available
              </span>
            </label>
            <select
              value={selectedTrailer}
              onChange={(e) => {
                setSelectedTrailer(e.target.value);
                if (errors.trailer) {
                  setErrors(prev => ({ ...prev, trailer: '' }));
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">
                {availableTrailers.length > 0 ? 'Choose trailer...' : 'No trailers available'}
              </option>
              {availableTrailers.map(trailer => (
                <option key={trailer.id} value={trailer.id}>
                  {trailer.trailer_number} {trailer.license_plate ? `(${trailer.license_plate})` : ''}
                </option>
              ))}
            </select>
            {errors.trailer && (
              <p className="text-red-400 text-sm mt-1">{errors.trailer}</p>
            )}
            {availableTrailers.length === 0 && (
              <p className="text-yellow-400 text-sm mt-1">
                No trailers are currently available for assignment. Check fleet status or trailer assignments.
              </p>
            )}
          </div>

          {selectedTruck && selectedTrailer && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Final Assignment</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <div>Driver: {availableDrivers.find(d => d.id.toString() === selectedDriver)?.name}</div>
                <div>Truck: {availableTrucks.find(t => t.id.toString() === selectedTruck)?.truck_number}</div>
                <div>Trailer: {availableTrailers.find(t => t.id.toString() === selectedTrailer)?.trailer_number}</div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            Assign Load L{loadId}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Assignment Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Assignment Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="internal"
                  checked={assignmentType === 'internal'}
                  onChange={(e) => setAssignmentType(e.target.value as 'carrier' | 'internal')}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-white">Internal Fleet</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="carrier"
                  checked={assignmentType === 'carrier'}
                  onChange={(e) => setAssignmentType(e.target.value as 'carrier' | 'internal')}
                  className="mr-2 text-red-600 focus:ring-red-500"
                />
                <span className="text-white">External Carrier</span>
              </label>
            </div>
          </div>

          {/* Step indicator for internal fleet */}
          {assignmentType === 'internal' && (
            <div className="mb-4">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= 1 ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  1
                </div>
                <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-red-600' : 'bg-gray-600'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= 2 ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  2
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">Select Driver</span>
                <span className="text-xs text-gray-400">Select Equipment</span>
              </div>
            </div>
          )}

          {/* Assignment Form */}
          {assignmentType === 'carrier' ? renderCarrierSelection() : renderInternalFleetSelection()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="flex space-x-3">
            {assignmentType === 'internal' && step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            {assignmentType === 'carrier' || step === 2 ? (
              <button
                onClick={handleAssign}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Assigning...' : 'Assign Load'}
              </button>
            ) : (
              <button
                onClick={() => setStep(2)}
                disabled={!selectedDriver}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Next: Select Equipment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
