import { CircleCheck, CircleHelp, Clock, CloudUpload, Trash2, X } from 'lucide-react-native'
import { alerteRisque, normaliser, verifierTexte } from './regles'
import type { Catalogue, Contribution } from './types'
import { C } from '@/theme'

export function statut(c: Contribution) {
  const trad = c.validations.some((v) => v.type === 'tradition' && v.decision === 'approuve')
  const sante = c.validations.some((v) => v.type === 'sante' && v.decision === 'approuve')
  if (c.statut === 'valide') return { mot: 'Publié', c: C.pousse, fond: '#E6EEDD', I: CircleCheck }
  if (c.statut === 'refuse') return { mot: 'Non retenu', c: C.terre, fond: C.terreClair, I: X }
  if (c.statut === 'retire') return { mot: 'Retiré', c: C.gris, fond: '#ECE6DA', I: Trash2 }
  if (c.statut === 'complement_demande') return { mot: 'Précision demandée', c: C.kola, fond: C.kolaClair, I: CircleHelp }
  if (trad && sante) return { mot: 'Prêt à publier', c: C.pousse, fond: '#E6EEDD', I: CircleCheck }
  if (trad) return { mot: 'Relecture sécurité', c: C.gris, fond: '#ECE6DA', I: Clock }
  if (sante) return { mot: 'Relecture tradition', c: C.gris, fond: '#ECE6DA', I: Clock }
  return { mot: 'En attente de relecture', c: C.gris, fond: '#ECE6DA', I: CloudUpload }
}

export function sousTitre(c: Contribution, nomPlante: (id: string) => string) {
  const d = c.details
  if (d.type === 'nom_local') return `Nom local · ${d.langue || d.lieu}`
  if (d.type === 'usage') return `Usage au ${d.pays === 'BJ' ? 'Bénin' : 'Togo'} · ${nomPlante(d.plante_id)}`
  return `Remède · ${d.composants.length} plante${d.composants.length > 1 ? 's' : ''}`
}


export const GRILLE = [
  { cle: 'posologie', libelle: 'Aucune posologie (dose, durée, tasses)' },
  { cle: 'guerison', libelle: 'Aucune promesse de guérison' },
  { cle: 'identifiee', libelle: 'Plante bien identifiée (nom scientifique)' },
  { cle: 'source', libelle: 'Source ou témoin indiqué' },
  { cle: 'consentement', libelle: 'Accord du contributeur et visibilité choisie' },
] as const

export function pretAPublier(c: Contribution) {
  const ok = (t: 'tradition' | 'sante') => c.validations.some((v) => v.type === t && v.decision === 'approuve')
  return ok('tradition') && ok('sante') && c.consentement && GRILLE.every((g) => c.grille?.[g.cle])
}

/** Vérifications automatiques affichées aux relecteurs. */
export function verifications(c: Contribution, cat: Catalogue): { ton: 'alerte' | 'danger'; texte: string }[] {
  const out: { ton: 'alerte' | 'danger'; texte: string }[] = []
  const d = c.details
  const plante = (id: string | null) => cat.plantes.find((p) => p.id === id)
  if (d.type === 'nom_local') {
    const autres = [...new Set(cat.noms_locaux.filter((n) => n.nom_normalise === normaliser(d.nom) && n.plante_id !== d.plante_id).map((n) => n.plante_id))].map((id) => plante(id)!).filter(Boolean)
    if (autres.length) out.push({ ton: 'alerte', texte: `Ce nom existe déjà pour une autre plante : ${autres.map((a) => `${a.nom_francais.toLowerCase()} (${a.nom_scientifique})`).join(', ')}. S’il est validé, il sera marqué « nom partagé ».` })
  }
  const plantes = d.type === 'remede' ? d.composants.map((k) => plante(k.plante_id)) : [plante(d.plante_id)]
  for (const p of plantes) if (p?.prudence === 'elevee') out.push({ ton: 'danger', texte: `Prudence élevée : ${p.nom_francais}. ${alerteRisque(p) ?? ''} Relecture par un professionnel de santé obligatoire.` })
  if (d.type === 'remede' && d.composants.some((k) => !k.plante_id)) out.push({ ton: 'alerte', texte: 'Une des plantes n’a pas encore de fiche dans Amà : il faut l’identifier avant de publier.' })
  const textes = d.type === 'remede' ? [d.indication, d.histoire, ...d.composants.flatMap((k) => [k.usage_benin, k.usage_togo])] : d.type === 'usage' ? [d.preparation, ...d.indications] : []
  for (const t of new Set(textes.flatMap((x) => verifierTexte(x ?? '')))) out.push({ ton: 'alerte', texte: t })
  return out
}
