import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { Volume2 } from 'lucide-react-native'
import * as Speech from 'expo-speech'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bouton, BoutonEcouter, PhotoPlante, T, Titre } from '@/components/ui'
import { useDonnees } from '@/lib/donnees'
import { C, F, R } from '@/theme'

export const CLE_BIENVENUE = 'ama.bienvenue.v1'
const LANGUES = [['fr', 'Français', 'Lire et écouter en français'], ['fon', 'Fɔngbè', 'Fon · écouter les fiches'], ['ewe', 'Eʋegbe', 'Éwé · écouter les fiches']] as const
const PAGES = [
  { slug: 'moringa', titre: 'Cette plante est-elle sûre ?', texte: 'Scannez une plante ou tapez son nom local : Amà vous dit ce qu’on sait d’elle, et les précautions à prendre.' },
  { slug: 'neem', titre: 'Naturel ne veut pas dire sans danger', texte: 'Certaines plantes sont toxiques, surtout pour les enfants et les femmes enceintes. L’huile de neem, par exemple, ne se boit jamais. Amà indique le niveau de prudence de chaque plante.' },
  { slug: 'cafe-negre', titre: 'Un même nom, plusieurs plantes', texte: 'Au Togo, « kinkéliba » désigne aussi le café nègre, dont les graines sont dangereuses. Un nom local ne suffit pas : comparez la photo ou scannez la plante.' },
  { slug: 'armoise', titre: 'Pas mieux ? Ça s’aggrave ? Voyez un médecin', texte: 'Si vous n’allez pas mieux, ou si ça s’aggrave, allez au centre de santé. Un remède ne remplace jamais un test ni un traitement, par exemple contre le paludisme.' },
  { slug: 'hysope-africaine', titre: 'Le savoir de nos tradipraticiens', texte: 'Chaque fiche est partagée par un tradipraticien, puis relue par un pharmacien ou un médecin. Leurs noms sont affichés.' },
  { slug: 'basilic-africain', titre: 'Un effet après un remède ?', texte: 'Signalez-le en quelques gestes, sans donner votre nom. Les agents de santé de votre zone sont informés.' },
]

export default function Bienvenue() {
  const { catalogue: c } = useDonnees()
  const insets = useSafeAreaInsets()
  const [page, setPage] = useState(-1)
  const [langue, setLangue] = useState<string>('fr')
  const terminer = async (vers: '/' | '/connexion') => { try { await AsyncStorage.setItem(CLE_BIENVENUE, '1') } catch { /* rien */ } router.replace(vers) }

  if (page < 0) {
    return (
      <View style={{ flex: 1, backgroundColor: C.papier, paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: insets.bottom + 20, gap: 14 }}>
        <Text style={{ fontFamily: F.titreGras, fontSize: 34, color: C.feuille }}>Amà</Text>
        <Titre taille={28}>Choisissez votre langue</Titre>
        <T style={{ color: C.gris }}>Vous pourrez la changer à tout moment.</T>
        {LANGUES.map(([v, l, d]) => (
          <View key={v} style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setLangue(v)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.moyen, borderWidth: 1.5, borderColor: langue === v ? C.feuille : C.bord, backgroundColor: langue === v ? C.feuilleClair : C.carte }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: langue === v ? C.feuille : C.bordFort, alignItems: 'center', justifyContent: 'center' }}>{langue === v && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.feuille }} />}</View>
              <View><Text style={{ fontFamily: F.titre, fontSize: 19, color: C.ecorce }}>{l}</Text><T style={{ fontSize: 13, color: C.gris }}>{d}</T></View>
            </Pressable>
            <Pressable accessibilityLabel={`Écouter ${l}`} onPress={() => v === 'fr' && Speech.speak('Français. Lire et écouter en français.', { language: 'fr-FR' })} style={{ width: 70, borderRadius: R.moyen, borderWidth: 1.5, borderColor: C.bord, backgroundColor: C.carte, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <Volume2 size={19} color={C.feuille} /><Text style={{ fontFamily: F.moyen, fontSize: 11, color: C.feuille }}>Écouter</Text>
            </Pressable>
          </View>
        ))}
        {langue !== 'fr' && <T style={{ fontSize: 13.5, color: C.kola }}>Les textes restent en français ; la lecture des fiches en {langue === 'fon' ? 'fon' : 'éwé'} arrive avec le modèle vocal MMS.</T>}
        <View style={{ flex: 1 }} />
        <Bouton onPress={() => setPage(0)}>Continuer</Bouton>
      </View>
    )
  }
  const p = PAGES[page]
  const plante = c?.plantes.find((x) => x.slug === p.slug)
  return (
    <View style={{ flex: 1, backgroundColor: C.papier, paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 20, gap: 16 }}>
      <Pressable onPress={() => terminer('/')} style={{ alignSelf: 'flex-end', padding: 6 }}><Text style={{ fontFamily: F.demi, color: C.feuille, fontSize: 15 }}>Passer</Text></Pressable>
      <PhotoPlante plante={plante} style={{ height: 250, borderRadius: R.grand }} />
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        {PAGES.map((_, i) => <Pressable key={i} accessibilityLabel={`Page ${i + 1} sur ${PAGES.length}`} hitSlop={8} onPress={() => setPage(i)} style={{ width: i === page ? 26 : 12, height: 5, borderRadius: 3, backgroundColor: i === page ? C.feuille : C.bord }} />)}
        <Text style={{ marginLeft: 'auto', fontFamily: F.moyen, fontSize: 12.5, color: C.gris }}>{page + 1} / {PAGES.length}</Text>
      </View>
      <Titre taille={30}>{p.titre}</Titre>
      <T style={{ fontSize: 16.5, lineHeight: 24, color: C.gris }}>{p.texte}</T>
      <BoutonEcouter key={page} texte={`${p.titre}. ${p.texte}`} libelle="Écouter" />
      <View style={{ flex: 1 }} />
      <Bouton onPress={() => (page < PAGES.length - 1 ? setPage(page + 1) : terminer('/'))}>{page < PAGES.length - 1 ? 'Suivant' : 'Commencer'}</Bouton>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Bouton variante="contour" onPress={() => terminer('/')} style={{ flex: 1 }}>Continuer sans compte</Bouton>
        <Bouton variante="contour" onPress={() => terminer('/connexion')} style={{ flex: 1 }}>Se connecter</Bouton>
      </View>
    </View>
  )
}
