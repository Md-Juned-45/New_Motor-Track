import { supabase, Job, JobWithDetails } from '../utils/supabase'

export const jobService = {
  // Fetch all jobs with company and motor details
  async getAll(): Promise<JobWithDetails[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        companies!inner(name),
        motors!inner(motor_id),
        users(name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(job => ({
      ...job,
      company_name: job.companies?.name,
      motor_motor_id: job.motors?.motor_id,
      technician_name: job.users?.name
    }))
  },

  // Get job by ID
  async getById(id: string): Promise<Job | null> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Get jobs by company
  async getByCompany(companyId: string): Promise<JobWithDetails[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        companies!inner(name),
        motors!inner(motor_id),
        users(name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(job => ({
      ...job,
      company_name: job.companies?.name,
      motor_motor_id: job.motors?.motor_id,
      technician_name: job.users?.name
    }))
  },

  // Create new job
  async create(job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'progress_percentage'>): Promise<Job> {
    // Generate job number
    const jobNumber = await this.generateJobNumber()
    
    const { data, error } = await supabase
      .from('jobs')
      .insert([{ ...job, job_number: jobNumber }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update job
  async update(id: string, updates: Partial<Job>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete job
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Search jobs
  async search(searchTerm: string): Promise<JobWithDetails[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        companies!inner(name),
        motors!inner(motor_id),
        users(name)
      `)
      .or(`job_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(job => ({
      ...job,
      company_name: job.companies?.name,
      motor_motor_id: job.motors?.motor_id,
      technician_name: job.users?.name
    }))
  },

  // Filter by status
  async getByStatus(status: string): Promise<JobWithDetails[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        companies!inner(name),
        motors!inner(motor_id),
        users(name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(job => ({
      ...job,
      company_name: job.companies?.name,
      motor_motor_id: job.motors?.motor_id,
      technician_name: job.users?.name
    }))
  },

  // Generate unique job number
  async generateJobNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data, error } = await supabase
      .from('jobs')
      .select('job_number')
      .like('job_number', `JOB-${year}-%`)
      .order('job_number', { ascending: false })
      .limit(1)

    if (error) throw error

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastJobNumber = data[0].job_number
      const lastNumber = parseInt(lastJobNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `JOB-${year}-${nextNumber.toString().padStart(3, '0')}`
  }
}