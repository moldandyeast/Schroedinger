// Types for the Lens (matching Bridge types)

export interface KO {
  id: string;
  title: string;
  content: string;
  content_hash: string;
  type: 'fragment' | 'synthesis' | 'observation';
  tags: string[];
  created_at: string;
  updated_at: string;
  file_path: string;
}

export interface KOPhysics {
  ko_id: string;
  position_x: number;
  position_y: number;
  velocity_x: number;
  velocity_y: number;
  mass: number;
  entropy: number;
  is_anchored: boolean;
}

export interface KOMemory {
  ko_id: string;
  observation_count: number;
  last_observed: string | null;
  total_observation_time: number;
  collision_count: number;
  drift_distance: number;
  affinity_scores: Record<string, number>;
  rivalry_scores: Record<string, number>;
  behavioral_traits: Traits;
  evolution_history: EvolutionEvent[];
}

export interface Traits {
  restless?: boolean;
  stable?: boolean;
  magnetic?: boolean;
  volatile?: boolean;
  forgotten?: boolean;
  emergent?: boolean;
  ancient?: boolean;
}

export interface EvolutionEvent {
  timestamp: string;
  type: string;
  details: Record<string, unknown>;
}

export interface Link {
  source_id: string;
  target_id: string;
  link_type: 'explicit' | 'collision' | 'agent';
  created_at: string;
}

export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export interface AcceleratorSet {
  anchor: KO;
  relatives: KO[];
  strangers: KO[];
}

