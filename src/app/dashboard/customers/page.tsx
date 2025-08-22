'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { CustomerWithLocations, CustomerFilters, CreateCustomerData } from '@/types/customers';
import { CustomerService } from '@/services/customerService';
import CustomersTable from '@/components/customers/CustomersTable';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import CustomersFilters from '@/components/customers/CustomersFilters';
import DeleteConfirmationModal from '@/components/customers/DeleteConfirmationModal';
import CustomerAccessDebugger from '@/components/debug/CustomerAccessDebugger';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithLocations[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithLocations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithLocations | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerWithLocations | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load customers
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CustomerService.getAllCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      // You could add toast notifications here
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Filter customers
  const handleFiltersChange = useCallback(async (filters: CustomerFilters) => {
    try {
      setLoading(true);
      
      // If no filters are applied, show all customers
      const hasFilters = Object.values(filters).some(value => 
        value !== null && value !== '' && value !== undefined
      );

      if (!hasFilters) {
        setFilteredCustomers(customers);
      } else {
        const filtered = await CustomerService.searchCustomers(filters);
        setFilteredCustomers(filtered);
      }
    } catch (error) {
      console.error('Failed to filter customers:', error);
      setFilteredCustomers(customers); // Fallback to showing all customers
    } finally {
      setLoading(false);
    }
  }, [customers]);

  // Modal handlers
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormModalOpen(true);
  };

  const handleEditCustomer = (customer: CustomerWithLocations) => {
    setEditingCustomer(customer);
    setIsFormModalOpen(true);
  };

  const handleViewCustomer = (customer: CustomerWithLocations) => {
    // For now, just open edit modal in view mode
    // You could create a separate view modal later
    setEditingCustomer(customer);
    setIsFormModalOpen(true);
  };

  const handleDeleteCustomer = (customer: CustomerWithLocations) => {
    setDeletingCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  // Form submission
  const handleFormSubmit = async (data: CreateCustomerData) => {
    try {
      setFormLoading(true);
      
      if (editingCustomer) {
        await CustomerService.updateCustomer(editingCustomer.id, data);
      } else {
        await CustomerService.createCustomer(data);
      }
      
      await loadCustomers(); // Reload customers
      setIsFormModalOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Failed to save customer:', error);
      throw error; // Let the modal handle the error display
    } finally {
      setFormLoading(false);
    }
  };

  // Delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;
    
    try {
      setFormLoading(true);
      await CustomerService.deleteCustomer(deletingCustomer.id);
      await loadCustomers(); // Reload customers
      setIsDeleteModalOpen(false);
      setDeletingCustomer(null);
      setSelectedCustomers(prev => prev.filter(id => id !== deletingCustomer.id));
    } catch (error) {
      console.error('Failed to delete customer:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSelectionChange = (selectedIds: number[]) => {
    setSelectedCustomers(selectedIds);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Customers</h1>
          <p className="text-gray-400 mt-1">
            Manage and track all your customers.
          </p>
        </div>
        <button
          onClick={handleAddCustomer}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <CustomersFilters 
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      {/* Bulk Actions */}
      {selectedCustomers.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-white">
              {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCustomers([])}
                className="px-3 py-1 text-gray-400 hover:text-white transition-colors"
              >
                Clear Selection
              </button>
              {/* Add more bulk actions as needed */}
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <CustomersTable
        customers={filteredCustomers}
        loading={loading}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        onView={handleViewCustomer}
        selectedCustomers={selectedCustomers}
        onSelectionChange={handleSelectionChange}
      />

      {/* Footer Info */}
      <div className="mt-6 text-sm text-gray-400 text-center">
        {filteredCustomers.length} of {customers.length} customer{customers.length !== 1 ? 's' : ''} displayed
      </div>

      {/* Debug Panel - Remove this after fixing the issue */}
      {customers.length === 0 && (
        <CustomerAccessDebugger />
      )}

      {/* Modals */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleFormSubmit}
        customer={editingCustomer}
        loading={formLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCustomer(null);
        }}
        onConfirm={handleDeleteConfirm}
        customer={deletingCustomer}
        loading={formLoading}
      />
    </div>
  );
}
