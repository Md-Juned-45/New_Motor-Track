import { supabase, Invoice, InvoiceWithDetails } from '../utils/supabase'

export const invoiceService = {
  // Fetch all invoices with company and job details
  async getAll(): Promise<InvoiceWithDetails[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        companies!inner(name),
        jobs!inner(job_number)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(invoice => ({
      ...invoice,
      company_name: invoice.companies?.name,
      job_number: invoice.jobs?.job_number
    }))
  },

  // Get invoice by ID
  async getById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new invoice
  async create(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber()
    
    const { data, error } = await supabase
      .from('invoices')
      .insert([{ ...invoice, invoice_number: invoiceNumber }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update invoice
  async update(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete invoice
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Search invoices
  async search(searchTerm: string): Promise<InvoiceWithDetails[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        companies!inner(name),
        jobs!inner(job_number)
      `)
      .or(`invoice_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(invoice => ({
      ...invoice,
      company_name: invoice.companies?.name,
      job_number: invoice.jobs?.job_number
    }))
  },

  // Filter by status
  async getByStatus(status: string): Promise<InvoiceWithDetails[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        companies!inner(name),
        jobs!inner(job_number)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return (data || []).map(invoice => ({
      ...invoice,
      company_name: invoice.companies?.name,
      job_number: invoice.jobs?.job_number
    }))
  },

  // Generate unique invoice number
  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `INV-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)

    if (error) throw error

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastInvoiceNumber = data[0].invoice_number
      const lastNumber = parseInt(lastInvoiceNumber.split('-')[2])
      nextNumber = lastNumber + 1
    }

    return `INV-${year}-${nextNumber.toString().padStart(3, '0')}`
  }
}