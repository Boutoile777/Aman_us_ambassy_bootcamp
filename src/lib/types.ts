export type Pays = 'BJ' | 'TG'
export type Prudence = 'faible' | 'moderee' | 'elevee' | 'a_evaluer'
export type Role = 'visiteur' | 'tradipraticien' | 'sante' | 'agent' | 'admin'

export interface Source { id: string; titre: string; url: string | null; annee: number | null }

export interface Plante {
  id: string; slug: string; nom_francais: string; nom_scientifique: string
  prudence: Prudence; science: string | null; precautions: string[]
  photo_url: string | null; photo_auteur: string | null; photo_licence: string | null; photo_page: string | null
  statut: string
}
export interface PlanteSource { plante_id: string; source_id: string; role: 'science' | 'noms_usages' }

export interface NomLocal {
  id: string; plante_id: string; nom: string; nom_normalise: string
  pays: Pays; langue: string | null; lieu: string | null; statut: string
  contributeur?: string | null
}

export interface Usage {
  id: string; plante_id: string; pays: Pays
  partie: string | null; preparation: string | null; indications: string[]
  precision: string | null; contexte: string | null; texte: string | null; statut: string
}

export interface Remede {
  id: string; slug: string; nom: string; origine_pays: Pays[]; origine_lieux: string[]
  histoire: string | null; indication: string | null; prudence: Prudence
  visibilite: 'public' | 'sans_proportions' | 'agents'
  effets_connus: string | null; deconseille_a: string | null
  source_id: string | null; contributeur_id: string | null; statut: string
  contributeur_nom?: string | null; relecteurs?: string[]
}

export interface Composant {
  id: string; remede_id: string; plante_id: string | null; plante_proposee: string | null
  partie: string | null; usage_benin: string | null; usage_togo: string | null; ordre: number
}

export interface Catalogue {
  sources: Source[]; plantes: Plante[]; plante_sources: PlanteSource[]
  noms_locaux: NomLocal[]; usages: Usage[]; remedes: Remede[]; composants: Composant[]
}

export interface Profil {
  id: string; nom_affiche: string; role: Role; verifie: boolean
  commune: string | null; pays: Pays | null; langues: string[] | null
  numero_autorisation: string | null; titre?: string | null
}

export type TypeContribution = 'nom_local' | 'usage' | 'remede' | 'plante'
export type StatutContribution = 'brouillon' | 'soumis' | 'en_revue' | 'complement_demande' | 'valide' | 'refuse' | 'retire'

export interface ComposantPropose {
  plante_id: string | null; plante_proposee: string | null
  partie: string; usage_benin: string; usage_togo: string
}

export type DetailsContribution =
  | { type: 'nom_local'; plante_id: string; nom: string; pays: Pays; langue: string; lieu: string; source: string }
  | { type: 'usage'; plante_id: string; pays: Pays; partie: string; preparation: string; indications: string[]; contexte: string; source: string }
  | {
      type: 'remede'; nom: string; nom_local: string; indication: string; composants: ComposantPropose[]; preparation: string
      origine_pays: Pays[]; region: string; commune: string; langue: string; histoire: string
      effets_connus: string; deconseille_a: string; visibilite: Remede['visibilite']
      role_contributeur: string; numero_autorisation: string
    }

export interface Validation {
  id: string; contribution_id: string; validateur_id: string; validateur_nom?: string
  type: 'tradition' | 'sante'; decision: 'approuve' | 'complement' | 'refuse'
  commentaire: string | null; created_at: string
}

export interface Contribution {
  id: string; type: TypeContribution; cible_id: string | null
  contributeur_id: string; contributeur_nom?: string
  consentement: boolean; statut: StatutContribution
  resume: string; details: DetailsContribution; grille: Record<string, boolean>
  motif_refus: string | null; created_at: string
  validations: Validation[]
}

export interface Signalement {
  id: string; plante_id: string | null; remede_id: string | null; produit_libre: string | null
  personne: 'enfant' | 'adulte' | 'femme_enceinte' | 'personne_agee' | null
  symptomes: string[]; signe_danger: boolean; gravite: 'leger' | 'modere' | 'grave' | null
  commune: string | null; pays: Pays | null; anonyme: boolean; auteur_id: string | null
  statut: string; created_at: string
}
