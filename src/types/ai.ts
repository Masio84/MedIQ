export type AIPromptFeature = 
  | 'diagnose' 
  | 'treatment_suggestion' 
  | 'patient_summary' 
  | 'assistant_summary' 
  | 'followup_suggestion' 
  | 'trend_analysis'
  | 'summarize' 
  | 'treat' 
  | 'analyze-trends' 
  | 'suggest-followup' 
  | 'cie10-search' 
  | 'summarize-assistant';

export interface AIPrompt {
  id: string;
  name: string;
  description: string | null;
  prompt_text: string;
  is_public: boolean;
  is_active: boolean;
  version: number;
  feature_key: AIPromptFeature;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AIPromptAssignment {
  id: string;
  prompt_id: string;
  doctor_id: string;
  created_at: string;
}

export interface AIPromptWithAssignments extends AIPrompt {
  assignments?: string[]; // array of doctor_ids
}
