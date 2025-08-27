import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  Settings,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { warrantyService } from '../services/warrantyService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { Warranty } from '../utils/supabase';

const Warranties = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<any>(null);
  const [isExtending, setIsExtending] = useState(false);

  // Fetch warranties data
  const { data: warranties, loading, error, refetch } = useAsync(
    () => warrantyService.getAll(),
    []
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'claimed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'extended':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Shield className="h-4 w-4" />;
      case 'expired':
        return <Clock className="h-4 w-4" />;
      case 'claimed':
        return <Wrench className="h-4 w-4" />;
      case 'extended':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredWarranties = (warranties || []).filter(warranty => {
    const matchesSearch = warranty.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warranty.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warranty.motor_motor_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || warranty.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary metrics
  const activeWarranties = (warranties || []).filter(w => w.status === 'active').length;
  const expiringSoon = (warranties || []).filter(w => {
    const daysRemaining = getDaysRemaining(w.warranty_end);
    return daysRemaining <= 30 && daysRemaining > 0;
  }).length;
  const claimsThisYear = (warranties || []).filter(w => 
    w.status === 'claimed' && new Date(w.warranty_start).getFullYear() === new Date().getFullYear()
  ).length;
  const avgWarrantyPeriod = Math.round(
    (warranties || []).reduce((sum, w) => sum + w.warranty_period, 0) / (warranties?.length || 1)
  ) || 0;

  const handleExtendWarranty = async (formData: FormData) => {
    if (!selectedWarranty) return;
    
    setIsExtending(true);
    try {
      const extensionMonths = parseInt(formData.get('extension_months') as string);
      const extensionReason = formData.get('extension_reason') as string;
      const notes = formData.get('notes') as string;
      
      const currentEndDate = new Date(selectedWarranty.warranty_end);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);
      
      await warrantyService.update(selectedWarranty.id, {
        warranty_end: newEndDate.toISOString().split('T')[0],
        original_end_date: selectedWarranty.original_end_date || selectedWarranty.warranty_end,
        extension_months: (selectedWarranty.extension_months || 0) + extensionMonths,
        extension_reason,
        notes: notes || selectedWarranty.notes,
        status: 'extended' as const
      });
      
      setShowExtendModal(false);
      setSelectedWarranty(null);
      refetch();
    } catch (error) {
      console.error('Error extending warranty:', error);
      alert('Failed to extend warranty. Please try again.');
    } finally {
      setIsExtending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorMessage message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 pb-24 lg:pb-6">
      {/* Header Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Warranty Management</h1>
            <p className="text-gray-600 mt-1">Track warranty periods and manage warranty claims</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-green-100">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{activeWarranties}</p>
            <p className="text-sm text-gray-600 mt-1">Active Warranties</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{expiringSoon}</p>
            <p className="text-sm text-gray-600 mt-1">Expiring Soon</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-100">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{claimsThisYear}</p>
            <p className="text-sm text-gray-600 mt-1">Claims This Year</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{avgWarrantyPeriod} mo</p>
            <p className="text-sm text-gray-600 mt-1">Average Period</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job number, company, or motor ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="claimed">Claimed</option>
              <option value="extended">Extended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Warranties List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredWarranties.map((warranty) => {
          const daysRemaining = getDaysRemaining(warranty.warranty_end);
          const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
          const isExpired = daysRemaining <= 0 && warranty.status !== 'expired';
          
          return (
            <div key={warranty.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${getStatusColor(warranty.status).replace('text-', 'text-').replace('border-', 'bg-').split(' ')[0].replace('bg-', 'bg-').replace('-100', '-200')}`}>
                      {getStatusIcon(warranty.status)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{warranty.job_number}</h3>
                      <p className="text-sm text-gray-600">{warranty.company_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(warranty.status)}`}>
                      {warranty.status.toUpperCase()}
                    </span>
                    {isExpiringSoon && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expires in {daysRemaining} days
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Motor and Work Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Motor:</span>
                    <span className="font-medium text-gray-900">{warranty.motor_motor_id}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Wrench className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-600">Work:</span>
                      <p className="text-sm text-gray-900 mt-1">{warranty.work_description}</p>
                    </div>
                  </div>
                </div>

                {/* Warranty Period */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Start Date</p>
                    <p className="font-medium text-gray-900">{new Date(warranty.warranty_start).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">End Date</p>
                    <p className={`font-medium ${isExpired || warranty.status === 'expired' ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(warranty.warranty_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Period</p>
                    <p className="font-medium text-gray-900">{warranty.warranty_period} months</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Days Remaining</p>
                    <p className={`font-medium ${
                      daysRemaining <= 0 ? 'text-red-600' : 
                      daysRemaining <= 30 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {daysRemaining > 0 ? daysRemaining : 'Expired'}
                    </p>
                  </div>
                </div>

                {/* Last Inspection */}
                {warranty.last_inspection && (
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Last Inspection:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(warranty.last_inspection).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Claim Status */}
                {warranty.claim_status && warranty.claim_status !== 'none' && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Claim Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      warranty.claim_status === 'approved' ? 'bg-green-100 text-green-800' :
                      warranty.claim_status === 'denied' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {warranty.claim_status.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {warranty.notes && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-1">Notes:</p>
                    <p className="text-sm text-gray-700 italic">{warranty.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  
                  {warranty.status === 'active' && (
                    <button 
                      onClick={() => {
                        setSelectedWarranty(warranty);
                        setShowExtendModal(true);
                      }}
                      className="flex-1 border border-green-300 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Extend</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extend Warranty Modal */}
      {showExtendModal && selectedWarranty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Extend Warranty</h2>
                <button 
                  onClick={() => {
                    setShowExtendModal(false);
                    setSelectedWarranty(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Current warranty for:</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedWarranty.job_number}</p>
                  <p className="text-sm text-gray-600">{selectedWarranty.company_name}</p>
                  <p className="text-sm text-gray-600">Motor: {selectedWarranty.motor_motor_id}</p>
                  <p className="text-sm text-gray-600">
                    Current End Date: {new Date(selectedWarranty.warranty_end).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleExtendWarranty(formData);
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extension Period
                  </label>
                  <select name="extension_months" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extension Reason
                  </label>
                  <select name="extension_reason" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select reason</option>
                    <option value="additional_work">Additional work performed</option>
                    <option value="customer_request">Customer request</option>
                    <option value="quality_assurance">Quality assurance</option>
                    <option value="premium_service">Premium service package</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes about the warranty extension..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>New End Date:</strong> {new Date(new Date(selectedWarranty.warranty_end).getTime() + (6 * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtendModal(false);
                      setSelectedWarranty(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isExtending}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {isExtending ? 'Extending...' : 'Extend Warranty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredWarranties.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No warranties found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Warranties will appear here as you complete jobs for customers.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Warranties;