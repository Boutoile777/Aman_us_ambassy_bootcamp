// Règles métier d'Amà (ama-contexte/docs/regles-metier.md) — non négociables.
import type { Catalogue, NomLocal, Pays, Plante, Prudence } from './types'

export const normaliser = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export const PAYS_LIBELLE: Record<Pays, string> = { BJ: 'Bénin', TG: 'Togo' }

export const PRUDENCE: Record<Prudence, { libelle: string; segments: number; fond: string; texte: string; barre: string }> = {
  faible: { libelle: 'Prudence faible', segments: 1, fond: '#D8EADB', texte: '#1F4B3A', barre: '#5FA472' },
  moderee: { libelle: 'Prudence modérée', segments: 2, fond: '#FBE9C6', texte: '#7A5310', barre: '#E9B24C' },
  elevee: { libelle: 'Prudence élevée', segments: 3, fond: '#B8382A', texte: '#FFFFFF', barre: '#B8382A' },
  a_evaluer: { libelle: 'Prudence à évaluer', segments: 0, fond: '#ECE6DA', texte: '#5F6A63', barre: '#DDD6C8' },
}

const RANG: Record<Prudence, number> = { a_evaluer: 0, faible: 1, moderee: 2, elevee: 3 }

/** Un remède hérite de la prudence la plus élevée de ses plantes. */
export function prudenceRemede(declaree: Prudence, plantes: Prudence[]): Prudence {
  if (plantes.includes('elevee')) return 'elevee'
  return [declaree, ...plantes].reduce((a, p) => (RANG[p] > RANG[a] ? p : a), declaree)
}

/** Signes de danger (liste OMS chez l'enfant) : interrompent le signalement. */
export const SIGNES_DANGER = [
  'Incapable de boire ou de téter, ou vomit tout',
  'Convulsions',
  'Difficulté à respirer',
  'Léthargique ou inconscient',
]

export const MESSAGE_INTERACTION = 'Vous suivez un traitement ? Demandez à un soignant avant d’utiliser ce remède.'
export const MENTION_PIED = 'Amà informe et oriente, mais ne pose pas de diagnostic. En cas de signes graves, rendez-vous au centre de santé.'

/** Messages de risque obligatoires, rattachés par nom scientifique. */
export const ALERTES_RISQUE: Record<string, string> = {
  'azadirachta indica': 'Huile de neem : jamais par la bouche, jamais chez l’enfant (intoxications mortelles).',
  'artemisia annua': 'L’OMS déconseille l’armoise sous toute forme contre le paludisme : elle ne remplace jamais un test et un traitement.',
  'moringa oleifera': 'Écorce, racine et fleurs de moringa : à éviter pendant la grossesse.',
  'vernonia amygdalina': 'Feuille amère : à éviter pendant la grossesse.',
  'cymbopogon citratus': 'Citronnelle : à éviter pendant la grossesse.',
  'catharanthus roseus': 'Pervenche de Madagascar : ne pas consommer.',
  'senna occidentalis': 'Café nègre : graines dangereuses, surtout pour les enfants.',
}
export const alerteRisque = (p: Plante) => ALERTES_RISQUE[normaliser(p.nom_scientifique)] ?? null

// ------------------------------------------------------------------ textes
const POSOLOGIE = /\b(\d+\s*(tasses?|verres?|cuill[eè]res?|gouttes?|fois|jours?|semaines?|mg|g|ml|cl|litres?)|par jour|matin et soir|pendant \d+)\b/i
const GUERISON = /\b(gu[ée]rit|gu[ée]rir|gu[ée]rison|soigne d[ée]finitivement|miracle|efficace à 100|remplace (le|votre) traitement)\b/i

/** Vérifie un texte proposé : aucune posologie, aucune promesse de guérison. */
export function verifierTexte(t: string): string[] {
  const pb: string[] = []
  if (POSOLOGIE.test(t)) pb.push('Ce texte semble contenir une posologie (dose, nombre de tasses, durée). Elle ne sera pas publiée.')
  if (GUERISON.test(t)) pb.push('Ce texte semble promettre une guérison. Écrivez plutôt « on l’utilise pour… ».')
  return pb
}

// ------------------------------------------------------------------ noms
export const libelleLangue = (n: Pick<NomLocal, 'langue' | 'lieu'>) =>
  n.langue === 'nom courant' ? 'Nom courant' : n.langue ? n.langue[0].toUpperCase() + n.langue.slice(1) : n.lieu ? n.lieu : 'Langue à préciser'

/** Regroupe les noms d'une plante dans un pays : un nom, plusieurs langues. */
export function grouperNoms(noms: NomLocal[]) {
  const m = new Map<string, { nom: string; etiquettes: string[] }>()
  for (const n of noms) {
    const cle = n.nom_normalise
    if (!m.has(cle)) m.set(cle, { nom: n.nom, etiquettes: [] })
    const e = libelleLangue(n)
    if (!m.get(cle)!.etiquettes.includes(e)) m.get(cle)!.etiquettes.push(e)
  }
  return [...m.values()]
}

/** Noms partagés : même nom normalisé pour plusieurs plantes (vue noms_partages). */
export function nomsPartages(c: Catalogue) {
  const m = new Map<string, Set<string>>()
  for (const n of c.noms_locaux) {
    if (n.statut !== 'valide') continue
    if (!m.has(n.nom_normalise)) m.set(n.nom_normalise, new Set())
    m.get(n.nom_normalise)!.add(n.plante_id)
  }
  return new Map([...m].filter(([, s]) => s.size > 1))
}

/** Autres plantes qui portent un des noms de cette plante. */
export function confusionsPossibles(c: Catalogue, plante: Plante, pays?: Pays) {
  const partages = nomsPartages(c)
  const res: { nom: string; autres: Plante[]; pays: Pays[] }[] = []
  const vus = new Set<string>()
  for (const n of c.noms_locaux) {
    if (n.plante_id !== plante.id || (pays && n.pays !== pays) || vus.has(n.nom_normalise)) continue
    const s = partages.get(n.nom_normalise)
    if (!s) continue
    vus.add(n.nom_normalise)
    const autres = [...s].filter((id) => id !== plante.id).map((id) => c.plantes.find((p) => p.id === id)!).filter(Boolean)
    const paysAutres = [...new Set(c.noms_locaux.filter((x) => x.nom_normalise === n.nom_normalise && x.plante_id !== plante.id).map((x) => x.pays))]
    res.push({ nom: n.nom, autres, pays: paysAutres })
  }
  return res
}

export const estManquant = (s: string | null | undefined) => !s || /^(à|a) (trouver|recueillir|préciser|documenter)/i.test(s)
