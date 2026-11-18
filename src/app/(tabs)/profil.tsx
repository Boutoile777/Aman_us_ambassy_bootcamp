import { router } from 'expo-router'
import { BookOpen, ChevronRight, CircleCheck, Clock, CloudUpload, Coffee, Languages, Leaf, LogOut, ShieldCheck, Trash2, CircleHelp, X } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Bouton, Carte, Ecran, T, Titre } from '@/components/ui'
import { actions, useDonnees } from '@/lib/donnees'
import type { Contribution } from '@/lib/types'
import { sousTitre, statut } from '@/lib/contributions'
import { C, F, R } from '@/theme'

export default function Profil() {
  const { profil, contributions, catalogue: c, rafraichir } = useDonnees()
  const [aRetirer, setARetirer] = useState<Contribution | null>(null)
  const [droits, setDroits] = useState(false)

  if (!profil) {
    return (
      <Ecran>
        <Titre taille={30}>Profil</Titre>
        <T style={{ color: C.gris }}>Pas besoin de compte pour chercher, scanner ou signaler. Un compte sert aux tradipraticiens pour partager leur savoir, et aux soignants pour relire les fiches.</T>
        <Bouton onPress={() => router.push('/connexion')}>Se connecter avec mon numéro</Bouton>
        <Carte style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Languages size={19} color={C.feuille} /><T style={{ flex: 1 }}>Langue : français</T><ChevronRight size={18} color={C.grisClair} /></View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><BookOpen size={19} color={C.feuille} /><T style={{ flex: 1 }}>À propos d’Amà</T><ChevronRight size={18} color={C.grisClair} /></View>
        </Carte>
      </Ecran>
    )
  }

  const miennes = contributions.filter((x) => x.contributeur_id === profil.id)
  const nomPlante = (id: string) => c?.plantes.find((p) => p.id === id)?.nom_francais ?? 'plante'
  const initiales = profil.nom_affiche.split(/\s+/).map((m) => m[0]).join('').slice(0, 2).toUpperCase()
  const titreRole = profil.role === 'tradipraticien' ? (profil.verifie ? 'Tradipraticien vérifié' : 'Tradipraticien') : { sante: 'Pharmacien ou médecin', agent: 'Agent de santé', admin: 'Administration', visiteur: 'Contributeur' }[profil.role]
  const peutPartager = profil.role === 'tradipraticien' || profil.role === 'visiteur'

  return (
    <Ecran>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Titre taille={30}>{peutPartager ? 'Mon espace' : 'Profil'}</Titre>
        <Pressable accessibilityLabel="Se déconnecter" onPress={async () => { await actions.deconnexion(); router.replace('/') }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 }}>
          <LogOut size={18} color={C.gris} /><Text style={{ fontFamily: F.moyen, color: C.gris, fontSize: 13 }}>Sortir</Text>
        </Pressable>
      </View>

      <Carte style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: C.feuilleClair, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: F.titre, fontSize: 21, color: C.feuille }}>{initiales}</Text></View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: F.titre, fontSize: 20, color: C.ecorce }}>{profil.nom_affiche}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: '#E6EEDD', borderRadius: R.petit, paddingHorizontal: 8, paddingVertical: 3 }}>
            <ShieldCheck size={13} color={C.pousse} /><Text style={{ fontFamily: F.gras, fontSize: 12, color: C.pousse }}>{titreRole}</Text>
          </View>
          {profil.commune && <T style={{ fontSize: 13, color: C.gris }}>{profil.commune}{profil.langues?.length ? ` · ${profil.langues.join(', ')}` : ''}</T>}
        </View>
      </Carte>

      {peutPartager && (
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: F.titre, fontSize: 21, color: C.ecorce }}>Partager un savoir</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[{ l: 'Un remède', I: Coffee, to: '/proposer/remede', plein: true }, { l: 'Un nom', I: Languages, to: '/proposer/nom' }, { l: 'Un usage', I: Leaf, to: '/proposer/nom?type=usage' }].map(({ l, I, to, plein }) => (
              <Pressable key={l} accessibilityRole="button" onPress={() => router.push(to as never)} style={{ flex: 1, minHeight: 84, borderRadius: R.grand, borderWidth: 1.5, borderColor: plein ? C.feuille : C.bord, backgroundColor: plein ? C.feuille : C.carte, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <I size={24} color={plein ? '#fff' : C.feuille} /><Text style={{ fontFamily: F.demi, fontSize: 14, color: plein ? '#fff' : C.ecorce }}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {profil.role === 'tradipraticien' && profil.verifie && (() => {
        const n = contributions.filter((x) => x.contributeur_id !== profil.id && ['soumis', 'en_revue'].includes(x.statut) && !x.validations.some((v) => v.type === 'tradition')).length
        return n > 0 ? (
          <Carte onPress={() => router.push('/validation')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: C.dore, backgroundColor: C.doreClair }}>
            <ShieldCheck size={22} color={C.kola} />
            <View style={{ flex: 1 }}><Text style={{ fontFamily: F.gras, fontSize: 15, color: C.ecorce }}>{n} savoir{n > 1 ? 's' : ''} attend{n > 1 ? 'ent' : ''} votre avis</Text><T style={{ fontSize: 13, color: C.gris }}>Confirmez l’usage traditionnel</T></View>
            <ChevronRight size={18} color={C.kola} />
          </Carte>
        ) : null
      })()}

      {peutPartager && (
        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: F.titre, fontSize: 21, color: C.ecorce, marginBottom: 6 }}>Mes contributions</Text>
          {miennes.length === 0 && <T style={{ color: C.gris }}>Vous n’avez encore rien partagé.</T>}
          {miennes.map((x) => {
            const s = statut(x)
            return (
              <Pressable key={x.id} onLongPress={() => x.statut !== 'retire' && setARetirer(x)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.bord }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.demi, fontSize: 15.5, color: C.ecorce }}>{x.resume}</Text>
                  <T style={{ fontSize: 13, color: C.gris }}>{sousTitre(x, nomPlante)}</T>
                  {x.motif_refus && ['complement_demande', 'refuse'].includes(x.statut) && <T style={{ fontSize: 13, color: C.kola, marginTop: 3 }}>« {x.motif_refus} »</T>}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: s.fond, borderRadius: R.petit, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <s.I size={13} color={s.c} /><Text style={{ fontFamily: F.gras, fontSize: 11.5, color: s.c }}>{s.mot}</Text>
                </View>
                {x.statut !== 'retire' && x.statut !== 'refuse' && <Pressable accessibilityLabel={`Retirer ${x.resume}`} hitSlop={10} onPress={() => setARetirer(x)}><Trash2 size={17} color={C.grisClair} /></Pressable>}
              </Pressable>
            )
          })}
          <Pressable onPress={() => setDroits(!droits)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
            <Text style={{ fontFamily: F.demi, fontSize: 15, color: C.feuille, textDecorationLine: 'underline' }}>Mes droits de co-auteur</Text><ChevronRight size={18} color={C.feuille} />
          </Pressable>
          {droits && (
            <Carte style={{ gap: 10 }}>
              {['Vous êtes co-auteur : votre nom apparaît sur chaque fiche.', 'Vous choisissez qui peut voir votre remède.', 'Vous pouvez retirer une contribution à tout moment.', 'Aucune utilisation commerciale sans un accord séparé (Protocole de Nagoya).'].map((d) => (
                <View key={d} style={{ flexDirection: 'row', gap: 8 }}><CircleCheck size={16} color={C.pousse} style={{ marginTop: 3 }} /><T style={{ flex: 1, fontSize: 14.5 }}>{d}</T></View>
              ))}
            </Carte>
          )}
        </View>
      )}

      {!peutPartager && (
        <Carte style={{ gap: 8 }}>
          <T>{profil.role === 'agent' ? 'Retrouvez les signalements de votre zone dans l’onglet « Ma zone ».' : 'Retrouvez les propositions à relire dans l’onglet « ' + (profil.role === 'admin' ? 'Validation' : 'Relecture') + ' ».'}</T>
          <Bouton variante="contour" onPress={() => router.push(profil.role === 'agent' ? '/zone' : '/validation')}>Ouvrir</Bouton>
        </Carte>
      )}

      {aRetirer && (
        <View style={{ backgroundColor: C.carte, borderRadius: R.grand, borderWidth: 1.5, borderColor: C.terre, padding: 16, gap: 10 }}>
          <Titre taille={22}>Retirer « {aRetirer.resume} » ?</Titre>
          <T style={{ color: C.gris, fontSize: 14.5 }}>La fiche ne sera plus visible dans Amà. Les signalements déjà reçus sont gardés, sans votre nom.</T>
          <Bouton variante="danger" icone={Trash2} onPress={async () => { await actions.retirer(aRetirer.id); setARetirer(null); void rafraichir() }}>Retirer ma contribution</Bouton>
          <Bouton variante="contour" onPress={() => setARetirer(null)}>Annuler</Bouton>
        </View>
      )}
    </Ecran>
  )
}
