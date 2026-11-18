import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Plus, ShieldCheck, TriangleAlert } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bascule, Bouton, BoutonEcouter, Carte, detailPrudence, Encadre, ListePrecautions, MentionPied, NomSci, PhotoPlante, Prudence, Section, T, Titre } from '@/components/ui'
import { useDonnees } from '@/lib/donnees'
import { alerteRisque, confusionsPossibles, estManquant, grouperNoms, MESSAGE_INTERACTION, PAYS_LIBELLE } from '@/lib/regles'
import type { Pays } from '@/lib/types'
import { C, F, R } from '@/theme'

export default function FichePlante() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { catalogue: c } = useDonnees()
  const insets = useSafeAreaInsets()
  const [pays, setPays] = useState<Pays>('BJ')
  const p = c?.plantes.find((x) => x.slug === slug)
  if (!c || !p) return <View style={{ flex: 1, padding: 24, paddingTop: insets.top + 24 }}><T>{c ? 'Plante introuvable.' : 'Chargement…'}</T></View>

  const noms = grouperNoms(c.noms_locaux.filter((n) => n.plante_id === p.id && n.pays === pays))
  const usages = c.usages.filter((u) => u.plante_id === p.id && u.pays === pays)
  const confusions = confusionsPossibles(c, p, pays)
  const remedes = c.remedes.filter((r) => r.visibilite !== 'agents' && c.composants.some((k) => k.remede_id === r.id && k.plante_id === p.id))
  const sources = (role: string) => c.plante_sources.filter((s) => s.plante_id === p.id && s.role === role).map((s) => c.sources.find((x) => x.id === s.source_id)?.titre).filter(Boolean)
  const alerte = alerteRisque(p)
  const precautions = [
    ...(p.prudence === 'elevee' && alerte ? [{ texte: alerte, ton: 'danger' as const }] : []),
    ...p.precautions.filter((x) => !estManquant(x)).map((texte) => ({ texte, ton: 'alerte' as const })),
    ...(p.precautions.every(estManquant) ? [{ texte: 'Précautions encore à documenter : prudence par défaut.', ton: 'info' as const }] : []),
    { texte: MESSAGE_INTERACTION, ton: 'info' as const },
  ]
  const contributeurs = [...new Set(c.noms_locaux.filter((n) => n.plante_id === p.id && n.contributeur).map((n) => n.contributeur!))]
  const usagesTexte = usages.flatMap((u) => u.indications.length ? u.indications : u.texte ? [u.texte] : []).join(', ')
  const aLire = `${p.nom_francais}. ${detailPrudence(p.prudence)}. Au ${PAYS_LIBELLE[pays]}, on l’utilise pour : ${usagesTexte || 'usage à recueillir'}. Précautions : ${precautions.map((x) => x.texte).join('. ')}`

  return (
    <View style={{ flex: 1, backgroundColor: C.papier }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View>
          <PhotoPlante plante={p} style={{ height: 300 + insets.top }} />
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => (router.canGoBack() ? router.back() : router.replace('/plantes'))}
            style={{ position: 'absolute', top: insets.top + 10, left: 14, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(246,241,231,0.94)', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={22} color={C.ecorce} />
          </Pressable>
        </View>

        <View style={{ padding: 18, gap: 18 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: F.demi, fontSize: 11, letterSpacing: 1.2, color: C.gris }}>PLANTE · {[...new Set(c.noms_locaux.filter((n) => n.plante_id === p.id).map((n) => PAYS_LIBELLE[n.pays].toUpperCase()))].join(' · ') || 'BÉNIN · TOGO'}</Text>
            <Titre taille={36}>{p.nom_francais}</Titre>
            <NomSci style={{ fontSize: 16 }}>{p.nom_scientifique}</NomSci>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Prudence p={p.prudence} />
            <T style={{ fontSize: 13, color: C.gris }}>{detailPrudence(p.prudence)}</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <BoutonEcouter texte={aLire} libelle="Écouter la fiche" />
            <BoutonEcouter texte={aLire} libelle="En fon" langue="fon" clair />
          </View>

          <Bascule options={[['BJ', 'Au Bénin'], ['TG', 'Au Togo']]} valeur={pays} choisir={setPays} />

          <Section titre={`Noms locaux au ${PAYS_LIBELLE[pays]}`}>
            <View style={{ borderTopWidth: 1, borderTopColor: C.bord }}>
              {noms.map((n) => (
                <View key={n.nom} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.bord, paddingVertical: 12, gap: 10 }}>
                  <Text style={{ fontFamily: F.titre, fontSize: 18, color: C.ecorce, flexShrink: 1 }}>{n.nom}</Text>
                  <Text style={{ fontFamily: F.moyen, fontSize: 12, color: C.feuille, backgroundColor: C.feuilleClair, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.petit, overflow: 'hidden' }}>{n.etiquettes.join(' · ').toLowerCase()}</Text>
                </View>
              ))}
              {!noms.length && <T style={{ color: C.gris, paddingVertical: 12 }}>Nom local à recueillir au {PAYS_LIBELLE[pays]}.</T>}
            </View>
            <Pressable onPress={() => router.push({ pathname: '/proposer/nom', params: { plante: p.id, pays } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
              <Plus size={16} color={C.feuille} /><Text style={{ fontFamily: F.demi, fontSize: 14.5, color: C.feuille }}>Ajouter un nom</Text>
            </Pressable>
          </Section>

          {confusions.map((k) => (
            <Encadre key={k.nom} ton={k.autres.some((a) => a.prudence === 'elevee') ? 'danger' : 'alerte'} titre="Nom partagé">
              « {k.nom} » désigne aussi {k.autres.map((a) => a.nom_francais.toLowerCase()).join(', ')} ({k.autres.map((a) => a.nom_scientifique).join(', ')}). Vérifiez la plante avant de l’utiliser.
            </Encadre>
          ))}

          <Section titre={`Au ${PAYS_LIBELLE[pays]}, on l’utilise pour`}>
            {usages.length === 0 && <T style={{ color: C.gris }}>Usage à recueillir. Un tradipraticien peut le compléter.</T>}
            {usages.map((u) => (
              <View key={u.id} style={{ gap: 6 }}>
                {u.indications.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {u.indications.map((i) => <Text key={i} style={{ fontFamily: F.demi, fontSize: 14, color: C.feuille, backgroundColor: C.feuilleClair, paddingHorizontal: 11, paddingVertical: 6, borderRadius: R.petit, overflow: 'hidden' }}>{i}</Text>)}
                  </View>
                )}
                {u.texte && <T>{u.texte}</T>}
                {(u.precision || u.contexte) && <T style={{ fontSize: 13, color: C.gris }}>{[u.precision, u.contexte && `Enquête : ${u.contexte}`].filter(Boolean).join(' · ')}</T>}
              </View>
            ))}
            {sources('noms_usages').length > 0 && <T style={{ fontSize: 12.5, color: C.gris }}>Sources : {sources('noms_usages').join(', ')}</T>}
          </Section>

          {p.science && (
            <Section titre="Ce que dit la science">
              <T style={{ lineHeight: 23 }}>{p.science}</T>
              {sources('science').length > 0 && <T style={{ fontSize: 12.5, color: C.gris }}>Sources : {sources('science').join(', ')}</T>}
            </Section>
          )}

          <Section titre="Précautions"><ListePrecautions items={precautions} /></Section>

          <Section titre="Remèdes où elle apparaît">
            {remedes.length ? remedes.map((r) => (
              <Carte key={r.id} onPress={() => router.push(`/remede/${r.slug}`)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: F.demi, fontSize: 15, color: C.ecorce, flex: 1 }}>{r.nom}</Text><Prudence p={r.prudence} court />
              </Carte>
            )) : <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: C.bordFort, borderRadius: R.moyen, padding: 14 }}><T style={{ color: C.gris, fontSize: 14 }}>Aucun remède publié avec cette plante pour l’instant.</T></View>}
          </Section>

          <Carte style={{ gap: 10 }}>
            <Text style={{ fontFamily: F.demi, fontSize: 11, letterSpacing: 1.1, color: C.gris }}>D’OÙ VIENT CETTE FICHE</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <ShieldCheck size={18} color={C.pousse} />
              <T style={{ flex: 1, fontSize: 14 }}>{contributeurs.length ? `Noms partagés par ${contributeurs.join(', ')}, relus par un tradipraticien et un pharmacien.` : 'Établie à partir d’enquêtes publiées, citées ci-dessus. Les tradipraticiens peuvent la compléter ; chaque ajout est relu deux fois.'}</T>
            </View>
          </Carte>

          <Bouton variante="danger" icone={TriangleAlert} onPress={() => router.push({ pathname: '/signaler', params: { plante: p.id } })}>J’ai eu un effet indésirable</Bouton>
          <MentionPied />
        </View>
      </ScrollView>
    </View>
  )
}
