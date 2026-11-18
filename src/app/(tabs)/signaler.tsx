import { router, useLocalSearchParams } from 'expo-router'
import { CircleAlert, CircleCheck, Hospital, Lock, Mic, ScanLine, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bouton, Choix, T, Titre } from '@/components/ui'
import { actions, useDonnees } from '@/lib/donnees'
import { SIGNES_DANGER } from '@/lib/regles'
import type { Signalement } from '@/lib/types'
import { C, F, R } from '@/theme'

const RESSENTIS = ['Nausées', 'Vomissements', 'Diarrhée', 'Maux de ventre', 'Vertiges', 'Boutons sur la peau', 'Maux de tête', 'Grande fatigue']
const COMMUNES = ['Abomey', 'Abomey-Calavi', 'Allada', 'Bohicon', 'Cotonou', 'Ouidah', 'Pahou', 'Porto-Novo', 'Lomé']
const POUR_QUI: [NonNullable<Signalement['personne']> | 'moi', string][] = [['moi', 'Moi'], ['enfant', 'Un enfant'], ['femme_enceinte', 'Femme enceinte'], ['personne_agee', 'Personne âgée']]

export default function Signaler() {
  const { catalogue: c, profil } = useDonnees()
  const params = useLocalSearchParams<{ plante?: string; remede?: string }>()
  const insets = useSafeAreaInsets()
  const [etape, setEtape] = useState(1)
  const [cible, setCible] = useState<string>(params.plante ? `p:${params.plante}` : params.remede ? `r:${params.remede}` : '')
  const [danger, setDanger] = useState<string[]>([])
  const [ressentis, setRessentis] = useState<string[]>([])
  const [qui, setQui] = useState<(typeof POUR_QUI)[number][0]>('moi')
  const [anonyme, setAnonyme] = useState(true)
  const [detail, setDetail] = useState('')
  const [commune, setCommune] = useState(profil?.commune?.split(',')[0] ?? 'Abomey-Calavi')
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  useEffect(() => { if (params.plante) setCible(`p:${params.plante}`); else if (params.remede) setCible(`r:${params.remede}`) }, [params.plante, params.remede])

  const fermer = () => { setEtape(1); setDanger([]); setRessentis([]); setEnvoye(false); setCible(''); router.replace('/') }
  const nomCible = () => {
    if (!c || !cible) return 'Je ne sais pas'
    const [t, id] = cible.split(':')
    return t === 'p' ? c.plantes.find((p) => p.id === id)?.nom_francais ?? '?' : c.remedes.find((r) => r.id === id)?.nom ?? '?'
  }

  // ---------------------------------------------------------- arrêt : signe de danger
  if (danger.length) {
    return (
      <View style={{ flex: 1, backgroundColor: C.terre, paddingTop: insets.top + 24, paddingHorizontal: 22, paddingBottom: 30, gap: 18 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><CircleAlert size={34} color="#fff" /></View>
        <Text accessibilityRole="header" style={{ fontFamily: F.titreGras, fontSize: 40, lineHeight: 44, color: '#fff' }}>Allez au centre de santé maintenant</Text>
        <Text style={{ fontFamily: F.texte, fontSize: 17, lineHeight: 25, color: '#FBE9E3' }}>
          Vous avez signalé : <Text style={{ fontFamily: F.gras, color: '#fff' }}>{danger.join(', ').toLowerCase()}</Text>. C’est un signe de danger. N’attendez pas, n’essayez pas d’autre remède. Emportez la plante ou le remède avec vous.
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable style={{ backgroundColor: '#fff', borderRadius: R.moyen, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Hospital size={20} color={C.terre} /><Text style={{ fontFamily: F.gras, fontSize: 17, color: C.terre }}>Centre de santé le plus proche</Text>
        </Pressable>
        <Pressable onPress={() => setDanger([])} style={{ borderWidth: 1.5, borderColor: '#fff', borderRadius: R.moyen, minHeight: 50, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.demi, fontSize: 15, color: '#fff' }}>Je me suis trompé : revenir au formulaire</Text>
        </Pressable>
        <Text style={{ fontFamily: F.texte, fontSize: 12.5, color: '#F3D3C9' }}>Amà informe et oriente, mais ne pose pas de diagnostic.</Text>
      </View>
    )
  }

  // ---------------------------------------------------------- envoyé
  if (envoye) {
    return (
      <View style={{ flex: 1, backgroundColor: C.papier, paddingTop: insets.top + 30, paddingHorizontal: 22, gap: 16 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E6EEDD', alignItems: 'center', justifyContent: 'center' }}><CircleCheck size={32} color={C.pousse} /></View>
        <Titre taille={32}>Merci, votre signalement est enregistré</Titre>
        <T>Un agent de santé de votre zone le verra sur sa carte. {anonyme ? 'Votre nom et votre numéro ne sont pas transmis.' : ''}</T>
        <T style={{ color: C.gris }}>Si les signes s’aggravent, allez au centre de santé.</T>
        <View style={{ flex: 1 }} />
        <View style={{ gap: 10, paddingBottom: 30 }}>
          <Bouton onPress={fermer}>Retour à l’accueil</Bouton>
          <Bouton variante="contour" onPress={() => { setEtape(1); setRessentis([]); setEnvoye(false); setCible('') }}>Faire un autre signalement</Bouton>
        </View>
      </View>
    )
  }

  const basculer = (l: string[], v: string) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v])
  async function envoyer() {
    setErreur(null)
    const [t, id] = cible ? cible.split(':') : ['', '']
    try {
      await actions.signaler({
        plante_id: t === 'p' ? id : null, remede_id: t === 'r' ? id : null, produit_libre: !cible ? 'Produit inconnu' + (detail ? ` : ${detail}` : '') : detail || null,
        personne: qui === 'moi' ? 'adulte' : qui, symptomes: ressentis, signe_danger: false, gravite: ressentis.length > 3 || qui === 'enfant' || qui === 'femme_enceinte' ? 'modere' : 'leger',
        commune, pays: commune === 'Lomé' ? 'TG' : 'BJ', anonyme: anonyme || !profil, auteur_id: anonyme || !profil ? null : profil.id,
      })
      setEnvoye(true)
    } catch (e) { setErreur(e instanceof Error ? e.message : String(e)) }
  }

  const choixRapides = c ? [
    ...c.plantes.filter((p) => ['moringa', 'cafe-negre', 'neem'].includes(p.slug)).map((p) => [`p:${p.id}`, p.nom_francais]),
    ...c.remedes.filter((r) => r.slug === 'the-hta').map((r) => [`r:${r.id}`, r.nom]),
  ] as [string, string][] : []
  if (cible && !choixRapides.some(([v]) => v === cible)) choixRapides.unshift([cible, nomCible()])

  return (
    <View style={{ flex: 1, backgroundColor: C.papier, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 8, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 }}>
          <Pressable accessibilityLabel="Fermer" onPress={fermer}><X size={22} color={C.ecorce} /></Pressable>
          <Text style={{ fontFamily: F.titre, fontSize: 19, color: C.ecorce, flex: 1 }}>Signaler un effet</Text>
          <T style={{ fontSize: 13, color: C.gris }}>Étape {etape} sur 4</T>
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>{[1, 2, 3, 4].map((i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= etape ? C.feuille : C.bord }} />)}</View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 12, flexGrow: 1 }}>
        {etape === 1 && (
          <>
            <Titre taille={27}>Quelle plante ou quel remède ?</Titre>
            {[...choixRapides, ['', 'Je ne sais pas'] as [string, string]].map(([v, l]) => (
              <Pressable key={v || 'inconnu'} accessibilityRole="radio" accessibilityState={{ checked: cible === v }} onPress={() => setCible(v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 14, borderRadius: R.moyen, borderWidth: 1.5, borderColor: cible === v ? C.feuille : C.bord, backgroundColor: cible === v ? C.feuilleClair : C.carte }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: cible === v ? C.feuille : C.bordFort, alignItems: 'center', justifyContent: 'center' }}>{cible === v && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.feuille }} />}</View>
                <T style={{ fontFamily: F.demi }}>{l}</T>
              </Pressable>
            ))}
            <Bouton variante="contour" icone={ScanLine} onPress={() => router.push('/scanner')}>Scanner la plante</Bouton>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Lock size={14} color={C.gris} /><T style={{ fontSize: 13, color: C.gris, flex: 1 }}>Anonyme par défaut : votre nom n’est jamais transmis.</T></View>
          </>
        )}

        {etape === 2 && (
          <>
            <Titre taille={27}>Avez-vous l’un de ces signes ?</Titre>
            <T style={{ color: C.gris }}>Cochez si c’est le cas, même un seul.</T>
            {SIGNES_DANGER.map((sgn) => (
              <Pressable key={sgn} accessibilityRole="checkbox" onPress={() => setDanger(basculer(danger, sgn))}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 14, borderRadius: R.moyen, borderWidth: 1.5, borderColor: C.bord, backgroundColor: C.carte }}>
                <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: C.bordFort }} />
                <T style={{ fontFamily: F.demi, flex: 1 }}>{sgn}</T>
              </Pressable>
            ))}
            <T style={{ fontSize: 14, color: C.gris }}>Aucun de ces signes ? Continuez.</T>
          </>
        )}

        {etape === 3 && (
          <>
            <Titre taille={27}>Qu’avez-vous ressenti ?</Titre>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {RESSENTIS.map((r) => <Choix key={r} libelle={r} actif={ressentis.includes(r)} onPress={() => setRessentis(basculer(ressentis, r))} />)}
            </View>
            <Titre taille={22} style={{ marginTop: 10 }}>Pour qui ?</Titre>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {POUR_QUI.map(([v, l]) => <Choix key={v} libelle={l} actif={qui === v} onPress={() => setQui(v)} style={{ minWidth: '47%' }} />)}
            </View>
          </>
        )}

        {etape === 4 && (
          <>
            <Titre taille={27}>Vérifier et envoyer</Titre>
            <View style={{ backgroundColor: C.carte, borderWidth: 1, borderColor: C.bord, borderRadius: R.moyen }}>
              {[['Plante ou remède', nomCible()], ['Ressenti', ressentis.join(', ') || '—'], ['Pour qui', POUR_QUI.find(([v]) => v === qui)?.[1] ?? '']].map(([k, v], i) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, padding: 13, borderTopWidth: i ? 1 : 0, borderTopColor: C.bord }}>
                  <T style={{ color: C.gris, fontSize: 14 }}>{k}</T><T style={{ fontFamily: F.demi, fontSize: 14, flexShrink: 1, textAlign: 'right' }}>{v}</T>
                </View>
              ))}
            </View>
            <T style={{ fontFamily: F.demi }}>Où êtes-vous ?</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{COMMUNES.map((x) => <Choix key={x} libelle={x} actif={commune === x} onPress={() => setCommune(x)} style={{ minHeight: 38 }} />)}</View>
            <T style={{ fontSize: 12.5, color: C.gris }}>La commune suffit : jamais d’adresse.</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}><T style={{ fontFamily: F.demi }}>Rester anonyme</T><T style={{ fontSize: 13, color: C.gris }}>Votre nom et votre numéro ne sont pas transmis</T></View>
              <Switch value={anonyme} onValueChange={setAnonyme} trackColor={{ true: C.feuille, false: C.bordFort }} thumbColor="#fff" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.carte, borderWidth: 1.5, borderColor: C.bord, borderRadius: R.moyen }}>
              <TextInput value={detail} onChangeText={setDetail} placeholder="Ajouter un détail (facultatif)" placeholderTextColor={C.grisClair} style={{ flex: 1, minHeight: 50, paddingHorizontal: 12, fontFamily: F.texte, fontSize: 15.5, color: C.ecorce }} />
              <View style={{ borderLeftWidth: 1, borderLeftColor: C.bord, paddingHorizontal: 14, alignItems: 'center' }}><Mic size={18} color={C.feuille} /><Text style={{ fontFamily: F.moyen, fontSize: 10.5, color: C.feuille }}>Dicter</Text></View>
            </View>
            {erreur && <T style={{ color: C.terre }}>{erreur}</T>}
          </>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.bord }}>
        {etape > 1 && <Bouton variante="contour" onPress={() => setEtape(etape - 1)} style={{ flex: 1 }}>Retour</Bouton>}
        {etape < 4
          ? <Bouton onPress={() => setEtape(etape + 1)} desactive={etape === 3 && !ressentis.length} style={{ flex: 2 }}>Continuer</Bouton>
          : <Bouton onPress={envoyer} style={{ flex: 2 }}>Envoyer</Bouton>}
      </View>
    </View>
  )
}
