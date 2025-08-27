import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Building2,
  Settings,
  Calendar,
  DollarSign,
  User,
  Eye,
  Edit,
  Play
} from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { jobService } from '../services/jobService';
import { companyService } from '../services/companyService';
import { motorService } from '../services/motorService';
import { userService } from '../services/userService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { Job, Company, Motor, User } from '../utils/supabase';

const Jobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');

  // Fetch data
  const { data: jobs, loading: jobsLoading, error: jobsError, refetch: refetchJobs } = useAsync(
    () => jobService.getAll(),
    []
  );

  const { data: companies, loading: companiesLoading, error: companiesError } = useAsync(
    () => companyService.getAll(),
    []
  );

  const { data: technicians, loading: techniciansLoading, error: techniciansError } = useAsync(
    () => userService.getTechnicians(),
    []
  );

  // Fetch motors for selected company
  const { data: companyMotors, loading: motorsLoading } = useAsync(
    () => selectedCompany ? motorService.getByCompany(selectedCompany) : Promise.resolve([]),
    [selectedCompany]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'under_warranty':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'under_warranty':
        return <CheckCircle className="h-4 w-4" />;
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

  const getProgressPercentage = (status: string, progressPercentage?: number) => {
    if (progressPercentage !== undefined) return progressPercentage;
    
    switch (status) {
      case 'pending':
        return 10;
      case 'in_progress':
        return 50;
      case 'completed':
        return 85;
      case 'delivered':
        return 100;
      case 'under_warranty':
        return 100;
      default:
        return 0;
    }
  };

  const filteredJobs = (jobs || []).filter(job => {
    const matchesSearch = job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateJob = async (formData: FormData) => {
    setIsCreating(true);
    try {
      const jobData = {
        company_id: formData.get('company_id') as string,
        motor_id: formData.get('motor_id') as string,
        description: formData.get('description') as string,
        priority: formData.get('priority') as Job['priority'] || 'normal',
        start_date: formData.get('start_date') as string || undefined,
        due_date: formData.get('due_date') as string,
        labor_hours: parseFloat(formData.get('labor_hours') as string) || undefined,
        technician_id: formData.get('technician_id') as string || undefined,
        labor_rate: parseFloat(formData.get('labor_rate') as string) || undefined,
        parts_cost: parseFloat(formData.get('parts_cost') as string) || undefined,
        estimated_cost: 0, // Will be calculated
        status: 'pending' as const
      };
      
      // Calculate estimated cost
      const laborCost = (jobData.labor_hours || 0) * (jobData.labor_rate || 0);
      jobData.estimated_cost = laborCost + (jobData.parts_cost || 0);
      
      await jobService.create(jobData);
      setShowCreateModal(false);
      setActiveStep(0);
      setSelectedCompany('');
      refetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (jobsLoading || companiesLoading || techniciansLoading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (jobsError || companiesError || techniciansError) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorMessage 
          message={jobsError || companiesError || techniciansError || 'An error occurred'} 
          onRetry={refetchJobs} 
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Active Jobs</h1>
            <p className="text-gray-600 mt-1">Track repair jobs from initial estimate to final delivery</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Job</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by job number or description..."
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => {
          const daysUntilDue = job.due_date ? getDaysUntilDue(job.due_date) : 0;
          const isOverdue = daysUntilDue < 0;
          const isDueSoon = daysUntilDue <= 2 && daysUntilDue >= 0;
          
          return (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${getStatusColor(job.status).replace('text-', 'text-').replace('border-', 'bg-').split(' ')[0].replace('bg-', 'bg-').replace('-100', '-200')}`}>
                      {getStatusIcon(job.status)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{job.job_number}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {job.priority !== 'normal' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(job.priority)}`}>
                            {job.priority.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-4 w-4" />
                          <span>{job.company_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Settings className="h-4 w-4" />
                          <span>{job.motor_motor_id}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{job.description}</p>
                    </div>
                  </div>
                  
                  {/* Due Date Warning */}
                  <div className="mt-4 lg:mt-0">
                    {isOverdue && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {Math.abs(daysUntilDue)} days overdue
                        </span>
                      </div>
                    )}
                    {isDueSoon && !isOverdue && (
                      <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Due in {daysUntilDue} days
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{getProgressPercentage(job.status, job.progress_percentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(job.status, job.progress_percentage)}%` }}
                    ></div>
                  </div>
                  
                  {/* Status Flow */}
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span className={job.status === 'pending' ? 'text-blue-600 font-medium' : ''}>Pending</span>
                    <span className={job.status === 'in_progress' ? 'text-blue-600 font-medium' : ''}>In Progress</span>
                    <span className={job.status === 'completed' ? 'text-blue-600 font-medium' : ''}>Completed</span>
                    <span className={job.status === 'delivered' ? 'text-blue-600 font-medium' : ''}>Delivered</span>
                  </div>
                </div>

                {/* Job Details Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-600">Estimated Cost</p>
                    <p className="font-medium text-gray-900">
                      ${job.estimated_cost ? job.estimated_cost.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  
                  {job.actual_cost && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-600">Actual Cost</p>
                      <p className="font-medium text-gray-900">${job.actual_cost.toLocaleString()}</p>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-xs text-gray-600">Labor Hours</p>
                    <p className="font-medium text-gray-900">
                      {job.labor_hours ? `${job.labor_hours}h` : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-600">Technician</p>
                    <p className="font-medium text-gray-900">{job.technician_name || 'Unassigned'}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2 sm:mb-0">
                    {job.due_date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {new Date(job.due_date).toLocaleDateString()}</span>
                    </div>
                    )}
                    {job.completed_date && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Completed: {new Date(job.completed_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  
                  <button className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                    <Edit className="h-4 w-4" />
                    <span>Edit Job</span>
                  </button>
                  
                  {job.status === 'in_progress' && (
                    <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Mark Complete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create New Job</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Step Indicator */}
              <div className="flex items-center space-x-4 mt-6">
                {['Job Details', 'Scheduling', 'Pricing'].map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= activeStep 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`ml-2 text-sm ${index <= activeStep ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step}
                    </span>
                    {index < 2 && <div className="w-8 h-0.5 bg-gray-300 mx-4"></div>}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateJob(formData);
              }}>
                {/* Step 1: Job Details */}
                {activeStep === 0 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company *
                        </label>
                        <select 
                          name="company_id" 
                          required 
                          value={selectedCompany}
                          onChange={(e) => setSelectedCompany(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Company</option>
                          {(companies || []).map(company => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Motor *
                        </label>
                        <select 
                          name="motor_id" 
                          required 
                          disabled={!selectedCompany || motorsLoading}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">Select Motor</option>
                          {(companyMotors || []).map(motor => (
                            <option key={motor.id} value={motor.id}>
                              {motor.motor_id} - {motor.manufacturer} {motor.model}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Description *
                      </label>
                      <textarea
                        name="description"
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detailed description of the work to be performed..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['low', 'normal', 'high', 'urgent'].map((priority) => (
                          <label key={priority} className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="radio" name="priority" value={priority} className="text-blue-600" />
                            <span className={`text-sm font-medium ${
                              priority === 'urgent' ? 'text-red-700' : 
                              priority === 'high' ? 'text-orange-700' : 
                              priority === 'normal' ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Scheduling */}
                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          name="start_date"
                          type="date"
                          defaultValue={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Hours
                        </label>
                        <input
                          name="labor_hours"
                          type="number"
                          step="0.5"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="8"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned Technician
                        </label>
                        <select name="technician_id" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="">Select Technician</option>
                          {(technicians || []).map(tech => (
                            <option key={tech.id} value={tech.id}>{tech.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Pricing */}
                {activeStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Labor Rate (per hour)
                        </label>
                        <div className="flex">
                          <span className="px-3 py-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600">$</span>
                          <input
                            name="labor_rate"
                            type="number"
                            step="0.01"
                            defaultValue={85}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Labor Hours
                        </label>
                        <input
                          name="labor_hours_pricing"
                          type="number"
                          step="0.5"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="8"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parts Estimate
                      </label>
                      <div className="flex">
                        <span className="px-3 py-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600">$</span>
                        <input
                          name="parts_cost"
                          type="number"
                          step="0.01"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="150"
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Total Estimate:</span>
                        <span className="text-2xl font-bold text-blue-600">$830.00</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row sm:justify-between pt-6 border-t border-gray-200">
                  <div className="flex space-x-2 mb-4 sm:mb-0">
                    {activeStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveStep(activeStep - 1)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Previous
                      </button>
                    )}
                    {activeStep < 2 && (
                      <button
                        type="button"
                        onClick={() => setActiveStep(activeStep + 1)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Next
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    {activeStep === 2 && (
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        {isCreating ? 'Creating...' : 'Create Job'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first repair job to get started.'}
          </p>
          {(!searchTerm && statusFilter === 'all' && priorityFilter === 'all') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Job</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Jobs;