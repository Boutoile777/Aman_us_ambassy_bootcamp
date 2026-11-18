import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { ArrowLeft, BookOpen, Check, Image as IconeImage, Lightbulb, ScanLine, Search, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bouton, Carte, NomSci, PhotoPlante, Prudence, T, Titre } from '@/components/ui'
import { sb, useDonnees } from '@/lib/donnees'
import { normaliser } from '@/lib/regles'
import type { Plante } from '@/lib/types'
import { C, F, R } from '@/theme'

type Resultat = { score: number; nom_scientifique: string; noms_communs: string[] }
type Etat = { etape: 'camera' } | { etape: 'analyse'; uri: string } | { etape: 'resultat'; uri: string; res: Resultat[]; demo: boolean } | { etape: 'autres'; uri: string; res: Resultat[]; demo: boolean }

// Mode démo : photos d'exemple dont le résultat Pl@ntNet a été préparé à l'avance.
const EXEMPLES: { slug: string; res: Resultat[] }[] = [
  { slug: 'moringa', res: [{ score: 0.92, nom_scientifique: 'Moringa oleifera', noms_communs: ['Moringa'] }, { score: 0.04, nom_scientifique: 'Newbouldia laevis', noms_communs: [] }] },
  { slug: 'kinkeliba', res: [{ score: 0.71, nom_scientifique: 'Combretum micranthum', noms_communs: ['Kinkéliba'] }, { score: 0.12, nom_scientifique: 'Senna occidentalis', noms_communs: ['Café nègre'] }] },
  { slug: 'neem', res: [{ score: 0.88, nom_scientifique: 'Azadirachta indica', noms_communs: ['Neem'] }, { score: 0.06, nom_scientifique: 'Melia azedarach', noms_communs: ['Lilas des Indes'] }] },
  { slug: 'citronnelle', res: [{ score: 0.83, nom_scientifique: 'Cymbopogon citratus', noms_communs: ['Citronnelle'] }] },
]

async function identifier(uri: string): Promise<Resultat[]> {
  if (!sb) throw new Error('indisponible')
  const form = new FormData()
  if (Platform.OS === 'web') form.append('image', await (await fetch(uri)).blob(), 'photo.jpg')
  else form.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob)
  form.append('organe', 'auto')
  const { data, error } = await sb.functions.invoke('identifier-plante', { body: form })
  if (error) throw new Error('indisponible')
  return data?.resultats ?? []
}

export default function Scanner() {
  const { catalogue: c } = useDonnees()
  const insets = useSafeAreaInsets()
  const [etat, setEtat] = useState<Etat>({ etape: 'camera' })
  const [erreur, setErreur] = useState<string | null>(null)
  const [conseils, setConseils] = useState(false)

  const fiche = (r: Resultat): Plante | undefined => c?.plantes.find((p) => normaliser(p.nom_scientifique) === normaliser(r.nom_scientifique))

  async function analyser(uri: string, demo?: Resultat[]) {
    setErreur(null); setEtat({ etape: 'analyse', uri })
    if (demo) { setTimeout(() => setEtat({ etape: 'resultat', uri, res: demo, demo: true }), 2200); return }
    try { setEtat({ etape: 'resultat', uri, res: await identifier(uri), demo: false }) }
    catch { setEtat({ etape: 'camera' }); setErreur('La reconnaissance n’a pas pu aboutir (réseau ou quota Pl@ntNet du jour atteint). Réessayez, essayez une photo d’exemple ci-dessous, ou cherchez par nom local.') }
  }
  async function photo(source: 'camera' | 'galerie') {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 }
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted && Platform.OS !== 'web') { setErreur('Autorisez l’appareil photo pour scanner une plante.'); return }
    }
    const r = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts)
    if (!r.canceled && r.assets[0]) void analyser(r.assets[0].uri)
  }
  useEffect(() => () => setEtat({ etape: 'camera' }), [])

  // -------------------------------------------------------------- caméra
  if (etat.etape === 'camera') {
    return (
      <View style={{ flex: 1, backgroundColor: C.ecorce, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, height: 52 }}>
          <Pressable accessibilityLabel="Fermer" onPress={() => router.replace('/')} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><X size={22} color="#fff" /><Text style={{ fontFamily: F.demi, color: '#fff', fontSize: 15 }}>Fermer</Text></Pressable>
          <Text style={{ fontFamily: F.titre, color: '#fff', fontSize: 18 }}>Scanner</Text>
          <View style={{ width: 70 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 56 }}>
          <View style={{ aspectRatio: 0.9, borderRadius: R.grand, backgroundColor: '#2E332B', overflow: 'hidden', justifyContent: 'flex-end' }}>
            {c?.plantes.find((p) => p.slug === 'moringa') && <PhotoPlante plante={c.plantes.find((p) => p.slug === 'moringa')} credit={false} style={{ position: 'absolute', inset: 0, opacity: 0.35 } as never} />}
            {[[0, 0], [0, 1], [1, 0], [1, 1]].map(([h, d]) => (
              <View key={`${h}${d}`} style={{ position: 'absolute', width: 34, height: 34, borderColor: '#fff', [h ? 'bottom' : 'top']: 26, [d ? 'right' : 'left']: 26, [h ? 'borderBottomWidth' : 'borderTopWidth']: 3, [d ? 'borderRightWidth' : 'borderLeftWidth']: 3 } as never} />
            ))}
            <View style={{ margin: 16, backgroundColor: 'rgba(246,241,231,0.95)', borderRadius: R.moyen, padding: 11, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Lightbulb size={17} color={C.feuille} /><T style={{ fontSize: 14, flex: 1 }}>Une seule feuille, à la lumière du jour</T>
            </View>
          </View>

          {erreur && <View style={{ backgroundColor: C.kolaClair, borderRadius: R.moyen, padding: 12 }}><T style={{ fontSize: 14 }}>{erreur}</T></View>}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
            <Pressable accessibilityRole="button" onPress={() => photo('galerie')} style={{ alignItems: 'center', gap: 5, width: 80 }}><IconeImage size={24} color="#fff" /><Text style={{ fontFamily: F.moyen, color: '#fff', fontSize: 13 }}>Galerie</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Prendre la photo" onPress={() => photo('camera')} style={{ alignItems: 'center', gap: 6 }}>
              <View style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' }} /></View>
              <Text style={{ fontFamily: F.demi, color: '#fff', fontSize: 13 }}>Prendre la photo</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setConseils(!conseils)} style={{ alignItems: 'center', gap: 5, width: 80 }}><Lightbulb size={24} color="#fff" /><Text style={{ fontFamily: F.moyen, color: '#fff', fontSize: 13 }}>Conseils</Text></Pressable>
          </View>
          {conseils && (
            <View style={{ backgroundColor: '#2E332B', borderRadius: R.moyen, padding: 14, gap: 8 }}>
              {['Tenez le téléphone immobile', 'Une seule feuille, bien à plat', 'À la lumière du jour, sans contre-jour', 'Une fleur ou un fruit aide beaucoup'].map((x) => (
                <View key={x} style={{ flexDirection: 'row', gap: 8 }}><Check size={16} color={C.dore} /><Text style={{ fontFamily: F.texte, color: '#E9E3D6', fontSize: 14 }}>{x}</Text></View>
              ))}
            </View>
          )}

          <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: '#3B4036', paddingTop: 16 }}>
            <Text style={{ fontFamily: F.demi, color: '#E9E3D6', fontSize: 14 }}>Essayer avec une photo d’exemple</Text>
            <Text style={{ fontFamily: F.texte, color: '#A9A293', fontSize: 12.5 }}>Mode démonstration : le résultat de ces photos est préparé à l’avance.</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {EXEMPLES.map((e) => {
                const p = c?.plantes.find((x) => x.slug === e.slug)
                return (
                  <Pressable key={e.slug} accessibilityLabel={`Exemple : ${p?.nom_francais}`} onPress={() => p?.photo_url && analyser(p.photo_url, e.res)} style={{ flex: 1, aspectRatio: 1, borderRadius: R.moyen, overflow: 'hidden' }}>
                    <PhotoPlante plante={p} credit={false} style={{ flex: 1 }} />
                  </Pressable>
                )
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // -------------------------------------------------------------- analyse
  if (etat.etape === 'analyse') {
    return (
      <View style={{ flex: 1, backgroundColor: C.papier }}>
        <Image source={{ uri: etat.uri }} style={{ height: 380 + insets.top }} contentFit="cover" />
        <View style={{ padding: 18, gap: 14 }}>
          <Titre taille={24}>Analyse en cours…</Titre>
          <View style={{ height: 5, borderRadius: 3, backgroundColor: C.bord, overflow: 'hidden' }}><View style={{ width: '62%', height: 5, backgroundColor: C.feuille }} /></View>
          {[[Check, 'Photo reçue', true], [ScanLine, 'Comparaison avec Pl@ntNet (intelligence artificielle)', false], [BookOpen, 'Recherche dans les fiches Amà', false]].map(([I, l, fait]) => {
            const Ic = I as typeof Check
            return <View key={l as string} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Ic size={18} color={fait ? C.pousse : C.gris} /><T style={{ fontSize: 15, fontFamily: fait ? F.texte : F.demi }}>{l as string}</T></View>
          })}
          <Bouton variante="contour" onPress={() => setEtat({ etape: 'camera' })}>Annuler</Bouton>
        </View>
      </View>
    )
  }

  // -------------------------------------------------------------- résultat
  const premier = etat.res[0]
  const p = premier ? fiche(premier) : undefined
  if (etat.etape === 'resultat' && premier) {
    return (
      <View style={{ flex: 1, backgroundColor: C.papier }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <Image source={{ uri: etat.uri }} style={{ height: 320 + insets.top }} contentFit="cover" />
          <View style={{ padding: 18, gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: F.demi, fontSize: 11, letterSpacing: 1.1, color: C.gris }}>PLANTE RECONNUE</Text>
              <Text style={{ fontFamily: F.texte, fontSize: 12, color: C.gris }}>Identification : Pl@ntNet{etat.demo ? ' · mode démo' : ''}</Text>
            </View>
            <View><Titre taille={34}>{p?.nom_francais ?? premier.noms_communs[0] ?? premier.nom_scientifique}</Titre><NomSci style={{ fontSize: 16 }}>{premier.nom_scientifique}</NomSci></View>
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T style={{ fontFamily: F.demi, fontSize: 14 }}>Confiance : {Math.round(premier.score * 100)} %</T>
                <T style={{ fontSize: 13, color: C.gris }}>{premier.score > 0.8 ? 'Bonne correspondance' : premier.score > 0.5 ? 'Correspondance moyenne' : 'Correspondance faible'}</T>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: C.bord }}><View style={{ width: `${premier.score * 100}%`, height: 6, borderRadius: 3, backgroundColor: premier.score > 0.8 ? C.pousse : C.kola }} /></View>
            </View>
            {p ? <Prudence p={p.prudence} /> : <T style={{ color: C.gris }}>Cette plante n’a pas encore de fiche dans Amà.</T>}
            {etat.res.slice(1).some((r) => fiche(r)?.prudence === 'elevee') && (
              <View style={{ backgroundColor: C.terreClair, borderLeftWidth: 4, borderLeftColor: C.terre, borderRadius: R.petit, padding: 12 }}>
                <T style={{ fontSize: 14 }}>Attention : elle ressemble aussi à <Text style={{ fontFamily: F.gras }}>{etat.res.slice(1).map(fiche).find((x) => x?.prudence === 'elevee')?.nom_francais}</Text>, une plante dangereuse. Comparez bien avant d’utiliser.</T>
              </View>
            )}
            {p && <Bouton onPress={() => router.push(`/plante/${p.slug}`)}>Voir la fiche</Bouton>}
            <Bouton variante="contour" onPress={() => setEtat({ etape: 'autres', uri: etat.uri, res: etat.res, demo: etat.demo })}>Ce n’est pas ma plante</Bouton>
            <Pressable onPress={() => setEtat({ etape: 'camera' })} style={{ alignItems: 'center', padding: 6 }}><Text style={{ fontFamily: F.demi, color: C.feuille, fontSize: 15 }}>Scanner une autre plante</Text></Pressable>
          </View>
        </ScrollView>
      </View>
    )
  }

  // -------------------------------------------------------------- autres possibilités
  return (
    <View style={{ flex: 1, backgroundColor: C.papier, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, height: 54, borderBottomWidth: 1, borderBottomColor: C.bord }}>
        <Pressable accessibilityLabel="Retour" onPress={() => etat.etape === 'autres' && setEtat({ ...etat, etape: 'resultat' })}><ArrowLeft size={22} color={C.ecorce} /></Pressable>
        <Text style={{ fontFamily: F.titre, fontSize: 19, color: C.ecorce }}>Autres possibilités</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
        <T style={{ color: C.gris }}>D’autres plantes ressemblent à votre photo. Comparez bien les feuilles.</T>
        {etat.res.slice(1).map((r) => {
          const f = fiche(r)
          return (
            <Carte key={r.nom_scientifique} onPress={f ? () => router.push(`/plante/${f.slug}`) : undefined} style={{ flexDirection: 'row', gap: 12 }}>
              <PhotoPlante plante={f} credit={false} style={{ width: 72, height: 72, borderRadius: R.moyen }} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontFamily: F.titre, fontSize: 17, color: C.ecorce }}>{f?.nom_francais ?? r.noms_communs[0] ?? r.nom_scientifique}</Text>
                <NomSci style={{ fontSize: 13 }}>{r.nom_scientifique} · {Math.round(r.score * 100)} %</NomSci>
                {f ? <Prudence p={f.prudence} court /> : <T style={{ fontSize: 12.5, color: C.gris }}>Pas encore de fiche dans Amà</T>}
              </View>
            </Carte>
          )
        })}
        {etat.res.length < 2 && <T style={{ color: C.gris }}>Pas d’autre plante proche.</T>}
        <Bouton icone={ScanLine} onPress={() => setEtat({ etape: 'camera' })}>Reprendre une photo</Bouton>
        <Bouton variante="contour" icone={Search} onPress={() => router.push('/plantes')}>Chercher par nom local</Bouton>
        <T style={{ fontSize: 12.5, color: C.gris, textAlign: 'center' }}>Identification fournie par Pl@ntNet.</T>
      </ScrollView>
    </View>
  )
}
