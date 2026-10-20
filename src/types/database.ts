export interface Student {
  student_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  employment_status: 'Employed' | 'Unemployed' | 'Student' | 'Freelancer' | null;
  grad_status: 'Graduate' | 'Undergrad' | null;
  grad_college: string | null;
  previous_courses: string | null;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Course {
  course_id: string;
  course_name: string;
  default_cost: number;
  availability_status: 'Upcoming' | 'Active' | 'Closed';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  duration_weeks: number | null;
  start_date?: string | null;
  end_date?: string | null;
  max_students: number | null;
  prerequisite_courses: string | null;
  description: string | null;
  link_whatsapp: string | null;
  link_tasks: string | null;
  link_drive: string | null;
  link_sources: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CashBox {
  cash_box_id: string;
  name: string;
  type: 'Main' | 'Branch' | 'Online' | 'Petty Cash' | 'Bank' | string;
  owner: string | null;
  opening_balance: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface Enrollment {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  agreed_cost: number;
  status: 'Active' | 'Completed' | 'Dropped';
  enrolled_at: string;
  updated_at?: string;
}

export interface Payment {
  payment_id: string;
  enrollment_id: string;
  cash_box_id: string;
  amount: number;
  payment_date: string;
  method: 'Cash' | 'Bank Transfer' | 'Vodafone Cash' | 'InstaPay' | string;
  receipt_ref: string | null;
  notes: string | null;
  added_by?: string | null;
  voided_at: string | null;
  created_at: string;
}

export interface Expense {
  expense_id: string;
  cash_box_id: string;
  course_id: string | null;
  amount: number;
  category: 'Rent' | 'Salary' | 'Supplies' | 'Hardware' | 'Marketing' | 'Utilities' | 'Other' | string;
  description: string | null;
  expense_date: string;
  notes: string | null;
  added_by?: string | null;
  created_at: string;
}

export interface CashBoxTransfer {
  transfer_id: string;
  from_box_id: string;
  to_box_id: string;
  amount: number;
  transfer_date: string;
  notes: string | null;
  added_by?: string | null;
  created_at: string;
}

// ── Views ──────────────────────────────────────────────────

export interface EnrollmentBalance {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  student_name: string;
  course_name: string;
  agreed_cost: number;
  enrollment_status: 'Active' | 'Completed' | 'Dropped';
  enrolled_at: string;
  total_paid: number;
  remaining_balance: number;
  payment_status: 'Paid' | 'Partial' | 'Unpaid' | 'Overpaid';
}

export interface CashBoxBalance {
  cash_box_id: string;
  name: string;
  type: string;
  owner: string | null;
  is_active: boolean;
  opening_balance: number;
  total_payments_in: number;
  total_expenses_out: number;
  total_transfers_in: number;
  total_transfers_out: number;
  current_balance: number;
}

export interface CourseFinancialSummary {
  course_id: string;
  course_name: string;
  availability_status: string;
  max_students: number | null;
  default_cost: number;
  active_enrollments: number;
  vacant_places: number | null;
  total_enrollments: number;
  expected_revenue: number;
  collected_payments: number;
  total_expenses: number;
  net_profit: number;
}

export interface DashboardMetrics {
  total_students: number;
  new_students_this_month: number;
  active_courses: number;
  active_enrollments: number;
  revenue_this_month: number;
  expenses_this_month: number;
  net_profit_this_month: number;
  total_revenue_all_time: number;
  total_expenses_all_time: number;
  net_profit_all_time: number;
  total_pending_balance: number;
}

export interface PaymentTableRow extends Payment {
  student_name?: string;
  course_name?: string;
  cash_box_name?: string;
  enrollment?: {
    student_id: string;
    course_id: string;
    student?: { name: string };
    course?: { course_name: string };
  };
  cash_box?: { name: string };
}
