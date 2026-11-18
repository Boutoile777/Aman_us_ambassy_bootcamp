// Données Amà : Supabase (cloud) si configuré, sinon les données importées du tableur.
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Platform } from 'react-native'
import seed from '../data/seed.json'
import { normaliser, prudenceRemede } from './regles'
import type { Catalogue, Contribution, DetailsContribution, NomLocal, Profil, Remede, Signalement, Validation } from './types'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const cle = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const sb = url && cle
  ? createClient(url, cle, {
      auth: {
        storage: Platform.OS === 'web' && typeof window === 'undefined' ? undefined : AsyncStorage,
        autoRefreshToken: true, persistSession: true, detectSessionInUrl: false,
      },
    })
  : null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ok = (r: { data: any; error: { message: string } | null }): any => { if (r.error) throw new Error(r.error.message); return r.data ?? [] }

// ------------------------------------------------------------------ connexion simulée par SMS
// Démonstration : un numéro de téléphone correspond à un compte de démo ; le « SMS » est simulé.
export const COMPTES_DEMO = [
  { tel: '01 97 45 22 12', pays: 'BJ', email: 'maman.k@demo.example.com', nom: 'Maman K.', role: 'Tradipraticienne · Bohicon' },
  { tel: '90 11 22 33', pays: 'TG', email: 'papa.a@demo.example.com', nom: 'Papa A.', role: 'Tradipraticien · Tchamba' },
  { tel: '01 66 10 20 30', pays: 'BJ', email: 'dr.a@demo.example.com', nom: 'Dr A.', role: 'Pharmacien · Cotonou' },
  { tel: '01 55 40 50 60', pays: 'BJ', email: 'agent.b@demo.example.com', nom: 'Agent B.', role: 'Agent de santé · Abomey' },
  { tel: '01 00 00 00 01', pays: 'BJ', email: 'admin@demo.example.com', nom: 'Admin Amà', role: 'Administratrice' },
] as const
const MDP_DEMO = 'AmaDemo2026!'
export const CODE_DEMO = '482017'

export async function connexionSimulee(tel: string) {
  const n = tel.replace(/\D/g, '')
  const compte = COMPTES_DEMO.find((c) => c.tel.replace(/\D/g, '') === n)
  if (!compte) throw new Error('Numéro inconnu. En démonstration, choisissez un des numéros proposés.')
  if (!sb) throw new Error('Service indisponible.')
  ok(await sb.auth.signInWithPassword({ email: compte.email, password: MDP_DEMO }))
}

// ------------------------------------------------------------------ lecture
async function chargerCatalogue(): Promise<Catalogue> {
  if (!sb) return seed as unknown as Catalogue
  const [sources, plantes, plante_sources, noms, usages, remedes, composants] = await Promise.all([
    sb.from('sources').select('*'), sb.from('plantes').select('*').eq('statut', 'valide'), sb.from('plante_sources').select('*'),
    sb.from('noms_locaux').select('*').eq('statut', 'valide'), sb.from('usages').select('*').eq('statut', 'valide'),
    sb.from('remedes').select('*').eq('statut', 'valide'), sb.from('composants').select('*'),
  ])
  return {
    sources: ok(sources), plantes: ok(plantes), plante_sources: ok(plante_sources),
    noms_locaux: ok(noms).map((n: NomLocal & { contributeur_nom?: string }) => ({ ...n, contributeur: n.contributeur_nom ?? null })),
    usages: ok(usages), remedes: ok(remedes).map((r: Remede & { relu_par?: string[] }) => ({ ...r, relecteurs: r.relu_par ?? [] })),
    composants: ok(composants),
  }
}

async function chargerProfil(): Promise<Profil | null> {
  if (!sb) return null
  const id = (await sb.auth.getSession()).data.session?.user.id
  if (!id) return null
  const { data } = await sb.from('profils').select('*').eq('id', id).maybeSingle()
  return data as Profil | null
}

async function chargerContributions(): Promise<Contribution[]> {
  if (!sb) return []
  const data = ok(await sb.from('contributions').select('*, profils!contributions_contributeur_id_fkey(nom_affiche), validations(*, profils(nom_affiche, role))').order('created_at', { ascending: false }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((c) => ({
    ...c, contributeur_nom: c.profils?.nom_affiche,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validations: (c.validations ?? []).map((v: any) => ({ ...v, validateur_nom: v.profils ? `${v.profils.nom_affiche}, ${v.profils.role === 'sante' ? 'pharmacien' : v.profils.role === 'tradipraticien' ? 'tradipraticien' : v.profils.role}` : undefined })),
  }))
}

// ------------------------------------------------------------------ écriture
export const actions = {
  async deconnexion() { await sb?.auth.signOut() },
  async signaler(s: Omit<Signalement, 'id' | 'created_at' | 'statut'>) { if (sb) ok(await sb.from('signalements').insert(s)) },
  async signalements(): Promise<Signalement[]> { return sb ? ok(await sb.from('signalements').select('*').order('created_at', { ascending: false })) : [] },
  async soumettre(details: DetailsContribution, resume: string, consentement: boolean) {
    if (!sb) throw new Error('Service indisponible')
    const id = (await sb.auth.getSession()).data.session?.user.id
    if (!id) throw new Error('Connectez-vous pour partager un savoir.')
    ok(await sb.from('contributions').insert({ type: details.type, contributeur_id: id, consentement, statut: 'soumis', resume, details }))
  },
  async retirer(id: string) { if (sb) ok(await sb.rpc('retirer_contribution', { cid: id })) },
  async valider(id: string, type: Validation['type'], decision: Validation['decision'], commentaire = '') {
    if (!sb) return
    const vid = (await sb.auth.getSession()).data.session?.user.id
    ok(await sb.from('validations').upsert({ contribution_id: id, validateur_id: vid, type, decision, commentaire: commentaire || null }, { onConflict: 'contribution_id,type' }))
  },
  async majGrille(id: string, grille: Record<string, boolean>) { if (sb) ok(await sb.from('contributions').update({ grille }).eq('id', id)) },
  async demanderPrecision(id: string, message: string) { if (sb) ok(await sb.from('contributions').update({ statut: 'complement_demande', motif_refus: message }).eq('id', id)) },
  async refuser(id: string, motif: string) { if (sb) ok(await sb.from('contributions').update({ statut: 'refuse', motif_refus: motif }).eq('id', id)) },
  async publier(c: Contribution, cat: Catalogue) {
    if (!sb) return
    const d = c.details
    const relecteurs = c.validations.filter((v) => v.decision === 'approuve').map((v) => v.validateur_nom ?? '').filter(Boolean)
    let cible: string
    if (d.type === 'nom_local') {
      const r = ok(await sb.from('noms_locaux').insert({ plante_id: d.plante_id, nom: d.nom.trim(), pays: d.pays, langue: d.langue || null, lieu: d.lieu || null, statut: 'valide', contributeur_nom: c.contributeur_nom }).select('id').single())
      cible = r.id
    } else if (d.type === 'usage') {
      const r = ok(await sb.from('usages').insert({ plante_id: d.plante_id, pays: d.pays, partie: d.partie || null, preparation: d.preparation || null, indications: d.indications, contexte: d.contexte || null, statut: 'valide', contributeur_nom: c.contributeur_nom }).select('id').single())
      cible = r.id
    } else {
      const prudence = prudenceRemede('a_evaluer', d.composants.map((k) => cat.plantes.find((p) => p.id === k.plante_id)?.prudence ?? 'a_evaluer'))
      const slug = normaliser(d.nom).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)
      const r = ok(await sb.from('remedes').insert({
        slug, nom: d.nom, origine_pays: d.origine_pays, origine_lieux: [d.commune, d.region].filter(Boolean), histoire: d.histoire || null,
        indication: d.indication || null, prudence, visibilite: d.visibilite, effets_connus: d.effets_connus || null, deconseille_a: d.deconseille_a || null,
        contributeur_id: c.contributeur_id, contributeur_nom: c.contributeur_nom, relu_par: relecteurs, statut: 'valide',
      }).select('id').single())
      cible = r.id
      ok(await sb.from('composants').insert(d.composants.map((k, i) => ({ remede_id: cible, plante_id: k.plante_id, plante_proposee: k.plante_id ? null : k.plante_proposee, partie: k.partie || null, usage_benin: k.usage_benin || null, usage_togo: k.usage_togo || null, ordre: i }))))
    }
    ok(await sb.from('contributions').update({ statut: 'valide', cible_id: cible }).eq('id', c.id))
  },
}

// ------------------------------------------------------------------ contexte
interface Etat {
  catalogue: Catalogue | null; profil: Profil | null; contributions: Contribution[]
  erreur: string | null; charge: boolean; rafraichir: () => Promise<void>
}
const Ctx = createContext<Etat | null>(null)

export function FournisseurDonnees({ children }: { children: ReactNode }) {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [erreur, setErreur] = useState<string | null>(null)
  const [charge, setCharge] = useState(false)

  const rafraichir = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([chargerCatalogue(), chargerProfil()])
      setCatalogue(c); setProfil(p); setErreur(null)
      setContributions(p ? await chargerContributions() : [])
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e))
      setCatalogue((x) => x ?? (seed as unknown as Catalogue))
    } finally { setCharge(true) }
  }, [])

  useEffect(() => {
    void rafraichir()
    const abo = sb?.auth.onAuthStateChange(() => { void rafraichir() })
    return () => abo?.data.subscription.unsubscribe()
  }, [rafraichir])

  return <Ctx.Provider value={{ catalogue, profil, contributions, erreur, charge, rafraichir }}>{children}</Ctx.Provider>
}

export function useDonnees() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDonnees hors fournisseur')
  return v
}
