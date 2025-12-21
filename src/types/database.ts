export type AppRole = 'patient' | 'doctor' | 'admin';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  medical_conditions: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  license_number: string;
  specialization: string;
  qualification: string | null;
  experience_years: number;
  consultation_fee: number;
  bio: string | null;
  is_approved: boolean;
  is_available: boolean;
  available_days: string[];
  available_from: string;
  available_to: string;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  video_room_url: string | null;
  triage_id: string | null;
  created_at: string;
  updated_at: string;
  doctor?: Doctor & { profile?: Profile };
  patient?: Patient & { profile?: Profile };
}

export interface MedicalReport {
  id: string;
  patient_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  report_type: string | null;
  report_date: string;
  tags: string[] | null;
  description: string | null;
  is_shared_with_doctors: boolean;
  shared_with: string[] | null;
  created_at: string;
}

export interface TriageHistory {
  id: string;
  patient_id: string;
  symptoms: string[];
  symptom_description: string | null;
  ai_response: TriageResponse | null;
  predicted_conditions: string[] | null;
  urgency: UrgencyLevel;
  recommended_specialization: string | null;
  created_at: string;
}

export interface TriageResponse {
  urgency: UrgencyLevel;
  confidence: number;
  predicted_conditions: string[];
  recommended_specialization: string;
  advice: string;
  warning_signs: string[];
  self_care_tips: string[];
  follow_up_questions?: string[];
  reasoning?: string;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  prescription: string | null;
  diagnosis: string | null;
  follow_up_notes: string | null;
  follow_up_date: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  consultation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}
