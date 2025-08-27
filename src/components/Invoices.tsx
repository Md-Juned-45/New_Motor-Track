import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Eye,
  Download,
  Building2
} from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { invoiceService } from '../services/invoiceService';
import { jobService } from '../services/jobService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { Invoice } from '../utils/supabase';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('this_month');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch invoices and completed jobs
  const { data: invoices, loading: invoicesLoading, error: invoicesError, refetch: refetchInvoices } = useAsync(
    () => invoiceService.getAll(),
    []
  );

  const { data: completedJobs, loading: jobsLoading, error: jobsError } = useAsync(
    () => jobService.getByStatus('completed'),
    []
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'cancelled':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredInvoices = (invoices || []).filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.job_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary metrics
  const totalOutstanding = (invoices || [])
    .filter(inv => ['sent', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const thisMonthRevenue = (invoices || [])
    .filter(inv => inv.status === 'paid' && inv.paid_date && new Date(inv.paid_date).getMonth() === new Date().getMonth())
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const overdueAmount = (invoices || [])
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const avgPaymentTime = 15; // Placeholder calculation

  const handleCreateInvoice = async (formData: FormData) => {
    setIsCreating(true);
    try {
      const subtotal = parseFloat(formData.get('subtotal') as string) || 0;
      const taxRate = 0.08; // 8% tax rate
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;
      
      const invoiceData = {
        job_id: formData.get('job_id') as string,
        company_id: formData.get('company_id') as string,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'draft' as const,
        issue_date: formData.get('issue_date') as string,
        due_date: formData.get('due_date') as string,
        payment_terms: parseInt(formData.get('payment_terms') as string) || 30,
        notes: formData.get('notes') as string || undefined
      };
      
      await invoiceService.create(invoiceData);
      setShowCreateModal(false);
      refetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (invoicesLoading || jobsLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (invoicesError || jobsError) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorMessage 
          message={invoicesError || jobsError || 'An error occurred'} 
          onRetry={refetchInvoices} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 pb-24 lg:pb-6">
      {/* Header Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Invoice Management</h1>
            <p className="text-gray-600 mt-1">Track payments and manage customer billing</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-red-100">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">${totalOutstanding.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Total Outstanding</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">${thisMonthRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">This Month's Revenue</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">${overdueAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Overdue Amount</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-100">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{avgPaymentTime} days</p>
            <p className="text-sm text-gray-600 mt-1">Avg Payment Time</p>
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
              placeholder="Search by invoice number, company, or job..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => {
                const daysUntilDue = getDaysUntilDue(invoice.due_date);
                const isOverdue = daysUntilDue < 0 && invoice.status !== 'paid';
                
                return (
                  <tr key={invoice.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{invoice.invoice_number}</div>
                        <div className="text-sm text-gray-500">{new Date(invoice.issue_date).toLocaleDateString()}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{invoice.company_name}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{invoice.job_number}</span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">${invoice.total_amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Tax: ${invoice.tax_amount.toLocaleString()}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1">{invoice.status.replace('_', ' ').toUpperCase()}</span>
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </div>
                        {isOverdue && (
                          <div className="text-xs text-red-600">
                            {Math.abs(daysUntilDue)} days overdue
                          </div>
                        )}
                        {!isOverdue && invoice.status !== 'paid' && daysUntilDue <= 7 && (
                          <div className="text-xs text-orange-600">
                            Due in {daysUntilDue} days
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {invoice.status === 'draft' && (
                        <button className="text-blue-600 hover:text-blue-900 inline-flex items-center space-x-1">
                          <Send className="h-4 w-4" />
                          <span>Send</span>
                        </button>
                      )}
                      {invoice.status === 'sent' && (
                        <button className="text-green-600 hover:text-green-900 inline-flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Mark Paid</span>
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create New Invoice</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateInvoice(formData);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Job *
                    </label>
                    <select 
                      name="job_id" 
                      required 
                      onChange={(e) => {
                        const selectedJob = completedJobs?.find(job => job.id === e.target.value);
                        if (selectedJob) {
                          // Auto-fill company_id
                          const companyInput = document.querySelector('input[name="company_id"]') as HTMLInputElement;
                          if (companyInput) companyInput.value = selectedJob.company_id;
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select completed job</option>
                      {(completedJobs || []).map(job => (
                        <option key={job.id} value={job.id}>
                          {job.job_number} - {job.company_name}
                        </option>
                      ))}
                    </select>
                    <input type="hidden" name="company_id" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Date *
                    </label>
                    <input
                      name="issue_date"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      name="due_date"
                      type="date"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Terms
                    </label>
                    <select name="payment_terms" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="30">Net 30 days</option>
                      <option value="15">Net 15 days</option>
                      <option value="45">Net 45 days</option>
                      <option value="60">Net 60 days</option>
                    </select>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Line Items
                  </label>
                  <div className="border border-gray-300 rounded-lg">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-3 border-t">
                            <input
                              type="text"
                              placeholder="Labor - Motor Rewind"
                              name="line_item_1_description"
                              className="w-full border-0 focus:ring-0 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 border-t">
                            <input
                              type="number"
                              placeholder="12"
                              name="line_item_1_quantity"
                              className="w-full border-0 focus:ring-0 text-sm text-center"
                            />
                          </td>
                          <td className="px-4 py-3 border-t">
                            <input
                              type="number"
                              placeholder="85.00"
                              name="line_item_1_rate"
                              className="w-full border-0 focus:ring-0 text-sm text-center"
                            />
                          </td>
                          <td className="px-4 py-3 border-t text-center text-sm font-medium">
                            $1,020.00
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 border-t">
                            <input
                              type="text"
                              placeholder="Parts & Materials"
                              name="line_item_2_description"
                              className="w-full border-0 focus:ring-0 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3 border-t">
                            <input
                              type="number"
                              placeholder="1"
                              name="line_item_2_quantity"
                              className="w-full border-0 focus:ring-0 text-sm text-center"
                            />
                          </td>
                          <td className="px-4 py-3 border-t">
                            <input
                              type="number"
                              placeholder="150.00"
                              name="line_item_2_rate"
                              className="w-full border-0 focus:ring-0 text-sm text-center"
                            />
                          </td>
                          <td className="px-4 py-3 border-t text-center text-sm font-medium">
                            $150.00
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <div className="bg-gray-50 px-4 py-3 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Subtotal:</span>
                        <span className="font-medium">$1,170.00</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Tax (8%):</span>
                        <span className="font-medium">$93.60</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="font-medium text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-blue-600">$1,263.60</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes for the customer..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isCreating ? 'Creating...' : 'Send Invoice'}</span>
                  </button>
                </div>
              </form>
              <input type="hidden" name="subtotal" value="1170" />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first invoice to start managing billing.'}
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Invoice</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Invoices;