import { router, useLocalSearchParams } from 'expo-router'
import { Check } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Bouton, Choix, Ecran, Encadre, NomSci, Prudence, T, Titre } from '@/components/ui'
import { actions, useDonnees } from '@/lib/donnees'
import { normaliser } from '@/lib/regles'
import type { Pays } from '@/lib/types'
import { C, F, R } from '@/theme'

const LANGUES = ['fon', 'goun', 'mahi', 'adja', 'idaasha', 'yoruba', 'nago', 'éwé', 'mina', 'kabyè', 'tem']

// Proposer un nom local ou un usage (même écran, deux modes).
export default function ProposerNomOuUsage() {
  const params = useLocalSearchParams<{ plante?: string; pays?: Pays; type?: string }>()
  const usage = params.type === 'usage'
  const { catalogue: c, profil, rafraichir } = useDonnees()
  const [plante, setPlante] = useState(params.plante ?? '')
  const [pays, setPays] = useState<Pays>(params.pays ?? 'BJ')
  const [nom, setNom] = useState('')
  const [langue, setLangue] = useState('')
  const [indications, setIndications] = useState('')
  const [partie, setPartie] = useState('feuille')
  const [source, setSource] = useState('')
  const [accord, setAccord] = useState(false)
  const [fait, setFait] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (!profil) return <Ecran retour titre="Connexion"><Titre>Connectez-vous pour partager un savoir</Titre><Bouton onPress={() => router.replace('/connexion')}>Se connecter</Bouton></Ecran>
  if (!c) return null
  const p = c.plantes.find((x) => x.id === plante)
  const autres = !usage && nom.trim() ? [...new Set(c.noms_locaux.filter((n) => n.nom_normalise === normaliser(nom) && n.plante_id !== plante).map((n) => n.plante_id))].map((id) => c.plantes.find((x) => x.id === id)!).filter(Boolean) : []
  if (fait) return <Ecran retour titre="Merci"><Titre>C’est envoyé</Titre><T>Votre proposition sera relue par un tradipraticien et un pharmacien avant publication.</T><Bouton onPress={() => router.replace('/profil')}>Voir mes contributions</Bouton></Ecran>

  async function envoyer() {
    setErreur(null)
    try {
      if (usage) {
        const liste = indications.split(/[,;]/).map((x) => x.trim()).filter(Boolean).map((x) => x[0].toUpperCase() + x.slice(1))
        await actions.soumettre({ type: 'usage', plante_id: plante, pays, partie, preparation: '', indications: liste, contexte: profil!.commune ?? '', source: source.trim() }, `${p!.nom_francais} · ${liste.join(', ').toLowerCase()}`, accord)
      } else {
        await actions.soumettre({ type: 'nom_local', plante_id: plante, nom: nom.trim(), pays, langue, lieu: langue ? '' : profil!.commune ?? '', source: source.trim() }, `« ${nom.trim()} » → ${p!.nom_francais}`, accord)
      }
      await rafraichir(); setFait(true)
    } catch (e) { setErreur(e instanceof Error ? e.message : String(e)) }
  }
  const pret = !!plante && (usage ? !!indications.trim() : !!nom.trim() && !!langue) && !!source.trim() && accord

  return (
    <Ecran retour titre={usage ? 'Proposer un usage' : 'Proposer un nom local'}
      pied={<Bouton onPress={envoyer} desactive={!pret}>Envoyer pour relecture</Bouton>}>
      <Titre taille={26}>{usage ? 'Un usage de la plante' : 'Un nom dans ma langue'}</Titre>
      <Text style={{ fontFamily: F.demi, fontSize: 13.5 }}>Plante</Text>
      {p ? (
        <Pressable onPress={() => setPlante('')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: R.moyen, borderWidth: 1.5, borderColor: C.feuille, backgroundColor: C.feuilleClair }}>
          <View><T style={{ fontFamily: F.demi }}>{p.nom_francais}</T><NomSci style={{ fontSize: 13 }}>{p.nom_scientifique}</NomSci></View><Prudence p={p.prudence} court />
        </Pressable>
      ) : (
        <View style={{ maxHeight: 220, borderWidth: 1, borderColor: C.bord, borderRadius: R.moyen, backgroundColor: C.carte }}>
          <ScrollView nestedScrollEnabled>{[...c.plantes].sort((a, b) => a.nom_francais.localeCompare(b.nom_francais)).map((x) => (
            <Pressable key={x.id} onPress={() => setPlante(x.id)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.bord }}><T style={{ fontSize: 14.5 }}>{x.nom_francais} <Text style={{ color: C.gris, fontFamily: F.titreItalique }}>{x.nom_scientifique}</Text></T></Pressable>
          ))}</ScrollView>
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}><Choix libelle="Au Bénin" actif={pays === 'BJ'} onPress={() => setPays('BJ')} style={{ flex: 1 }} /><Choix libelle="Au Togo" actif={pays === 'TG'} onPress={() => setPays('TG')} style={{ flex: 1 }} /></View>

      {usage ? (
        <>
          <Text style={{ fontFamily: F.demi, fontSize: 13.5 }}>On l’utilise pour</Text>
          <TextInput value={indications} onChangeText={setIndications} placeholder="Fièvre, diarrhée…" placeholderTextColor={C.grisClair} style={{ minHeight: 50, borderWidth: 1.5, borderColor: C.bord, borderRadius: R.moyen, backgroundColor: C.carte, paddingHorizontal: 12, fontFamily: F.texte, fontSize: 15.5, color: C.ecorce }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{['feuille', 'racine', 'écorce', 'fruit', 'graine'].map((x) => <Choix key={x} libelle={x} actif={partie === x} onPress={() => setPartie(x)} />)}</View>
          {p?.prudence === 'elevee' && <Encadre ton="danger" titre="Plante à prudence élevée">Précisez bien la partie utilisée : un pharmacien relira obligatoirement.</Encadre>}
        </>
      ) : (
        <>
          <Text style={{ fontFamily: F.demi, fontSize: 13.5 }}>Le nom</Text>
          <TextInput value={nom} onChangeText={setNom} placeholder="Tel qu’on le dit" placeholderTextColor={C.grisClair} style={{ minHeight: 50, borderWidth: 1.5, borderColor: C.bord, borderRadius: R.moyen, backgroundColor: C.carte, paddingHorizontal: 12, fontFamily: F.titre, fontSize: 18, color: C.ecorce }} />
          <Text style={{ fontFamily: F.demi, fontSize: 13.5 }}>Langue</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{LANGUES.map((l) => <Choix key={l} libelle={l} actif={langue === l} onPress={() => setLangue(l)} style={{ minHeight: 38 }} />)}</View>
          {autres.length > 0 && <Encadre ton="alerte" titre="Nom déjà utilisé">« {nom} » désigne déjà {autres.map((a) => a.nom_francais.toLowerCase()).join(', ')}. Vous pouvez l’envoyer : il sera marqué « nom partagé ».</Encadre>}
        </>
      )}
      <Text style={{ fontFamily: F.demi, fontSize: 13.5 }}>Source</Text>
      <TextInput value={source} onChangeText={setSource} placeholder="Ma pratique, ma famille, une enquête…" placeholderTextColor={C.grisClair} style={{ minHeight: 50, borderWidth: 1.5, borderColor: C.bord, borderRadius: R.moyen, backgroundColor: C.carte, paddingHorizontal: 12, fontFamily: F.texte, fontSize: 15.5, color: C.ecorce }} />
      <Pressable onPress={() => setAccord(!accord)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: R.moyen, borderWidth: 1.5, borderColor: accord ? C.feuille : C.bord, backgroundColor: accord ? C.feuilleClair : C.carte }}>
        <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: accord ? C.feuille : C.bordFort, backgroundColor: accord ? C.feuille : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{accord && <Check size={15} color="#fff" strokeWidth={3} />}</View>
        <T style={{ flex: 1, fontSize: 14.5 }}>Je partage ce savoir sous mon nom et je peux le retirer à tout moment.</T>
      </Pressable>
      {erreur && <T style={{ color: C.terre }}>{erreur}</T>}
    </Ecran>
  )
}
