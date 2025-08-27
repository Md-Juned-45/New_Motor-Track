import { supabase, Warranty, WarrantyWithDetails } from '../utils/supabase'

export const warrantyService = {
  // Fetch all warranties with company, motor, and job details
  async getAll(): Promise<WarrantyWithDetails[]> {
    const { data, error } = await supabase
      .from('warranties')
      .select(`
        *,
        companies!inner(name),
        motors!inner(motor_id),
        jobs!inner(job_number)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(warranty => ({
      ...warranty,
      company_name: warranty.companies?.name,
      motor_motor_id: warranty.motors?.motor_id,
      job_number: warranty.jobs?.job_number
    }))
  },

  // Get warranty by ID
  async getById(id: string): Promise<Warranty | null> {
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new warranty
  async create(warranty: Omit<Warranty, 'id' | 'created_at' | 'updated_at'>): Promise<Warranty> {
    const { data, error } = await supabase
      .from('warranties')
      .insert([warranty])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update warranty
  async update(id: string, updates: Partial<Warranty>): Promise<Warranty> {
    const { data, error } = await supabase
      .from('warranties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete warranty
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('warranties')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Search warranties
  async search(searchTerm: string): Promise<WarrantyWithDetails[]> {
    const { data, error } = await supabase
      .from('warranties')
      .select(`
        *,
        companies!inner(name),
        motors!inner(motor_id),
        jobs!inner(job_number)
      `)
      .or(`work_description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(warranty => ({
      ...warranty,
      company_name: warranty.companies?.name,
      motor_motor_id: warranty.motors?.motor_id,
      job_number: warranty.jobs?.job_number
    }))
  },

  // Filter by status
  async getByStatus(status: string): Promise<WarrantyWithDetails[]> {
    const { data, error } = await supabase
      .from('warranties')
      .select(`
        *,
        companies!inner(name),
        motors!inner(motor_id),
        jobs!inner(job_number)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(warranty => ({
      ...warranty,
      company_name: warranty.companies?.name,
      motor_motor_id: warranty.motors?.motor_id,
      job_number: warranty.jobs?.job_number
    }))
  },

  // Get expiring warranties (within 30 days)
  async getExpiring(): Promise<WarrantyWithDetails[]> {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { data, error } = await supabase
      .from('warranties')
      .select(`
        *,
        companies!inner(name),
        motors!inner(motor_id),
        jobs!inner(job_number)
      `)
      .eq('status', 'active')
      .lte('warranty_end', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('warranty_end')

    if (error) throw error
    
    return (data || []).map(warranty => ({
      ...warranty,
      company_name: warranty.companies?.name,
      motor_motor_id: warranty.motors?.motor_id,
      job_number: warranty.jobs?.job_number
    }))
  }
}