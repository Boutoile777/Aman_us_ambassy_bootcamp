import { router } from 'expo-router'
import { ArrowLeft, Check, CircleCheck, ShieldCheck, Clock } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bouton, Choix, Ecran, Encadre, T, Titre } from '@/components/ui'
import { GRILLE, pretAPublier, sousTitre, verifications } from '@/lib/contributions'
import { actions, useDonnees } from '@/lib/donnees'
import { PAYS_LIBELLE } from '@/lib/regles'
import type { Contribution } from '@/lib/types'
import { C, F, R } from '@/theme'

const QUESTIONS = ['Dans quelle ville ?', 'Quelle partie de la plante ?', 'Photo plus nette', 'Préciser la langue']

function Detail({ c, retour }: { c: Contribution; retour: () => void }) {
  const { catalogue: cat, profil, rafraichir } = useDonnees()
  const insets = useSafeAreaInsets()
  const [grille, setGrille] = useState<Record<string, boolean>>(c.grille ?? {})
  const [precision, setPrecision] = useState(false)
  const [question, setQuestion] = useState(QUESTIONS[0])
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  if (!cat || !profil) return null
  const d = c.details
  const nomPlante = (id: string) => cat.plantes.find((p) => p.id === id)?.nom_francais ?? '?'
  const admin = profil.role === 'admin'
  const moi = c.contributeur_id === profil.id
  const peut = { tradition: !moi && profil.role === 'tradipraticien' && profil.verifie, sante: !moi && profil.role === 'sante' }
  const verifs = verifications(c, cat)
  const pret = pretAPublier({ ...c, grille })
  const agir = async (f: () => Promise<void>) => { setErreur(null); try { await f(); await rafraichir() } catch (e) { setErreur(e instanceof Error ? e.message : String(e)) } }

  const champs: [string, string][] = d.type === 'nom_local'
    ? [['Langue', d.langue || d.lieu], ['Pays', PAYS_LIBELLE[d.pays]], ['Plante', cat.plantes.find((p) => p.id === d.plante_id)?.nom_scientifique ?? '?'], ['Source', d.source]]
    : d.type === 'usage' ? [['Pays', PAYS_LIBELLE[d.pays]], ['Pour', d.indications.join(', ')], ['Partie', d.partie], ['Source', d.source]]
    : [['Origine', d.origine_pays.map((p) => PAYS_LIBELLE[p]).join(', ') + (d.commune ? ` · ${d.commune}` : '')], ['Pour', d.indication || '—'], ['Plantes', d.composants.map((k) => nomPlante(k.plante_id ?? '')).join(', ')], ['Histoire', d.histoire ? 'Fournie' : 'Absente']]

  if (precision) {
    return (
      <Ecran retour={false} titre="Demander une précision" pied={<><Bouton onPress={() => agir(async () => { await actions.demanderPrecision(c.id, message || question); retour() })}>Envoyer la question</Bouton><Bouton variante="contour" onPress={() => setPrecision(false)}>Annuler</Bouton></>}>
        <Titre taille={24}>{c.resume}</Titre>
        <T style={{ color: C.gris }}>Choisissez une question ou écrivez la vôtre.</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{QUESTIONS.map((q) => <Choix key={q} libelle={q} actif={question === q} onPress={() => setQuestion(q)} />)}</View>
        <TextInput value={message} onChangeText={setMessage} multiline placeholder={`Ex. ${question}`} placeholderTextColor={C.grisClair}
          style={{ minHeight: 100, borderWidth: 1.5, borderColor: C.bord, borderRadius: R.moyen, backgroundColor: C.carte, padding: 12, fontFamily: F.texte, fontSize: 15.5, textAlignVertical: 'top', color: C.ecorce }} />
        <T style={{ fontSize: 13, color: C.gris }}>{c.contributeur_nom} recevra une notification.</T>
      </Ecran>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.papier, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, height: 54, borderBottomWidth: 1, borderBottomColor: C.bord }}>
        <Pressable accessibilityLabel="Retour" onPress={retour}><ArrowLeft size={22} color={C.ecorce} /></Pressable>
        <Text style={{ fontFamily: F.titre, fontSize: 18, color: C.ecorce }}>Proposition · {sousTitre(c, nomPlante).split(' · ')[0].toLowerCase()}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 30 }}>
        <View style={{ gap: 4 }}>
          <Titre taille={27}>{c.resume}</Titre>
          <T style={{ fontSize: 13.5, color: C.gris }}>Proposé par {c.contributeur_nom} · {new Date(c.created_at).toLocaleDateString('fr-FR')}</T>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {champs.map(([k, v]) => (
            <View key={k} style={{ width: '48%', backgroundColor: C.carte, borderWidth: 1, borderColor: C.bord, borderRadius: R.moyen, padding: 10 }}>
              <Text style={{ fontFamily: F.demi, fontSize: 10.5, letterSpacing: 0.8, color: C.gris }}>{k.toUpperCase()}</Text>
              <T style={{ fontSize: 14, fontFamily: F.demi }}>{v}</T>
            </View>
          ))}
        </View>
        {verifs.map((v) => <Encadre key={v.texte} ton={v.ton} titre="Vérification automatique">{v.texte}</Encadre>)}

        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: F.demi, fontSize: 11, letterSpacing: 1.1, color: C.gris }}>DOUBLE VALIDATION</Text>
          {(['tradition', 'sante'] as const).map((t, i) => {
            const v = c.validations.find((x) => x.type === t)
            const ok = v?.decision === 'approuve'
            return (
              <View key={t} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {ok ? <CircleCheck size={19} color={C.pousse} /> : <Clock size={19} color={C.kola} />}
                  <View style={{ flex: 1 }}>
                    <T style={{ fontFamily: F.gras, fontSize: 14.5 }}>{i + 1} · {t === 'tradition' ? 'Usage traditionnel' : 'Sécurité'} — {ok ? 'validé' : v ? (v.decision === 'complement' ? 'précision demandée' : 'refusé') : peut[t] ? 'à vous' : 'en attente'}</T>
                    <T style={{ fontSize: 13, color: C.gris }}>{v?.validateur_nom ?? (t === 'tradition' ? 'Un tradipraticien vérifié' : 'Un pharmacien ou un médecin')}</T>
                  </View>
                </View>
                {peut[t] && !ok && c.statut !== 'valide' && (
                  <View style={{ flexDirection: 'row', gap: 8, marginLeft: 29 }}>
                    <Bouton icone={Check} onPress={() => agir(() => actions.valider(c.id, t, 'approuve'))} style={{ flex: 1, minHeight: 44 }}>Je confirme</Bouton>
                    <Bouton variante="contour" onPress={() => setPrecision(true)} style={{ minHeight: 44 }}>Précision</Bouton>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {admin && c.statut !== 'valide' && (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: F.titre, fontSize: 20, color: C.ecorce }}>Liste de contrôle</Text>
              <T style={{ fontFamily: F.demi, fontSize: 14 }}>{GRILLE.filter((g) => grille[g.cle]).length} / {GRILLE.length} vérifiés</T>
            </View>
            {GRILLE.map((g) => {
              const on = !!grille[g.cle]
              return (
                <Pressable key={g.cle} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => { const n = { ...grille, [g.cle]: !on }; setGrille(n); void actions.majGrille(c.id, n) }}
                  style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 13, borderRadius: R.moyen, borderWidth: 1.5, borderColor: on ? C.feuille : C.bord, backgroundColor: on ? C.feuilleClair : C.carte }}>
                  <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: on ? C.feuille : C.bordFort, backgroundColor: on ? C.feuille : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on && <Check size={15} color="#fff" strokeWidth={3} />}</View>
                  <T style={{ flex: 1, fontSize: 14.5 }}>{g.libelle}</T>
                </Pressable>
              )
            })}
            <Bouton desactive={!pret} onPress={() => agir(async () => { await actions.publier({ ...c, grille }, cat); retour() })}>Valider et publier</Bouton>
            {!pret && <T style={{ fontSize: 12.5, color: C.gris, textAlign: 'center' }}>Grisé tant que les deux validations et la liste ne sont pas complètes.</T>}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Bouton variante="contour" onPress={() => setPrecision(true)} style={{ flex: 1 }}>Demander une précision</Bouton>
              <Bouton variante="danger" onPress={() => agir(async () => { await actions.refuser(c.id, message || 'Proposition non retenue après relecture.'); retour() })} style={{ flex: 1 }}>Refuser</Bouton>
            </View>
          </View>
        )}
        {c.statut === 'valide' && <Encadre ton="info" titre="Publié">Visible dans Amà avec « partagé par » et « relu par ».</Encadre>}
        {erreur && <T style={{ color: C.terre }}>{erreur}</T>}
      </ScrollView>
    </View>
  )
}

export default function Validation() {
  const { contributions, profil, catalogue: c } = useDonnees()
  const [filtre, setFiltre] = useState<'attente' | 'precision' | 'publiees'>('attente')
  const [sel, setSel] = useState<string | null>(null)
  if (!profil || !(profil.role === 'admin' || profil.role === 'sante' || (profil.role === 'tradipraticien' && profil.verifie))) {
    return <Ecran><Titre>Validation</Titre><T>Réservé aux relecteurs.</T><Bouton onPress={() => router.push('/connexion')}>Se connecter</Bouton></Ecran>
  }
  const courant = contributions.find((x) => x.id === sel)
  if (courant) return <Detail c={courant} retour={() => setSel(null)} />
  const groupes = {
    attente: contributions.filter((x) => ['soumis', 'en_revue'].includes(x.statut)),
    precision: contributions.filter((x) => x.statut === 'complement_demande'),
    publiees: contributions.filter((x) => x.statut === 'valide'),
  }
  const liste = groupes[filtre]
  const nomPlante = (id: string) => c?.plantes.find((p) => p.id === id)?.nom_francais ?? '?'
  const attendu = (x: Contribution) => {
    const t = x.validations.some((v) => v.type === 'tradition' && v.decision === 'approuve')
    const s = x.validations.some((v) => v.type === 'sante' && v.decision === 'approuve')
    return t && s ? 'Prêt à publier' : t ? 'Sécurité à relire' : 'Usage à valider'
  }

  return (
    <Ecran>
      <View><Titre taille={30}>{profil.role === 'admin' ? 'Validation' : 'Relecture'}</Titre><T style={{ color: C.gris, fontSize: 14 }}>{groupes.attente.length} proposition{groupes.attente.length > 1 ? 's' : ''} en attente</T></View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Choix libelle={`En attente · ${groupes.attente.length}`} actif={filtre === 'attente'} onPress={() => setFiltre('attente')} />
        <Choix libelle={`Précision · ${groupes.precision.length}`} actif={filtre === 'precision'} onPress={() => setFiltre('precision')} />
        <Choix libelle="Publiées" actif={filtre === 'publiees'} onPress={() => setFiltre('publiees')} />
      </View>
      {liste.length === 0 && (
        <View style={{ gap: 10, paddingTop: 20 }}>
          <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: '#E6EEDD', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={26} color={C.pousse} /></View>
          <Titre taille={24}>Tout est à jour</Titre>
          <T style={{ color: C.gris }}>Aucune proposition ici. Vous serez prévenu à la prochaine.</T>
        </View>
      )}
      {liste.map((x) => {
        const avert = c ? verifications(x, c).find((v) => v.ton === 'danger' || v.texte.includes('existe déjà')) : undefined
        return (
          <Pressable key={x.id} onPress={() => setSel(x.id)} style={{ backgroundColor: C.carte, borderWidth: 1, borderColor: C.bord, borderRadius: R.grand, padding: 14, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontFamily: F.demi, fontSize: 12, color: C.feuille, backgroundColor: C.feuilleClair, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.petit, overflow: 'hidden' }}>{sousTitre(x, nomPlante).split(' · ')[0]}</Text>
              {avert && <Text style={{ fontFamily: F.gras, fontSize: 11.5, color: avert.ton === 'danger' ? C.terre : C.kola }}>{avert.ton === 'danger' ? '⚠ Prudence élevée' : '⚠ Nom déjà utilisé'}</Text>}
            </View>
            <Text style={{ fontFamily: F.titre, fontSize: 18, color: C.ecorce }}>{x.resume}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T style={{ fontSize: 13, color: C.gris }}>{x.contributeur_nom}</T>
              <T style={{ fontSize: 13, fontFamily: F.gras }}>{x.statut === 'valide' ? 'Publié' : attendu(x)}</T>
            </View>
          </Pressable>
        )
      })}
    </Ecran>
  )
}
