import { Image } from 'expo-image'
import { router } from 'expo-router'
import * as Speech from 'expo-speech'
import { ArrowLeft, CircleAlert, CircleCheck, CircleHelp, TriangleAlert, Volume2, type LucideIcon } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Plante, Prudence } from '@/lib/types'
import { C, ESPACE, F, R } from '@/theme'

// ------------------------------------------------------------------ texte
type TProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }
export const T = ({ children, style, numberOfLines }: TProps) => <Text numberOfLines={numberOfLines} style={[s.texte, style]}>{children}</Text>
export const Titre = ({ children, style, taille = 30 }: TProps & { taille?: number }) => (
  <Text style={[{ fontFamily: F.titre, fontSize: taille, lineHeight: taille * 1.12, color: C.ecorce, letterSpacing: -0.3 }, style]}>{children}</Text>
)
export const Etiquette = ({ children, style }: TProps) => <Text style={[s.etiquette, style]}>{children}</Text>
export const NomSci = ({ children, style }: TProps) => <Text style={[{ fontFamily: F.titreItalique, fontSize: 14, color: C.gris }, style]}>{children}</Text>
export const Section = ({ titre, children, style }: { titre: string; children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ gap: 10 }, style]}><Text style={s.section}>{titre}</Text>{children}</View>
)

// ------------------------------------------------------------------ écran
export function Ecran({ children, titre, retour, fond = C.papier, pied, defile = true }: {
  children: ReactNode; titre?: string; retour?: boolean; fond?: string; pied?: ReactNode; defile?: boolean
}) {
  const insets = useSafeAreaInsets()
  const corps = <View style={{ padding: ESPACE, gap: 18, paddingBottom: 56 }}>{children}</View>
  return (
    <View style={{ flex: 1, backgroundColor: fond, paddingTop: insets.top }}>
      {(titre || retour) && (
        <View style={s.entete}>
          {retour && (
            <Pressable accessibilityRole="button" accessibilityLabel="Retour" hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.retour}>
              <ArrowLeft size={22} color={C.ecorce} />
            </Pressable>
          )}
          {titre && <Text style={s.enteteTitre}>{titre}</Text>}
        </View>
      )}
      {defile ? <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">{corps}</ScrollView> : <View style={{ flex: 1 }}>{corps}</View>}
      {pied && <View style={[s.pied, { paddingBottom: 12 + insets.bottom / 2 }]}>{pied}</View>}
    </View>
  )
}

// ------------------------------------------------------------------ boutons
export function Bouton({ children, onPress, variante = 'plein', icone: Icone, desactive, style }: {
  children: ReactNode; onPress?: () => void; variante?: 'plein' | 'contour' | 'danger' | 'dore'; icone?: LucideIcon; desactive?: boolean; style?: StyleProp<ViewStyle>
}) {
  const v = {
    plein: { bg: C.feuille, fg: '#fff', bd: C.feuille },
    contour: { bg: C.carte, fg: C.ecorce, bd: C.bord },
    danger: { bg: C.carte, fg: C.terre, bd: C.terre },
    dore: { bg: C.dore, fg: C.ecorce, bd: C.dore },
  }[variante]
  return (
    <Pressable accessibilityRole="button" disabled={desactive} onPress={onPress}
      style={({ pressed }) => [s.bouton, { backgroundColor: desactive ? '#B9B3A6' : v.bg, borderColor: desactive ? '#B9B3A6' : v.bd, opacity: pressed ? 0.85 : 1 }, style]}>
      {Icone && <Icone size={18} color={v.fg} strokeWidth={2.2} />}
      <Text style={[s.boutonTexte, { color: v.fg }]}>{children}</Text>
    </Pressable>
  )
}

export function Choix({ libelle, actif, onPress, style }: { libelle: string; actif: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: actif }} onPress={onPress}
      style={[s.choix, actif && { backgroundColor: C.feuille, borderColor: C.feuille }, style]}>
      <Text style={[s.choixTexte, actif && { color: '#fff' }]}>{libelle}</Text>
    </Pressable>
  )
}

export function Bascule<V extends string>({ options, valeur, choisir }: { options: [V, string][]; valeur: V; choisir: (v: V) => void }) {
  return (
    <View style={s.bascule}>
      {options.map(([v, l]) => (
        <Pressable key={v} accessibilityRole="tab" accessibilityState={{ selected: valeur === v }} onPress={() => choisir(v)}
          style={[s.basculeItem, valeur === v && { backgroundColor: C.feuille }]}>
          <Text style={[s.choixTexte, valeur === v && { color: '#fff' }]}>{l}</Text>
        </Pressable>
      ))}
    </View>
  )
}

// ------------------------------------------------------------------ prudence : couleur + icône + mot + jauge
const PRUD: Record<Prudence, { mot: string; c: string; fond: string; n: number; Icone: LucideIcon; detail: string }> = {
  faible: { mot: 'Prudence faible', c: C.pousse, fond: '#E6EEDD', n: 1, Icone: CircleCheck, detail: 'Usage courant, peu de risques connus' },
  moderee: { mot: 'Prudence modérée', c: C.kola, fond: C.kolaClair, n: 2, Icone: TriangleAlert, detail: 'Précautions à lire avant usage' },
  elevee: { mot: 'Prudence élevée', c: C.terre, fond: C.terreClair, n: 3, Icone: CircleAlert, detail: 'Risque connu : enfants, grossesse…' },
  a_evaluer: { mot: 'Prudence à évaluer', c: C.gris, fond: '#ECE6DA', n: 0, Icone: CircleHelp, detail: 'Pas assez de données vérifiées' },
}
export function Prudence({ p, court }: { p: Prudence; court?: boolean }) {
  const d = PRUD[p]
  return (
    <View style={[s.prud, { backgroundColor: d.fond }]}>
      <d.Icone size={14} color={d.c} strokeWidth={2.4} />
      <Text style={[s.prudTexte, { color: d.c }]}>{court ? d.mot.replace('Prudence ', '').replace(/^./, (x) => x.toUpperCase()) : d.mot}</Text>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3].map((i) => <View key={i} style={{ width: 4, height: 11, borderRadius: 1, backgroundColor: i <= d.n ? d.c : 'transparent', borderWidth: 1, borderColor: d.c }} />)}
      </View>
    </View>
  )
}
export const detailPrudence = (p: Prudence) => PRUD[p].detail

// ------------------------------------------------------------------ encadrés
export function Encadre({ ton, titre, children, Icone }: { ton: 'alerte' | 'danger' | 'info'; titre: string; children?: ReactNode; Icone?: LucideIcon }) {
  const t = { alerte: { c: C.kola, fond: C.kolaClair, I: TriangleAlert }, danger: { c: C.terre, fond: C.terreClair, I: CircleAlert }, info: { c: C.feuille, fond: C.feuilleClair, I: CircleCheck } }[ton]
  const I = Icone ?? t.I
  return (
    <View accessibilityRole="alert" style={[s.encadre, { backgroundColor: t.fond, borderColor: t.c }]}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><I size={17} color={t.c} strokeWidth={2.2} /><Text style={[s.encadreTitre, { color: t.c }]}>{titre}</Text></View>
      {children && <Text style={s.encadreTexte}>{children}</Text>}
    </View>
  )
}

export function ListePrecautions({ items }: { items: { texte: string; ton?: 'danger' | 'alerte' | 'info' }[] }) {
  return (
    <View style={{ gap: 10 }}>
      {items.map(({ texte, ton = 'alerte' }) => {
        const I = ton === 'danger' ? CircleAlert : ton === 'info' ? CircleHelp : TriangleAlert
        return (
          <View key={texte} style={{ flexDirection: 'row', gap: 10 }}>
            <I size={17} color={ton === 'danger' ? C.terre : ton === 'info' ? C.gris : C.kola} style={{ marginTop: 2 }} />
            <T style={{ flex: 1, lineHeight: 22 }}>{texte}</T>
          </View>
        )
      })}
    </View>
  )
}

// ------------------------------------------------------------------ voix
/** Lecture à voix haute. Français : synthèse vocale du téléphone. Fon / éwé : modèle MMS en préparation. */
export function BoutonEcouter({ texte, libelle = 'Écouter', langue = 'fr', clair }: { texte: string; libelle?: string; langue?: 'fr' | 'fon'; clair?: boolean }) {
  const [lecture, setLecture] = useState(false)
  const [info, setInfo] = useState(false)
  const lancer = () => {
    if (langue === 'fon') { setInfo(true); return }
    if (lecture) { Speech.stop(); setLecture(false); return }
    setLecture(true)
    Speech.speak(texte, { language: 'fr-FR', rate: 0.95, onDone: () => setLecture(false), onStopped: () => setLecture(false), onError: () => setLecture(false) })
  }
  return (
    <View style={{ gap: 6, alignSelf: 'flex-start' }}>
      <Pressable accessibilityRole="button" accessibilityLabel={libelle} onPress={lancer}
        style={({ pressed }) => [s.ecouter, clair && { backgroundColor: C.carte, borderWidth: 1, borderColor: C.bord }, { opacity: pressed ? 0.85 : 1 }]}>
        <View style={s.ecouterRond}><Volume2 size={15} color={C.ecorce} strokeWidth={2.4} /></View>
        <Text style={[s.ecouterTexte, clair && { color: C.feuille }]}>{lecture ? 'Arrêter la lecture' : libelle}</Text>
      </Pressable>
      {info && <T style={{ fontSize: 12.5, color: C.gris }}>La voix en fon (modèle MMS de Meta) arrive : les fiches sont en cours d’enregistrement.</T>}
    </View>
  )
}

// ------------------------------------------------------------------ photos (couleurs naturelles + crédit obligatoire)
export function PhotoPlante({ plante, style, credit = true, contentFit = 'cover' }: { plante: Plante | null | undefined; style?: StyleProp<ViewStyle>; credit?: boolean; contentFit?: 'cover' | 'contain' }) {
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: '#E7E0D2' }, style]}>
      {plante?.photo_url ? (
        <Image source={{ uri: plante.photo_url }} style={StyleSheet.absoluteFill} contentFit={contentFit} transition={200}
          accessibilityLabel={`${plante.nom_francais} (${plante.nom_scientifique})`} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontFamily: F.moyen, fontSize: 12, color: C.gris }}>Photo à prendre</Text></View>
      )}
      {credit && plante?.photo_url && (
        <View style={s.credit}><Text style={s.creditTexte} numberOfLines={1}>Photo : {plante.photo_auteur ?? 'auteur à préciser'} · {plante.photo_licence ?? 'licence à préciser'} · Wikimedia Commons</Text></View>
      )}
    </View>
  )
}

export function Carte({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => [s.carte, { opacity: pressed ? 0.9 : 1 }, style]}>{children}</Pressable>
  return <View style={[s.carte, style]}>{children}</View>
}

export function MentionPied() {
  return (
    <View style={s.mention}>
      <T style={{ fontSize: 13, color: C.gris, lineHeight: 19 }}>Amà informe et oriente, mais ne pose pas de diagnostic. En cas de signes graves, rendez-vous au centre de santé.</T>
    </View>
  )
}

export const s = StyleSheet.create({
  texte: { fontFamily: F.texte, fontSize: 15.5, color: C.ecorce, lineHeight: 22 },
  etiquette: { fontFamily: F.demi, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: C.gris },
  section: { fontFamily: F.titre, fontSize: 20, color: C.ecorce },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: ESPACE, height: 54, borderBottomWidth: 1, borderBottomColor: C.bord },
  enteteTitre: { fontFamily: F.titre, fontSize: 19, color: C.ecorce },
  retour: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  pied: { paddingHorizontal: ESPACE, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.bord, backgroundColor: C.papier, gap: 8 },
  bouton: { minHeight: 52, borderRadius: R.moyen, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  boutonTexte: { fontFamily: F.demi, fontSize: 16 },
  choix: { minHeight: 44, paddingHorizontal: 14, borderRadius: R.moyen, borderWidth: 1.5, borderColor: C.bord, backgroundColor: C.carte, alignItems: 'center', justifyContent: 'center' },
  choixTexte: { fontFamily: F.demi, fontSize: 14.5, color: C.ecorce },
  bascule: { flexDirection: 'row', borderWidth: 1.5, borderColor: C.bord, borderRadius: R.moyen, overflow: 'hidden', backgroundColor: C.carte },
  basculeItem: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  prud: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: R.petit },
  prudTexte: { fontFamily: F.gras, fontSize: 12.5 },
  encadre: { borderLeftWidth: 4, borderRadius: R.petit, padding: 14, gap: 6 },
  encadreTitre: { fontFamily: F.gras, fontSize: 15, flexShrink: 1 },
  encadreTexte: { fontFamily: F.texte, fontSize: 14.5, lineHeight: 21, color: C.ecorce },
  ecouter: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.feuille, borderRadius: R.rond, paddingVertical: 6, paddingLeft: 6, paddingRight: 16 },
  ecouterRond: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.dore, alignItems: 'center', justifyContent: 'center' },
  ecouterTexte: { fontFamily: F.demi, fontSize: 14, color: '#fff' },
  credit: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(34,38,31,0.62)', paddingHorizontal: 10, paddingVertical: 4 },
  creditTexte: { fontFamily: F.texte, fontSize: 10.5, color: '#F6F1E7' },
  carte: { backgroundColor: C.carte, borderWidth: 1, borderColor: C.bord, borderRadius: R.grand, padding: 14 },
  mention: { backgroundColor: '#EDE5D6', borderRadius: R.moyen, padding: 14 },
})
