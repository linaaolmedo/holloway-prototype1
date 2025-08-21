'use client';

import { useState, useEffect } from 'react';
import { Report, CreateReportData, UpdateReportData, ReportSearchFilters } from '@/types/reports';
import { ReportService } from '@/services/reportService';
import ReportsTable from '@/components/reporting/ReportsTable';
import ReportFilters from '@/components/reporting/ReportFilters';
import ReportFormModal from '@/components/reporting/ReportFormModal';
import DeleteConfirmationModal from '@/components/reporting/DeleteConfirmationModal';

export default function ReportingPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportSearchFilters>({});
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load reports
  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await ReportService.getReports(filters);
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      // You could add a toast notification here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle create report
  const handleCreate = async (data: CreateReportData | UpdateReportData) => {
    try {
      setActionLoading(true);
      await ReportService.createReport(data as CreateReportData);
      setShowCreateModal(false);
      loadReports();
    } catch (error) {
      console.error('Failed to create report:', error);
      // You could add a toast notification here
    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit report
  const handleEdit = (report: Report) => {
    setSelectedReport(report);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: UpdateReportData) => {
    if (!selectedReport) return;
    
    try {
      setActionLoading(true);
      await ReportService.updateReport(selectedReport.id, data);
      setShowEditModal(false);
      setSelectedReport(null);
      loadReports();
    } catch (error) {
      console.error('Failed to update report:', error);
      // You could add a toast notification here
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete report
  const handleDelete = (report: Report) => {
    setSelectedReport(report);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReport) return;
    
    try {
      setActionLoading(true);
      await ReportService.deleteReport(selectedReport.id);
      setShowDeleteModal(false);
      setSelectedReport(null);
      loadReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      // You could add a toast notification here
    } finally {
      setActionLoading(false);
    }
  };

  // Handle generate report
  const handleGenerate = async (report: Report) => {
    try {
      setActionLoading(true);
      await ReportService.generateAndSaveReport({
        name: report.name,
        type: report.type,
        filters: report.filters,
        format: 'csv' // Default to CSV for now
      });
      loadReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
      // You could add a toast notification here
    } finally {
      setActionLoading(false);
    }
  };

  // Handle download report
  const handleDownload = async (report: Report) => {
    if (!report.file_url) return;
    
    try {
      const fileName = report.file_url.split('/').pop();
      if (fileName) {
        const blob = await ReportService.downloadReportFile(fileName);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download report:', error);
      // You could add a toast notification here
    }
  };

  // Handle view report details
  const handleView = (report: Report) => {
    // For now, just open edit modal. Could be expanded to a dedicated view modal
    handleEdit(report);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Reporting</h1>
          <p className="text-gray-400 mt-1">
            Generate and manage reports for loads, carriers, fleet, and customers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          disabled={actionLoading}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Reports</p>
              <p className="text-2xl font-semibold text-white">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Completed</p>
              <p className="text-2xl font-semibold text-white">
                {reports.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Scheduled</p>
              <p className="text-2xl font-semibold text-white">
                {reports.filter(r => r.scheduled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Generating</p>
              <p className="text-2xl font-semibold text-white">
                {reports.filter(r => r.status === 'generating').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ReportFilters onFiltersChange={setFilters} loading={loading} />

      {/* Reports Table */}
      <ReportsTable
        reports={reports}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
        onView={handleView}
      />

      {/* Modals */}
      <ReportFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        loading={actionLoading}
      />

      <ReportFormModal
        report={selectedReport || undefined}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedReport(null);
        }}
        onSubmit={handleUpdate}
        loading={actionLoading}
      />

      <DeleteConfirmationModal
        report={selectedReport}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedReport(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
      />
    </div>
  );
}
