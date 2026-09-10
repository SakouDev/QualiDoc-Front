export interface Medecin {
  id: number;
  nom: string;
  prenom: string;
  specialite_id: number;
  specialite_nom: string;
}

export interface Specialite {
  id: number;
  nom: string;
}

export interface Creneau {
  date_heure: string;
  disponible: boolean;
}

export interface RendezVous {
  id: number;
  patient_id: number;
  medecin_id: number;
  date_heure: string;
  statut: "confirme" | "annule" | "honore";
  medecin_nom: string;
  medecin_prenom: string;
  specialite_nom: string;
  // Présents uniquement sur /admin/rendez-vous (jointure patients côté back).
  patient_nom?: string;
  patient_prenom?: string;
}
