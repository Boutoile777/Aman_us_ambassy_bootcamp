import { router } from 'expo-router'
import { Check, Mic, Plus, ShieldCheck, X } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bouton, Choix, Encadre, NomSci, Prudence, T, Titre } from '@/components/ui'
import { actions, useDonnees } from '@/lib/donnees'
import { prudenceRemede, verifierTexte } from '@/lib/regles'
import type { ComposantPropose, Pays, Remede } from '@/lib/types'
import { C, F, R } from '@/theme'

const ETAPES = ['Qui propose', 'Le remède', 'Origine et histoire', 'Sécurité', 'Consentement']
const ACCORDS = ['Je partage ce savoir sous mon nom, comme co-auteur.', 'Je sais que je peux retirer ma contribution à tout moment.', 'Je n’ai indiqué ni dose, ni durée, ni promesse de guérison.', 'Les photos sont de moi, ou leur auteur est d’accord.']

function Champ({ libelle, valeur, changer, multi, placeholder }: { libelle: string; valeur: string; changer: (v: string) => void; multi?: boolean; placeholder?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: F.demi, fontSize: 13.5, color: C.ecorce }}>{libelle}</Text>
      <View style={{ flexDirection: 'row', backgroundColor: C.carte, borderWidth: 1.5, borderColor: C.bord, borderRadius: R.moyen }}>
        <TextInput value={valeur} onChangeText={changer} multiline={multi} placeholder={placeholder} placeholderTextColor={C.grisClair}
          style={{ flex: 1, minHeight: multi ? 110 : 50, paddingHorizontal: 12, paddingVertical: 12, fontFamily: F.texte, fontSize: 15.5, color: C.ecorce, textAlignVertical: multi ? 'top' : 'center' }} />
        <View style={{ borderLeftWidth: 1, borderLeftColor: C.bord, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' }}><Mic size={17} color={C.feuille} /><Text style={{ fontFamily: F.moyen, fontSize: 10, color: C.feuille }}>Dicter</Text></View>
      </View>
    </View>
  )
}

export default function ProposerRemede() {
  const { catalogue: c, profil, rafraichir } = useDonnees()
  const insets = useSafeAreaInsets()
  const [etape, setEtape] = useState(0)
  const [qui, setQui] = useState<'moi' | 'autre'>('moi')
  const [origineSavoir, setOrigineSavoir] = useState('Héritage familial')
  const [nom, setNom] = useState('')
  const [indication, setIndication] = useState('')
  const [comps, setComps] = useState<ComposantPropose[]>([])
  const [choixPlante, setChoixPlante] = useState(false)
  const [ou, setOu] = useState<'BJ' | 'TG' | 'deux'>('BJ')
  const [lieux, setLieux] = useState<string[]>(profil?.commune ? [profil.commune.split(',')[0]] : [])
  const [nouveauLieu, setNouveauLieu] = useState('')
  const [histoire, setHistoire] = useState('')
  const [effets, setEffets] = useState<'oui' | 'non' | 'nsp'>('nsp')
  const [effetsTexte, setEffetsTexte] = useState('')
  const [eviter, setEviter] = useState<string[]>([])
  const [visibilite, setVisibilite] = useState<Remede['visibilite']>('public')
  const [accords, setAccords] = useState<boolean[]>([false, false, false, false])
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false)

  if (!profil) return <View style={{ flex: 1, padding: 24, paddingTop: insets.top + 24, gap: 12 }}><Titre>Connectez-vous</Titre><Bouton onPress={() => router.replace('/connexion')}>Se connecter</Bouton></View>
  if (!c) return null
  const prudence = prudenceRemede('a_evaluer', comps.map((k) => c.plantes.find((p) => p.id === k.plante_id)?.prudence ?? 'a_evaluer'))
  const avertissements = [...new Set([indication, histoire, ...comps.flatMap((k) => [k.usage_benin, k.usage_togo])].flatMap(verifierTexte))]
  const basculer = (l: string[], v: string) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v])
  const peutContinuer = [true, !!nom.trim() && comps.length > 0, true, true, accords.every(Boolean)][etape]

  async function envoyer() {
    setErreur(null)
    const pays: Pays[] = ou === 'deux' ? ['BJ', 'TG'] : [ou]
    try {
      await actions.soumettre({
        type: 'remede', nom: nom.trim(), nom_local: '', indication: indication.trim(), composants: comps, preparation: '',
        origine_pays: pays, region: '', commune: lieux.join(', '), langue: profil!.langues?.[0] ?? '', histoire: `${histoire.trim()}${origineSavoir ? ` (${origineSavoir.toLowerCase()})` : ''}`,
        effets_connus: effets === 'oui' ? effetsTexte : '', deconseille_a: eviter.join(', ').toLowerCase(), visibilite,
        role_contributeur: profil!.role === 'tradipraticien' ? 'tradipraticien' : 'particulier', numero_autorisation: profil!.numero_autorisation ?? '',
      }, nom.trim(), true)
      await rafraichir(); setEnvoye(true)
    } catch (e) { setErreur(e instanceof Error ? e.message : String(e)) }
  }

  if (envoye) {
    return (
      <View style={{ flex: 1, backgroundColor: C.papier, paddingTop: insets.top + 30, paddingHorizontal: 22, gap: 14 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E6EEDD', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={30} color={C.pousse} /></View>
        <Titre taille={30}>Merci, votre remède est envoyé</Titre>
        <T>Il sera relu par un tradipraticien, puis par un pharmacien ou un médecin. Vous serez prévenu à chaque étape.</T>
        <View style={{ flex: 1 }} />
        <View style={{ paddingBottom: 30 }}><Bouton onPress={() => router.replace('/profil')}>Voir mes contributions</Bouton></View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.papier, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 8, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 44 }}>
          <Pressable accessibilityLabel="Fermer" onPress={() => router.back()}><X size={22} color={C.ecorce} /></Pressable>
          <View style={{ flex: 1 }}><Text style={{ fontFamily: F.titre, fontSize: 18, color: C.ecorce }}>Proposer un remède</Text><T style={{ fontSize: 12.5, color: C.gris }}>Étape {etape + 1} sur 5 · {ETAPES[etape]}</T></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>{ETAPES.map((e, i) => <View key={e} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= etape ? C.feuille : C.bord }} />)}</View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }} keyboardShouldPersistTaps="handled">
        {etape === 0 && (
          <>
            <Titre taille={27}>Qui propose ce remède ?</Titre>
            {([['moi', 'Moi-même', `${profil.nom_affiche} · ${profil.role === 'tradipraticien' && profil.verifie ? 'tradipraticien vérifié' : 'contributeur'}`], ['autre', 'Au nom d’un autre tradipraticien', 'Avec son accord · il sera co-auteur']] as const).map(([v, l, d]) => (
              <Pressable key={v} onPress={() => setQui(v)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: R.moyen, borderWidth: 1.5, borderColor: qui === v ? C.feuille : C.bord, backgroundColor: qui === v ? C.feuilleClair : C.carte }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: qui === v ? C.feuille : C.bordFort, alignItems: 'center', justifyContent: 'center' }}>{qui === v && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.feuille }} />}</View>
                <View style={{ flex: 1 }}><T style={{ fontFamily: F.demi }}>{l}</T><T style={{ fontSize: 13, color: C.gris }}>{d}</T></View>
              </Pressable>
            ))}
            <Titre taille={21} style={{ marginTop: 6 }}>D’où vient ce savoir ?</Titre>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['Héritage familial', 'Appris auprès d’un maître', 'Pratique personnelle'].map((o) => <Choix key={o} libelle={o} actif={origineSavoir === o} onPress={() => setOrigineSavoir(o)} />)}
            </View>
          </>
        )}

        {etape === 1 && (
          <>
            <Titre taille={27}>Le remède</Titre>
            <Champ libelle="Nom du remède" valeur={nom} changer={setNom} placeholder="Ex. Tisane du soir" />
            <Champ libelle="On l’utilise pour" valeur={indication} changer={setIndication} placeholder="Ex. fatigue, sommeil" />
            <Text style={{ fontFamily: F.demi, fontSize: 13.5, color: C.ecorce }}>Plantes du remède</Text>
            {comps.map((k, i) => {
              const p = c.plantes.find((x) => x.id === k.plante_id)
              return (
                <View key={i} style={{ backgroundColor: C.carte, borderWidth: 1, borderColor: C.bord, borderRadius: R.moyen, padding: 12, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ flex: 1 }}><NomSci style={{ fontSize: 15, color: C.ecorce }}>{p?.nom_scientifique}</NomSci><T style={{ fontSize: 12.5, color: C.gris }}>{p?.nom_francais}</T></View>
                    {p && <Prudence p={p.prudence} court />}
                    <Pressable accessibilityLabel="Retirer la plante" onPress={() => setComps(comps.filter((_, j) => j !== i))}><X size={18} color={C.gris} /></Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {['Feuille', 'Racine', 'Écorce', 'Fruit', 'Graine'].map((pt) => <Choix key={pt} libelle={pt} actif={k.partie === pt.toLowerCase()} onPress={() => setComps(comps.map((x, j) => (j === i ? { ...x, partie: pt.toLowerCase() } : x)))} style={{ minHeight: 36, paddingHorizontal: 10 }} />)}
                  </View>
                </View>
              )
            })}
            {choixPlante ? (
              <View style={{ backgroundColor: C.carte, borderWidth: 1, borderColor: C.bord, borderRadius: R.moyen, maxHeight: 260 }}>
                <ScrollView nestedScrollEnabled>
                  {[...c.plantes].sort((a, b) => a.nom_francais.localeCompare(b.nom_francais)).filter((p) => !comps.some((k) => k.plante_id === p.id)).map((p) => (
                    <Pressable key={p.id} onPress={() => { setComps([...comps, { plante_id: p.id, plante_proposee: null, partie: 'feuille', usage_benin: '', usage_togo: '' }]); setChoixPlante(false) }}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.bord }}>
                      <View><T style={{ fontFamily: F.demi, fontSize: 14.5 }}>{p.nom_francais}</T><NomSci style={{ fontSize: 12.5 }}>{p.nom_scientifique}</NomSci></View>
                      <Prudence p={p.prudence} court />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <Pressable onPress={() => setChoixPlante(true)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', minHeight: 50, borderRadius: R.moyen, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.bordFort }}>
                <Plus size={18} color={C.feuille} /><Text style={{ fontFamily: F.demi, fontSize: 15, color: C.feuille }}>Ajouter une plante (scan ou nom)</Text>
              </Pressable>
            )}
            {comps.length > 0 && <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><T style={{ fontSize: 13.5, color: C.gris }}>Prudence du remède :</T><Prudence p={prudence} /></View>}
            <Text style={{ fontFamily: F.demi, fontSize: 13.5, color: C.ecorce }}>Où l’utilise-t-on ?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>{([['BJ', 'Bénin'], ['TG', 'Togo'], ['deux', 'Les deux']] as const).map(([v, l]) => <Choix key={v} libelle={l} actif={ou === v} onPress={() => setOu(v)} style={{ flex: 1 }} />)}</View>
            <T style={{ fontSize: 13, color: C.gris }}>Pas de dose, de durée ni de promesse de guérison.</T>
            {avertissements.map((a) => <Encadre key={a} ton="alerte" titre="À revoir">{a}</Encadre>)}
          </>
        )}

        {etape === 2 && (
          <>
            <Titre taille={27}>Origine et histoire</Titre>
            <Text style={{ fontFamily: F.demi, fontSize: 13.5, color: C.ecorce }}>Villes où il est connu</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {lieux.map((l) => <Choix key={l} libelle={`${l}  ×`} actif onPress={() => setLieux(lieux.filter((x) => x !== l))} />)}
              <View style={{ flexDirection: 'row', borderWidth: 1.5, borderColor: C.bord, borderRadius: R.moyen, backgroundColor: C.carte, alignItems: 'center' }}>
                <TextInput value={nouveauLieu} onChangeText={setNouveauLieu} placeholder="Ajouter" placeholderTextColor={C.grisClair} onSubmitEditing={() => { if (nouveauLieu.trim()) { setLieux([...lieux, nouveauLieu.trim()]); setNouveauLieu('') } }}
                  style={{ minHeight: 42, width: 110, paddingHorizontal: 10, fontFamily: F.texte, fontSize: 14.5, color: C.ecorce }} />
                <Pressable onPress={() => { if (nouveauLieu.trim()) { setLieux([...lieux, nouveauLieu.trim()]); setNouveauLieu('') } }} style={{ paddingHorizontal: 10 }}><Plus size={17} color={C.feuille} /></Pressable>
              </View>
            </View>
            <Champ libelle="Racontez son histoire" valeur={histoire} changer={setHistoire} multi placeholder="D’où il vient, qui le transmet, depuis quand…" />
          </>
        )}

        {etape === 3 && (
          <>
            <Titre taille={27}>Sécurité</Titre>
            <Text style={{ fontFamily: F.demi, fontSize: 14.5, color: C.ecorce }}>Connaissez-vous des effets indésirables ?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>{([['oui', 'Oui'], ['non', 'Non'], ['nsp', 'Je ne sais pas']] as const).map(([v, l]) => <Choix key={v} libelle={l} actif={effets === v} onPress={() => setEffets(v)} style={{ flex: 1 }} />)}</View>
            {effets === 'oui' && <Champ libelle="Lesquels ?" valeur={effetsTexte} changer={setEffetsTexte} />}
            <Text style={{ fontFamily: F.demi, fontSize: 14.5, color: C.ecorce }}>À éviter pour :</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Enfants', 'Femmes enceintes', 'Personnes âgées', 'Malades chroniques'].map((x) => <Choix key={x} libelle={x} actif={eviter.includes(x)} onPress={() => setEviter(basculer(eviter, x))} />)}</View>
            <View style={{ flexDirection: 'row', gap: 10, backgroundColor: '#EDE5D6', borderRadius: R.moyen, padding: 12 }}><ShieldCheck size={18} color={C.gris} /><T style={{ flex: 1, fontSize: 14, color: C.gris }}>Un pharmacien ou un médecin relira cette partie avant toute publication.</T></View>
          </>
        )}

        {etape === 4 && (
          <>
            <Titre taille={27}>Votre accord</Titre>
            {ACCORDS.map((a, i) => (
              <Pressable key={a} accessibilityRole="checkbox" accessibilityState={{ checked: accords[i] }} onPress={() => setAccords(accords.map((x, j) => (j === i ? !x : x)))}
                style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: R.moyen, borderWidth: 1.5, borderColor: accords[i] ? C.feuille : C.bord, backgroundColor: accords[i] ? C.feuilleClair : C.carte }}>
                <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: accords[i] ? C.feuille : C.bordFort, backgroundColor: accords[i] ? C.feuille : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{accords[i] && <Check size={15} color="#fff" strokeWidth={3} />}</View>
                <T style={{ flex: 1, fontSize: 14.5 }}>{a}</T>
              </Pressable>
            ))}
            <Text style={{ fontFamily: F.demi, fontSize: 14.5, color: C.ecorce, marginTop: 4 }}>Qui peut voir ce remède ?</Text>
            <View style={{ gap: 8 }}>{([['public', 'Tout le monde'], ['sans_proportions', 'Tout le monde, sans les proportions'], ['agents', 'Seulement les agents de santé']] as const).map(([v, l]) => <Choix key={v} libelle={l} actif={visibilite === v} onPress={() => setVisibilite(v)} />)}</View>
            <T style={{ fontSize: 13, color: C.gris }}>Relu par un tradipraticien, puis par un pharmacien ou un médecin.</T>
            {erreur && <T style={{ color: C.terre }}>{erreur}</T>}
          </>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.bord }}>
        {etape > 0 && <Bouton variante="contour" onPress={() => setEtape(etape - 1)} style={{ flex: 1 }}>Retour</Bouton>}
        {etape < 4 ? <Bouton onPress={() => setEtape(etape + 1)} desactive={!peutContinuer} style={{ flex: 2 }}>Continuer</Bouton>
          : <Bouton onPress={envoyer} desactive={!peutContinuer} style={{ flex: 2 }}>Envoyer la proposition</Bouton>}
      </View>
    </View>
  )
}
