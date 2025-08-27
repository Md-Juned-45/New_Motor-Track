import { supabase, Motor, MotorWithCompany } from '../utils/supabase'

export const motorService = {
  // Fetch all motors with company details
  async getAll(): Promise<MotorWithCompany[]> {
    const { data, error } = await supabase
      .from('motors')
      .select(`
        *,
        companies!inner(name)
      `)
      .order('motor_id')

    if (error) throw error
    
    return (data || []).map(motor => ({
      ...motor,
      company_name: motor.companies?.name
    }))
  },

  // Get motor by ID
  async getById(id: string): Promise<Motor | null> {
    const { data, error } = await supabase
      .from('motors')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Get motors by company
  async getByCompany(companyId: string): Promise<Motor[]> {
    const { data, error } = await supabase
      .from('motors')
      .select('*')
      .eq('company_id', companyId)
      .order('motor_id')

    if (error) throw error
    return data || []
  },

  // Create new motor
  async create(motor: Omit<Motor, 'id' | 'created_at' | 'updated_at'>): Promise<Motor> {
    const { data, error } = await supabase
      .from('motors')
      .insert([motor])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update motor
  async update(id: string, updates: Partial<Motor>): Promise<Motor> {
    const { data, error } = await supabase
      .from('motors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete motor
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('motors')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Search motors
  async search(searchTerm: string): Promise<MotorWithCompany[]> {
    const { data, error } = await supabase
      .from('motors')
      .select(`
        *,
        companies!inner(name)
      `)
      .or(`motor_id.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`)
      .order('motor_id')

    if (error) throw error
    
    return (data || []).map(motor => ({
      ...motor,
      company_name: motor.companies?.name
    }))
  },

  // Filter by type
  async getByType(type: string): Promise<MotorWithCompany[]> {
    const { data, error } = await supabase
      .from('motors')
      .select(`
        *,
        companies!inner(name)
      `)
      .eq('type', type)
      .order('motor_id')

    if (error) throw error
    
    return (data || []).map(motor => ({
      ...motor,
      company_name: motor.companies?.name
    }))
  }
}