import { supabase, Company } from '../utils/supabase'

export const companyService = {
  // Fetch all companies
  async getAll(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  },

  // Get company by ID
  async getById(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new company
  async create(company: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'motor_count' | 'active_jobs'>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert([company])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update company
  async update(id: string, updates: Partial<Company>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete company
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Search companies
  async search(searchTerm: string): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name')

    if (error) throw error
    return data || []
  },

  // Filter by status
  async getByStatus(status: string): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('status', status)
      .order('name')

    if (error) throw error
    return data || []
  }
}