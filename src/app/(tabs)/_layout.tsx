import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui'
import { ClipboardCheck, House, Leaf, Map, ScanLine, TriangleAlert, User, type LucideIcon } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDonnees } from '@/lib/donnees'
import { C, F } from '@/theme'

type Bouton = TabTriggerSlotProps & { libelle: string; Icone: LucideIcon; centre?: boolean; badge?: number; cache?: boolean }

function BoutonOnglet({ libelle, Icone, centre, badge, cache, isFocused, ref, ...p }: Bouton) {
  if (cache) return <View ref={ref as never} style={{ display: 'none' }} />
  const couleur = isFocused ? C.feuille : C.gris
  return (
    <Pressable ref={ref as never} {...p} accessibilityRole="tab" accessibilityLabel={libelle} accessibilityState={{ selected: !!isFocused }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3, paddingBottom: 6, minHeight: 56 }}>
      {isFocused && !centre && <View style={{ position: 'absolute', top: 0, width: 28, height: 3, borderRadius: 2, backgroundColor: C.feuille }} />}
      {centre ? (
        <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: C.feuille, alignItems: 'center', justifyContent: 'center', marginTop: -24, borderWidth: 4, borderColor: C.papier }}>
          <Icone size={26} color="#fff" strokeWidth={2.2} />
        </View>
      ) : (
        <View>
          <Icone size={22} color={couleur} strokeWidth={isFocused ? 2.4 : 2} />
          {badge ? <View style={{ position: 'absolute', top: -5, right: -10, backgroundColor: C.terre, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ color: '#fff', fontFamily: F.gras, fontSize: 11 }}>{badge}</Text></View> : null}
        </View>
      )}
      <Text style={{ fontFamily: isFocused ? F.gras : F.moyen, fontSize: 11.5, color: couleur }}>{libelle}</Text>
    </Pressable>
  )
}

export default function Onglets() {
  const { profil, contributions } = useDonnees()
  const insets = useSafeAreaInsets()
  const role = profil?.role ?? 'visiteur'
  const relecteur = role === 'sante' || role === 'admin'
  const enAttente = contributions.filter((c) => ['soumis', 'en_revue'].includes(c.statut)).length
  const espace = role === 'tradipraticien' || (profil && role === 'visiteur')

  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View style={{ flexDirection: 'row', backgroundColor: C.papier, borderTopWidth: 1, borderTopColor: C.bord, paddingBottom: insets.bottom, paddingHorizontal: 4 }}>
          <TabTrigger name="index" href="/" asChild><BoutonOnglet libelle="Accueil" Icone={House} /></TabTrigger>
          <TabTrigger name="plantes" href="/plantes" asChild><BoutonOnglet libelle="Plantes" Icone={Leaf} /></TabTrigger>
          <TabTrigger name="scanner" href="/scanner" asChild><BoutonOnglet libelle="Scanner" Icone={ScanLine} centre /></TabTrigger>
          <TabTrigger name="signaler" href="/signaler" asChild><BoutonOnglet libelle="Signaler" Icone={TriangleAlert} cache={relecteur || role === 'agent'} /></TabTrigger>
          <TabTrigger name="validation" href="/validation" asChild><BoutonOnglet libelle={role === 'admin' ? 'Validation' : 'Relecture'} Icone={ClipboardCheck} badge={enAttente || undefined} cache={!relecteur} /></TabTrigger>
          <TabTrigger name="zone" href="/zone" asChild><BoutonOnglet libelle="Ma zone" Icone={Map} cache={role !== 'agent'} /></TabTrigger>
          <TabTrigger name="profil" href="/profil" asChild><BoutonOnglet libelle={espace ? 'Mon espace' : 'Profil'} Icone={User} /></TabTrigger>
        </View>
      </TabList>
    </Tabs>
  )
}
