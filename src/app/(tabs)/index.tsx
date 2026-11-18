import { router } from 'expo-router'
import { ChevronRight, Coffee, Languages, Mic, ScanLine, Search } from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { BoutonEcouter, Carte, Ecran, MentionPied, NomSci, PhotoPlante, Prudence, T, Titre } from '@/components/ui'
import { useDonnees } from '@/lib/donnees'
import { PAYS_LIBELLE } from '@/lib/regles'
import { C, F, R } from '@/theme'

const QUOTIDIEN = ['moringa', 'kinkeliba', 'neem', 'basilic-africain', 'citronnelle', 'bissap', 'feuille-amere']

export default function Accueil() {
  const { catalogue: c, profil } = useDonnees()
  const [q, setQ] = useState('')
  useEffect(() => { AsyncStorage.getItem('ama.bienvenue.v1').then((v) => { if (!v) router.replace('/bienvenue') }).catch(() => {}) }, [])
  if (!c) return <Ecran><T>Chargement…</T></Ecran>
  const plantes = QUOTIDIEN.map((s) => c.plantes.find((p) => p.slug === s)).filter((p) => !!p)
  const chercher = () => router.push({ pathname: '/plantes', params: { q } })

  return (
    <Ecran>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: F.titreGras, fontSize: 26, color: C.feuille }}>Amà</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.bord, borderRadius: R.rond, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: C.carte }}>
          <Languages size={15} color={C.gris} /><Text style={{ fontFamily: F.demi, fontSize: 13, color: C.ecorce }}>FR</Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <T style={{ color: C.gris, fontSize: 14 }}>Àfɔ̀n ɖagbe{profil ? `, ${profil.nom_affiche}` : ''} · Bonjour</T>
        <Titre taille={34}>Cette plante est-elle sûre ?</Titre>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/scanner')}
        style={({ pressed }) => ({ backgroundColor: C.feuille, borderRadius: R.grand, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.9 : 1 })}>
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}><ScanLine size={26} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.titre, fontSize: 21, color: '#fff' }}>Scanner une plante</Text>
          <Text style={{ fontFamily: F.texte, fontSize: 13.5, color: '#D7E0D2' }}>Une photo, et Amà vous dit ce qu’on sait d’elle</Text>
        </View>
        <ChevronRight size={22} color="#fff" />
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.carte, borderWidth: 1.5, borderColor: C.bord, borderRadius: R.moyen, paddingLeft: 12 }}>
        <Search size={18} color={C.gris} />
        <TextInput value={q} onChangeText={setQ} onSubmitEditing={chercher} returnKeyType="search" placeholder="Nom local, ex. kinkéliba" placeholderTextColor={C.grisClair}
          accessibilityLabel="Chercher une plante par son nom" style={{ flex: 1, minHeight: 50, paddingHorizontal: 10, fontFamily: F.texte, fontSize: 16, color: C.ecorce }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Dicter le nom" onPress={chercher} style={{ borderLeftWidth: 1, borderLeftColor: C.bord, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', minHeight: 50 }}>
          <Mic size={18} color={C.feuille} /><Text style={{ fontFamily: F.moyen, fontSize: 10.5, color: C.feuille }}>Dicter</Text>
        </Pressable>
      </View>

      <BoutonEcouter libelle="Écouter l’accueil" texte="Bienvenue dans Amà. Scannez une plante ou tapez son nom local pour savoir ce qu’on sait d’elle et les précautions à prendre. En cas de signes graves, allez au centre de santé." />

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: F.titre, fontSize: 21, color: C.ecorce }}>Plantes du quotidien</Text>
          <Pressable onPress={() => router.push('/plantes')}><Text style={{ fontFamily: F.demi, fontSize: 14, color: C.feuille, textDecorationLine: 'underline' }}>Tout voir</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 18 }} style={{ marginRight: -18 }}>
          {plantes.map((p) => (
            <Pressable key={p.id} onPress={() => router.push(`/plante/${p.slug}`)} style={{ width: 150, backgroundColor: C.carte, borderRadius: R.grand, borderWidth: 1, borderColor: C.bord, overflow: 'hidden' }}>
              <PhotoPlante plante={p} credit={false} style={{ height: 120 }} />
              <View style={{ padding: 10, gap: 4 }}>
                <Text style={{ fontFamily: F.titre, fontSize: 17, color: C.ecorce }}>{p.nom_francais}</Text>
                <NomSci style={{ fontSize: 12.5 }}>{p.nom_scientifique}</NomSci>
                <View style={{ marginTop: 4 }}><Prudence p={p.prudence} court /></View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ fontFamily: F.titre, fontSize: 21, color: C.ecorce }}>Remèdes connus</Text>
        {c.remedes.filter((r) => r.visibilite !== 'agents').slice(0, 3).map((r) => {
          const n = c.composants.filter((k) => k.remede_id === r.id).length
          return (
            <Carte key={r.id} onPress={() => router.push(`/remede/${r.slug}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: C.doreClair, alignItems: 'center', justifyContent: 'center' }}><Coffee size={20} color={C.kola} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: F.demi, fontSize: 15.5, color: C.ecorce }} numberOfLines={1}>{r.nom}</Text>
                <T style={{ fontSize: 13, color: C.gris }}>{n} plante{n > 1 ? 's' : ''} · {r.origine_pays.map((x) => PAYS_LIBELLE[x]).join(', ')}</T>
              </View>
              <Prudence p={r.prudence} court />
            </Carte>
          )
        })}
      </View>
      <MentionPied />
    </Ecran>
  )
}
