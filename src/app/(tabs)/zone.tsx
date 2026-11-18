import { router } from 'expo-router'
import { CircleAlert, Info, List, Map as IconeCarte, TriangleAlert } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Bascule, Bouton, Choix, Ecran, T, Titre } from '@/components/ui'
import { actions, useDonnees } from '@/lib/donnees'
import type { Signalement } from '@/lib/types'
import { C, F, R } from '@/theme'

// Positions approximatives des communes (lat, long) pour la carte schématique.
const COMMUNES: Record<string, [number, number]> = {
  'abomey-calavi': [6.45, 2.35], cotonou: [6.37, 2.43], ouidah: [6.36, 2.08], allada: [6.66, 2.15], pahou: [6.38, 2.17],
  'tori-bossito': [6.5, 2.15], abomey: [7.18, 1.99], bohicon: [7.18, 2.07], 'porto-novo': [6.5, 2.6], lome: [6.13, 1.22], godomey: [6.4, 2.33],
}
const cleCommune = (s: string | null) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(',')[0].trim()
const GRAVITE = { grave: { c: C.terre, l: 'Grave', I: CircleAlert }, modere: { c: C.kola, l: 'Modérée', I: TriangleAlert }, leger: { c: C.gris, l: 'Légère', I: Info } } as const

export default function Zone() {
  const { profil, catalogue: c } = useDonnees()
  const [liste, setListe] = useState<Signalement[]>([])
  const [vue, setVue] = useState<'liste' | 'carte'>('liste')
  const [filtre, setFiltre] = useState<'toutes' | 'grave' | 'modere' | 'leger'>('toutes')
  const [sel, setSel] = useState<string | null>(null)
  const charger = useCallback(() => { void actions.signalements().then(setListe).catch(() => setListe([])) }, [])
  useEffect(charger, [charger, profil?.id])

  if (!profil || !['agent', 'sante', 'admin'].includes(profil.role)) {
    return <Ecran><Titre>Ma zone</Titre><T>Réservé aux agents de santé identifiés.</T><Bouton onPress={() => router.push('/connexion')}>Se connecter</Bouton></Ecran>
  }
  const nom = (s: Signalement) => c?.plantes.find((p) => p.id === s.plante_id)?.nom_francais ?? c?.remedes.find((r) => r.id === s.remede_id)?.nom ?? s.produit_libre ?? 'Inconnue'
  const visibles = liste.filter((s) => filtre === 'toutes' || (s.gravite ?? 'leger') === filtre)
  const compte = (g: string) => liste.filter((s) => (s.gravite ?? 'leger') === g).length
  const parCommune = new Map<string, Signalement[]>()
  for (const s of visibles) { const k = cleCommune(s.commune); parCommune.set(k, [...(parCommune.get(k) ?? []), s]) }

  // Projection simple sur la boîte des communes connues
  const pts = Object.values(COMMUNES)
  const [latMin, latMax] = [Math.min(...pts.map((p) => p[0])) - 0.08, Math.max(...pts.map((p) => p[0])) + 0.08]
  const [lonMin, lonMax] = [Math.min(...pts.map((p) => p[1])) - 0.1, Math.max(...pts.map((p) => p[1])) + 0.1]

  return (
    <Ecran>
      <View><Titre taille={30}>Ma zone</Titre><T style={{ color: C.gris, fontSize: 14 }}>{profil.commune ?? 'Toutes les communes'} · {liste.length} signalement{liste.length > 1 ? 's' : ''}</T></View>
      <Bascule options={[['liste', 'Liste'], ['carte', 'Carte']]} valeur={vue} choisir={setVue} />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <Choix libelle={`Toutes · ${liste.length}`} actif={filtre === 'toutes'} onPress={() => setFiltre('toutes')} style={{ minHeight: 38 }} />
        {(['grave', 'modere', 'leger'] as const).map((g) => <Choix key={g} libelle={`${GRAVITE[g].l} · ${compte(g)}`} actif={filtre === g} onPress={() => setFiltre(g)} style={{ minHeight: 38 }} />)}
      </View>

      {liste.length === 0 && (
        <View style={{ gap: 10, paddingTop: 16 }}>
          <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: C.feuilleClair, alignItems: 'center', justifyContent: 'center' }}><IconeCarte size={26} color={C.feuille} /></View>
          <Titre taille={23}>Aucun signalement dans votre zone</Titre>
          <T style={{ color: C.gris }}>Vous serez prévenu immédiatement en cas de signalement grave.</T>
        </View>
      )}

      {vue === 'liste' ? visibles.map((s) => {
        const g = GRAVITE[s.gravite ?? 'leger']
        return (
          <View key={s.id} style={{ backgroundColor: C.carte, borderLeftWidth: 4, borderLeftColor: g.c, borderRadius: R.petit, padding: 12, gap: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontFamily: F.gras, fontSize: 15.5, color: C.ecorce, flex: 1 }}>{nom(s)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><g.I size={14} color={g.c} /><Text style={{ fontFamily: F.gras, fontSize: 12, color: g.c }}>{g.l}</Text></View>
            </View>
            <T style={{ fontSize: 14 }}>{s.symptomes.join(', ')} · {s.personne === 'enfant' ? 'enfant' : s.personne === 'femme_enceinte' ? 'femme enceinte' : s.personne === 'personne_agee' ? 'personne âgée' : 'adulte'}</T>
            <T style={{ fontSize: 12.5, color: C.gris }}>{s.commune ?? 'Commune inconnue'} · {new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</T>
          </View>
        )
      }) : (
        <View style={{ gap: 10 }}>
          <View style={{ height: 330, backgroundColor: '#EAE3D3', borderRadius: R.grand, borderWidth: 1, borderColor: C.bord, overflow: 'hidden' }}>
            {Array.from({ length: 8 }).map((_, i) => <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${(i + 1) * 11}%`, height: 1, backgroundColor: '#DDD3BF' }} />)}
            {Array.from({ length: 6 }).map((_, i) => <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i + 1) * 14}%`, width: 1, backgroundColor: '#DDD3BF' }} />)}
            <Text style={{ position: 'absolute', bottom: 8, left: 10, fontFamily: F.titreItalique, fontSize: 12, color: C.gris }}>Golfe de Guinée</Text>
            {[...parCommune].map(([k, l]) => {
              const pos = COMMUNES[k]; if (!pos) return null
              const top = ((latMax - pos[0]) / (latMax - latMin)) * 290 + 10
              const left = ((pos[1] - lonMin) / (lonMax - lonMin)) * 85
              const pire = l.some((s) => s.gravite === 'grave') ? C.terre : l.some((s) => s.gravite === 'modere') ? C.kola : C.gris
              return (
                <Pressable key={k} onPress={() => setSel(k)} style={{ position: 'absolute', top, left: `${left}%`, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ minWidth: 26, height: 26, borderRadius: 6, backgroundColor: pire, alignItems: 'center', justifyContent: 'center', borderWidth: sel === k ? 2 : 0, borderColor: C.ecorce }}><Text style={{ fontFamily: F.gras, color: '#fff', fontSize: 13 }}>{l.length}</Text></View>
                  <Text style={{ fontFamily: F.demi, fontSize: 11.5, color: C.ecorce, backgroundColor: 'rgba(246,241,231,0.85)', paddingHorizontal: 4, borderRadius: 3 }}>{l[0].commune?.split(',')[0]}</Text>
                </Pressable>
              )
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 14 }}>{(['grave', 'modere', 'leger'] as const).map((g) => <View key={g} style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><View style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: GRAVITE[g].c }} /><T style={{ fontSize: 13 }}>{GRAVITE[g].l}</T></View>)}</View>
          {sel && parCommune.get(sel) && (
            <View style={{ backgroundColor: C.carte, borderWidth: 1, borderColor: C.bord, borderRadius: R.moyen, padding: 12, gap: 4 }}>
              <T style={{ fontFamily: F.gras }}>{parCommune.get(sel)![0].commune} · {parCommune.get(sel)!.length} signalement{parCommune.get(sel)!.length > 1 ? 's' : ''}</T>
              {parCommune.get(sel)!.map((s) => <T key={s.id} style={{ fontSize: 13.5, color: s.gravite === 'grave' ? C.terre : C.ecorce }}>{nom(s)} · {s.symptomes.join(', ').toLowerCase()}</T>)}
            </View>
          )}
          <T style={{ fontSize: 12, color: C.gris }}>Carte schématique · données anonymisées, à la commune.</T>
        </View>
      )}
    </Ecran>
  )
}
