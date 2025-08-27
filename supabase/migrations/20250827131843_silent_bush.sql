/*
  # MotorTrack Pro - Complete PostgreSQL Schema
  
  This schema includes all data fields extracted from the React components:
  - Companies with complete contact and business information
  - Motors with detailed electrical and mechanical specifications
  - Jobs with comprehensive workflow tracking
  - Invoices with detailed billing and payment tracking
  - Warranties with claim management
  - Users/Technicians with performance metrics
  - Audit trails and timestamps for all entities
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'technician', -- 'admin', 'technician', 'viewer'
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMPANIES
-- =============================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  payment_terms INTEGER DEFAULT 30, -- days
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'payment_due', 'overdue'
  motor_count INTEGER DEFAULT 0,
  active_jobs INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MOTORS
-- =============================================

CREATE TABLE motors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  motor_id VARCHAR(100) NOT NULL, -- Customer's motor identification
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  type VARCHAR(50) NOT NULL, -- 'AC', 'DC', 'Servo', 'Generator', 'Turbine'
  
  -- Electrical Specifications
  voltage VARCHAR(50),
  amperage VARCHAR(50),
  power VARCHAR(50),
  phase VARCHAR(20), -- 'single', 'three'
  frequency VARCHAR(20),
  connection_type VARCHAR(50), -- 'star', 'delta', 'other'
  
  -- Mechanical Specifications
  rpm VARCHAR(50),
  frame_size VARCHAR(50),
  mounting_type VARCHAR(50), -- 'foot', 'flange', 'face', 'other'
  insulation_class VARCHAR(10), -- 'A', 'B', 'F', 'H'
  duty_cycle VARCHAR(50),
  environment VARCHAR(50), -- 'indoor', 'outdoor', 'hazardous'
  
  -- Condition & Location
  condition VARCHAR(50) DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor'
  location VARCHAR(255),
  technical_notes TEXT,
  last_service DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, motor_id)
);

-- =============================================
-- JOBS
-- =============================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number VARCHAR(100) UNIQUE NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  motor_id UUID NOT NULL REFERENCES motors(id) ON DELETE CASCADE,
  
  -- Job Details
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'delivered', 'under_warranty'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Pricing
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  labor_rate DECIMAL(8,2),
  labor_hours DECIMAL(6,2),
  parts_cost DECIMAL(10,2),
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  delivery_date DATE,
  
  -- Assignment
  technician_id UUID REFERENCES users(id),
  
  -- Progress tracking
  progress_percentage INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVOICES
-- =============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status & Dates
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Payment Information
  payment_method VARCHAR(50), -- 'bank_transfer', 'check', 'cash', 'credit_card'
  payment_reference VARCHAR(255),
  
  -- Terms & Notes
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVOICE LINE ITEMS
-- =============================================

CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(8,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  item_type VARCHAR(50) DEFAULT 'service', -- 'service', 'parts', 'labor'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WARRANTIES
-- =============================================

CREATE TABLE warranties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  motor_id UUID NOT NULL REFERENCES motors(id) ON DELETE CASCADE,
  
  -- Warranty Details
  work_description TEXT NOT NULL,
  warranty_start DATE NOT NULL,
  warranty_end DATE NOT NULL,
  warranty_period INTEGER NOT NULL, -- months
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'claimed', 'extended'
  claim_status VARCHAR(50) DEFAULT 'none', -- 'none', 'pending', 'approved', 'denied'
  
  -- Inspections & Claims
  last_inspection DATE,
  claim_date DATE,
  claim_description TEXT,
  claim_resolution TEXT,
  
  -- Extension tracking
  original_end_date DATE,
  extension_reason VARCHAR(255),
  extension_months INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TECHNICIAN PERFORMANCE METRICS
-- =============================================

CREATE TABLE technician_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Performance Metrics
  jobs_completed INTEGER DEFAULT 0,
  avg_completion_time DECIMAL(4,1), -- in days
  efficiency_percentage INTEGER DEFAULT 0,
  customer_satisfaction_score DECIMAL(3,1),
  
  -- Quality Metrics
  warranty_claims INTEGER DEFAULT 0,
  rework_jobs INTEGER DEFAULT 0,
  on_time_completion_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(technician_id, period_start, period_end)
);

-- =============================================
-- ACTIVITY LOG / AUDIT TRAIL
-- =============================================

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL, -- 'company', 'motor', 'job', 'invoice', 'warranty'
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed'
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES users(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SYSTEM SETTINGS
-- =============================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Companies
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_name ON companies(name);

-- Motors
CREATE INDEX idx_motors_company_id ON motors(company_id);
CREATE INDEX idx_motors_type ON motors(type);
CREATE INDEX idx_motors_condition ON motors(condition);
CREATE INDEX idx_motors_motor_id ON motors(motor_id);

-- Jobs
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_motor_id ON jobs(motor_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_priority ON jobs(priority);
CREATE INDEX idx_jobs_technician_id ON jobs(technician_id);
CREATE INDEX idx_jobs_due_date ON jobs(due_date);
CREATE INDEX idx_jobs_job_number ON jobs(job_number);

-- Invoices
CREATE INDEX idx_invoices_job_id ON invoices(job_id);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- Warranties
CREATE INDEX idx_warranties_job_id ON warranties(job_id);
CREATE INDEX idx_warranties_company_id ON warranties(company_id);
CREATE INDEX idx_warranties_status ON warranties(status);
CREATE INDEX idx_warranties_warranty_end ON warranties(warranty_end);

-- Activity Log
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_motors_updated_at BEFORE UPDATE ON motors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warranties_updated_at BEFORE UPDATE ON warranties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA INSERTION
-- =============================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('default_warranty_period', '12', 'number', 'Default warranty period in months'),
('default_payment_terms', '30', 'number', 'Default payment terms in days'),
('tax_rate', '8.0', 'number', 'Default tax rate percentage'),
('labor_rate', '85.00', 'number', 'Default labor rate per hour'),
('company_name', 'MotorTrack Pro Workshop', 'string', 'Workshop company name'),
('company_email', 'admin@motortrackpro.com', 'string', 'Workshop contact email'),
('company_phone', '+1-555-0100', 'string', 'Workshop contact phone');

-- Insert default admin user
INSERT INTO users (email, name, role) VALUES
('admin@motortrackpro.com', 'Workshop Admin', 'admin');

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Active jobs with company and motor details
CREATE VIEW active_jobs_view AS
SELECT 
  j.*,
  c.name as company_name,
  c.contact_name,
  c.email as company_email,
  m.motor_id,
  m.manufacturer,
  m.model,
  u.name as technician_name
FROM jobs j
JOIN companies c ON j.company_id = c.id
JOIN motors m ON j.motor_id = m.id
LEFT JOIN users u ON j.technician_id = u.id
WHERE j.status IN ('pending', 'in_progress');

-- Outstanding invoices
CREATE VIEW outstanding_invoices_view AS
SELECT 
  i.*,
  c.name as company_name,
  c.contact_name,
  c.email as company_email,
  j.job_number,
  CASE 
    WHEN i.due_date < CURRENT_DATE THEN 'overdue'
    WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'current'
  END as urgency_status
FROM invoices i
JOIN companies c ON i.company_id = c.id
JOIN jobs j ON i.job_id = j.id
WHERE i.status IN ('sent', 'overdue');

-- Expiring warranties
CREATE VIEW expiring_warranties_view AS
SELECT 
  w.*,
  c.name as company_name,
  m.motor_id,
  j.job_number,
  (w.warranty_end - CURRENT_DATE) as days_remaining
FROM warranties w
JOIN companies c ON w.company_id = c.id
JOIN motors m ON w.motor_id = m.id
JOIN jobs j ON w.job_id = j.id
WHERE w.status = 'active' 
AND w.warranty_end <= CURRENT_DATE + INTERVAL '30 days';