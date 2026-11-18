import { router, useLocalSearchParams } from 'expo-router'
import { ChevronRight, Coffee, Mic, Plus, ScanLine, Search, X } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Bouton, Carte, Choix, Ecran, Encadre, NomSci, PhotoPlante, Prudence, T, Titre } from '@/components/ui'
import { useDonnees } from '@/lib/donnees'
import { alerteRisque, normaliser, nomsPartages, PAYS_LIBELLE } from '@/lib/regles'
import type { Pays, Plante, Prudence as P } from '@/lib/types'
import { C, F, R } from '@/theme'

export default function Plantes() {
  const { catalogue: c } = useDonnees()
  const params = useLocalSearchParams<{ q?: string }>()
  const [q, setQ] = useState(params.q ?? '')
  const [type, setType] = useState<'tout' | 'plantes' | 'remedes'>('tout')
  const [prudence, setPrudence] = useState<P | 'tous'>('tous')
  useEffect(() => { if (params.q !== undefined) setQ(params.q) }, [params.q])

  const n = normaliser(q)
  const res = useMemo(() => {
    if (!c) return { plantes: [] as { p: Plante; noms: string[]; pays: Pays[] }[], remedes: [] as typeof c extends null ? never : NonNullable<typeof c>['remedes'] }
    const plantes = type === 'remedes' ? [] : c.plantes.filter((p) => prudence === 'tous' || p.prudence === prudence).map((p) => {
      const noms = c.noms_locaux.filter((x) => x.plante_id === p.id)
      const trouves = n ? noms.filter((x) => x.nom_normalise.includes(n)) : []
      const titre = !n || normaliser(p.nom_francais).includes(n) || normaliser(p.nom_scientifique).includes(n)
      if (!titre && !trouves.length) return null
      return { p, noms: [...new Set(trouves.map((x) => x.nom))], pays: [...new Set((trouves.length ? trouves : noms).map((x) => x.pays))].sort() as Pays[] }
    }).filter((x) => !!x)
    const remedes = type === 'plantes' ? [] : c.remedes.filter((r) => r.visibilite !== 'agents' && (prudence === 'tous' || r.prudence === prudence) && (!n || normaliser(`${r.nom} ${r.indication ?? ''}`).includes(n)))
    return { plantes, remedes }
  }, [c, n, type, prudence])

  if (!c) return <Ecran><T>Chargement…</T></Ecran>
  const partage = n ? nomsPartages(c).get(n) : undefined
  const plantesPartage = partage ? [...partage].map((id) => c.plantes.find((p) => p.id === id)!).filter(Boolean) : []
  const dangereuse = plantesPartage.find((p) => p.prudence === 'elevee')
  const suggestion = !res.plantes.length && !res.remedes.length && n.length > 2
    ? c.noms_locaux.find((x) => x.nom_normalise.startsWith(n.slice(0, 3))) : undefined

  return (
    <Ecran>
      <Titre taille={30}>Plantes et remèdes</Titre>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.carte, borderWidth: 1.5, borderColor: q ? C.feuille : C.bord, borderRadius: R.moyen, paddingLeft: 12 }}>
        <Search size={18} color={C.gris} />
        <TextInput value={q} onChangeText={setQ} placeholder="Nom local, français ou scientifique" placeholderTextColor={C.grisClair} autoCorrect={false}
          accessibilityLabel="Chercher" style={{ flex: 1, minHeight: 50, paddingHorizontal: 10, fontFamily: F.texte, fontSize: 16, color: C.ecorce }} />
        {q ? <Pressable accessibilityLabel="Effacer" onPress={() => setQ('')} style={{ padding: 12 }}><X size={18} color={C.gris} /></Pressable>
          : <View style={{ borderLeftWidth: 1, borderLeftColor: C.bord, paddingHorizontal: 14, alignItems: 'center', minHeight: 50, justifyContent: 'center' }}><Mic size={18} color={C.feuille} /><Text style={{ fontFamily: F.moyen, fontSize: 10.5, color: C.feuille }}>Dicter</Text></View>}
      </View>

      {plantesPartage.length > 1 ? (
        <>
          <Encadre ton={dangereuse ? 'danger' : 'alerte'} titre={`Même nom, ${plantesPartage.length} plantes différentes`}>
            {dangereuse ? `${alerteRisque(dangereuse) ?? `${dangereuse.nom_francais} porte aussi ce nom.`} ` : ''}Un nom local sert à chercher, pas à identifier. Comparez les photos, ou scannez la plante.
          </Encadre>
          <Bouton variante="contour" icone={ScanLine} onPress={() => router.push('/scanner')}>Scanner pour être sûr</Bouton>
          {plantesPartage.map((p) => {
            const pays = [...new Set(c.noms_locaux.filter((x) => x.plante_id === p.id && x.nom_normalise === n).map((x) => PAYS_LIBELLE[x.pays]))]
            return (
              <Carte key={p.id} onPress={() => router.push(`/plante/${p.slug}`)} style={{ padding: 0, overflow: 'hidden', borderColor: p.prudence === 'elevee' ? C.terre : C.bord, borderWidth: p.prudence === 'elevee' ? 1.5 : 1 }}>
                <PhotoPlante plante={p} style={{ height: 170 }} />
                <View style={{ padding: 14, gap: 6 }}>
                  <Text style={{ fontFamily: F.titre, fontSize: 21, color: C.ecorce }}>{p.nom_francais}</Text>
                  <NomSci>{p.nom_scientifique}</NomSci>
                  <T style={{ fontSize: 13.5, color: C.gris }}>Appelée « {q.trim()} » au {pays.join(' et au ')}</T>
                  <Prudence p={p.prudence} />
                  {p.prudence === 'elevee' && alerteRisque(p) && <T style={{ fontSize: 13.5, color: C.terre, fontFamily: F.demi }}>{alerteRisque(p)}</T>}
                </View>
              </Carte>
            )
          })}
        </>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Choix libelle="Tout" actif={type === 'tout'} onPress={() => setType('tout')} />
            <Choix libelle="Plantes" actif={type === 'plantes'} onPress={() => setType('plantes')} />
            <Choix libelle="Remèdes" actif={type === 'remedes'} onPress={() => setType('remedes')} />
            <View style={{ width: 1, backgroundColor: C.bord, marginHorizontal: 4 }} />
            {([['tous', 'Toute prudence'], ['faible', 'Faible'], ['moderee', 'Modérée'], ['elevee', 'Élevée'], ['a_evaluer', 'À évaluer']] as const).map(([v, l]) => (
              <Choix key={v} libelle={l} actif={prudence === v} onPress={() => setPrudence(v)} />
            ))}
          </ScrollView>

          {!res.plantes.length && !res.remedes.length && (
            <View style={{ gap: 14, paddingVertical: 10 }}>
              <Titre taille={22}>Aucune plante pour « {q} »</Titre>
              {suggestion && (
                <Carte onPress={() => setQ(suggestion.nom)}>
                  <T style={{ fontSize: 13, color: C.gris }}>Voulez-vous dire</T>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: F.demi, fontSize: 17, color: C.ecorce }}>{suggestion.nom} <Text style={{ fontFamily: F.texte, fontSize: 13, color: C.gris }}>· {suggestion.langue ?? suggestion.lieu}</Text></Text>
                    <ChevronRight size={18} color={C.gris} />
                  </View>
                  <T style={{ fontSize: 13, color: C.gris }}>{c.plantes.find((p) => p.id === suggestion.plante_id)?.nom_francais}</T>
                </Carte>
              )}
              <Bouton icone={ScanLine} onPress={() => router.push('/scanner')}>Scanner la plante</Bouton>
              <Bouton variante="contour" icone={Plus} onPress={() => router.push('/profil')}>Proposer ce nom (tradipraticiens)</Bouton>
            </View>
          )}

          {res.plantes.map(({ p, noms, pays }) => (
            <Carte key={p.id} onPress={() => router.push(`/plante/${p.slug}`)} style={{ flexDirection: 'row', gap: 12, padding: 10 }}>
              <PhotoPlante plante={p} credit={false} style={{ width: 84, height: 84, borderRadius: R.moyen }} />
              <View style={{ flex: 1, gap: 3, justifyContent: 'center' }}>
                <Text style={{ fontFamily: F.titre, fontSize: 18, color: C.ecorce }}>{p.nom_francais}</Text>
                <NomSci style={{ fontSize: 13 }}>{p.nom_scientifique}</NomSci>
                <T style={{ fontSize: 12.5, color: C.gris }} numberOfLines={1}>{noms.length ? `« ${noms.join(', ')} » · ` : ''}{pays.map((x) => PAYS_LIBELLE[x]).join(' · ')}</T>
                <View style={{ marginTop: 3 }}><Prudence p={p.prudence} court /></View>
              </View>
              <ChevronRight size={18} color={C.grisClair} style={{ alignSelf: 'center' }} />
            </Carte>
          ))}
          {res.remedes.map((r) => {
            const k = c.composants.filter((x) => x.remede_id === r.id).length
            return (
              <Carte key={r.id} onPress={() => router.push(`/remede/${r.slug}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#FBF6EA' }}>
                <View style={{ width: 52, height: 52, borderRadius: R.moyen, backgroundColor: C.doreClair, alignItems: 'center', justifyContent: 'center' }}><Coffee size={24} color={C.kola} /></View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontFamily: F.demi, fontSize: 10.5, letterSpacing: 1, color: C.kola }}>REMÈDE COMPOSÉ · {k} PLANTE{k > 1 ? 'S' : ''}</Text>
                  <Text style={{ fontFamily: F.titre, fontSize: 17, color: C.ecorce }} numberOfLines={2}>{r.nom}</Text>
                  <Prudence p={r.prudence} court />
                </View>
                <ChevronRight size={18} color={C.grisClair} />
              </Carte>
            )
          })}
        </>
      )}
    </Ecran>
  )
}
