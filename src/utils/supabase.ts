import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Company {
  id: string
  name: string
  contact_name: string
  email: string
  phone?: string
  address?: string
  payment_terms: number
  status: 'active' | 'inactive' | 'payment_due' | 'overdue'
  motor_count: number
  active_jobs: number
  created_at: string
  updated_at: string
}

export interface Motor {
  id: string
  company_id: string
  motor_id: string
  manufacturer?: string
  model?: string
  serial_number?: string
  type: 'AC' | 'DC' | 'Servo' | 'Generator' | 'Turbine'
  voltage?: string
  amperage?: string
  power?: string
  phase?: 'single' | 'three'
  frequency?: string
  connection_type?: string
  rpm?: string
  frame_size?: string
  mounting_type?: string
  insulation_class?: string
  duty_cycle?: string
  environment?: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  location?: string
  technical_notes?: string
  last_service?: string
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  job_number: string
  company_id: string
  motor_id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'under_warranty'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  estimated_cost?: number
  actual_cost?: number
  labor_rate?: number
  labor_hours?: number
  parts_cost?: number
  created_at: string
  start_date?: string
  due_date?: string
  completed_date?: string
  delivery_date?: string
  technician_id?: string
  progress_percentage: number
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  job_id: string
  company_id: string
  subtotal: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  paid_date?: string
  payment_method?: string
  payment_reference?: string
  payment_terms: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Warranty {
  id: string
  job_id: string
  company_id: string
  motor_id: string
  work_description: string
  warranty_start: string
  warranty_end: string
  warranty_period: number
  status: 'active' | 'expired' | 'claimed' | 'extended'
  claim_status: 'none' | 'pending' | 'approved' | 'denied'
  last_inspection?: string
  claim_date?: string
  claim_description?: string
  claim_resolution?: string
  original_end_date?: string
  extension_reason?: string
  extension_months: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'technician' | 'viewer'
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Extended types with joins
export interface JobWithDetails extends Job {
  company_name?: string
  motor_motor_id?: string
  technician_name?: string
}

export interface InvoiceWithDetails extends Invoice {
  company_name?: string
  job_number?: string
}

export interface WarrantyWithDetails extends Warranty {
  company_name?: string
  motor_motor_id?: string
  job_number?: string
}

export interface MotorWithCompany extends Motor {
  company_name?: string
}