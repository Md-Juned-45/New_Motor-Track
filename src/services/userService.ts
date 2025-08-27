import { supabase, User } from '../utils/supabase'

export const userService = {
  // Fetch all users
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  },

  // Get user by ID
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Get technicians only
  async getTechnicians(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['technician', 'admin'])
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  },

  // Create new user
  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update user
  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete user
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}