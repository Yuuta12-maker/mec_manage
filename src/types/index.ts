export interface Client {
  id: string;
  name: string;
  name_kana?: string;
  email: string;
  gender?: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  preferred_session_format?: 'face-to-face' | 'online';
  status: 'applied' | 'trial_booked' | 'trial_completed' | 'active' | 'completed' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
  trial_completed_at?: string;
}

export interface Session {
  id: string;
  client_id: string;
  scheduled_date: string;
  type: 'trial' | 'regular';
  status: 'scheduled' | 'completed' | 'cancelled';
  meet_link?: string;
  notes?: string;
  summary?: string;
  coach_name: string;
  session_number?: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  type: 'trial' | 'program';
  amount: number;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string | number | boolean | object;
  created_at: string;
  updated_at: string;
}

export interface SessionWithClient extends Session {
  client: Client;
}

export interface DashboardStats {
  total: number;
  applied: number;
  trial_booked: number;
  trial_completed: number;
  active: number;
  completed: number;
  inactive: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  content: string;
  type: 'application' | 'booking' | 'session_update' | 'next_session_promotion';
  related_id?: string;
  status: 'sent' | 'failed';
  error_message?: string;
  sent_at: string;
  created_at: string;
}

export interface ContinuationApplication {
  id: string;
  client_id: string;
  trial_session_id?: string;
  program_type: string;
  preferred_start_date?: string;
  payment_method?: string;
  goals?: string;
  schedule_preference?: string;
  special_requests?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface ContinuationApplicationWithClient extends ContinuationApplication {
  client: Client;
  trial_session?: Session;
}