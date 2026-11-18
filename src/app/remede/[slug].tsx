import { router, useLocalSearchParams } from 'expo-router'
import { BookOpen, CircleHelp, MapPin, ShieldCheck, TriangleAlert, Info } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { Bouton, BoutonEcouter, Carte, Ecran, ListePrecautions, MentionPied, NomSci, PhotoPlante, Prudence, Section, T, Titre } from '@/components/ui'
import { useDonnees } from '@/lib/donnees'
import { alerteRisque, estManquant, MESSAGE_INTERACTION, PAYS_LIBELLE } from '@/lib/regles'
import { C, F, R } from '@/theme'

export default function FicheRemede() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { catalogue: c } = useDonnees()
  const r = c?.remedes.find((x) => x.slug === slug)
  if (!c || !r) return <Ecran retour titre="Remède"><T>{c ? 'Remède introuvable.' : 'Chargement…'}</T></Ecran>

  const comps = c.composants.filter((k) => k.remede_id === r.id).sort((a, b) => a.ordre - b.ordre)
  const plantes = comps.map((k) => c.plantes.find((p) => p.id === k.plante_id) ?? null)
  const source = c.sources.find((s) => s.id === r.source_id)
  const plusRisquee = plantes.filter(Boolean).find((p) => p!.prudence === r.prudence)
  const sansFiche = comps.filter((k) => !k.plante_id).length

  const precautions: { texte: string; ton: 'danger' | 'alerte' | 'info' }[] = []
  if (r.indication && /paludisme/i.test(r.indication)) precautions.push({ texte: 'Fièvre : faites un test du paludisme. Ce remède ne remplace pas un test et un traitement.', ton: 'danger' })
  if (r.indication && /hypertension/i.test(r.indication)) precautions.push({ texte: 'Ne remplace pas le traitement prescrit contre l’hypertension. N’arrêtez pas vos médicaments.', ton: 'danger' }, { texte: 'Faites contrôler votre tension au centre de santé.', ton: 'alerte' })
  plantes.forEach((p) => {
    if (!p) return
    if (p.prudence === 'elevee' && alerteRisque(p)) precautions.push({ texte: alerteRisque(p)!, ton: 'danger' })
    p.precautions.filter((x) => !estManquant(x)).forEach((x) => precautions.push({ texte: `${p.nom_francais} : ${x[0].toLowerCase()}${x.slice(1)}`, ton: 'alerte' }))
  })
  if (sansFiche) precautions.push({ texte: `Sécurité inconnue pour ${sansFiche} plante${sansFiche > 1 ? 's' : ''} sans fiche dans Amà.`, ton: 'info' })
  if (r.deconseille_a) precautions.push({ texte: `Déconseillé : ${r.deconseille_a}`, ton: 'alerte' })
  precautions.push({ texte: MESSAGE_INTERACTION, ton: 'info' })

  const lieux = r.origine_lieux?.length ? r.origine_lieux : []
  const aLire = `${r.nom}. Remède composé de ${comps.length} plantes. ${r.indication ? `On l’utilise pour : ${r.indication}.` : ''} ${r.histoire ?? ''} Précautions : ${precautions.map((p) => p.texte).join('. ')}`

  return (
    <Ecran retour titre="Remède">
      <View style={{ gap: 6 }}>
        <Text style={{ fontFamily: F.demi, fontSize: 11, letterSpacing: 1.2, color: C.kola }}>REMÈDE COMPOSÉ · {comps.length} PLANTE{comps.length > 1 ? 'S' : ''}</Text>
        <Titre taille={32}>{r.nom}</Titre>
        {r.indication && <T style={{ color: C.gris }}>On l’utilise pour : {r.indication.toLowerCase()}.</T>}
      </View>
      <View style={{ gap: 6 }}>
        <Prudence p={r.prudence} />
        {plusRisquee && r.prudence !== 'a_evaluer' && <T style={{ fontSize: 13, color: C.gris }}>La plus élevée de ses plantes : <Text style={{ fontFamily: F.titreItalique }}>{plusRisquee.nom_scientifique}</Text>.</T>}
      </View>
      <BoutonEcouter texte={aLire} libelle="Écouter le remède" />

      <Section titre="Origine">
        <T>{r.origine_pays.map((p) => PAYS_LIBELLE[p]).join(' et ')}</T>
        {lieux.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {lieux.map((l) => <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.bord, backgroundColor: C.carte, borderRadius: R.petit, paddingHorizontal: 9, paddingVertical: 5 }}><MapPin size={13} color={C.gris} /><Text style={{ fontFamily: F.moyen, fontSize: 13, color: C.ecorce }}>{l}</Text></View>)}
          </View>
        )}
      </Section>

      <Section titre="Son histoire">
        <T style={{ lineHeight: 23 }}>{r.histoire ?? 'Histoire à recueillir.'}</T>
        <T style={{ fontSize: 13, color: C.gris }}>{r.contributeur_nom ? `Racontée par ${r.contributeur_nom}.` : 'Récit complet à recueillir auprès de ceux qui le transmettent.'}</T>
      </Section>

      <Section titre="Les plantes du remède">
        {comps.map((k, i) => {
          const p = plantes[i]
          return (
            <Carte key={k.id} onPress={p ? () => router.push(`/plante/${p.slug}`) : undefined} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <PhotoPlante plante={p} credit={false} style={{ width: 64, height: 64, borderRadius: R.moyen }} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontFamily: F.titre, fontSize: 17, color: C.ecorce }}>{p?.nom_francais ?? 'Plante sans fiche'}</Text>
                  <NomSci style={{ fontSize: 13 }}>{p?.nom_scientifique ?? k.plante_proposee}</NomSci>
                  <T style={{ fontSize: 13, color: C.gris }}>Partie : {k.partie ?? 'à préciser'}</T>
                </View>
                {p && <Prudence p={p.prudence} court />}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([['Au Bénin', k.usage_benin], ['Au Togo', k.usage_togo]] as const).map(([l, u]) => (
                  <View key={l} style={{ flex: 1, backgroundColor: C.papier, borderRadius: R.petit, padding: 9, gap: 2 }}>
                    <Text style={{ fontFamily: F.demi, fontSize: 10.5, letterSpacing: 0.8, color: C.gris }}>{l.toUpperCase()}, POUR</Text>
                    <T style={{ fontSize: 13.5, color: u ? C.ecorce : C.grisClair }}>{u ?? 'À recueillir'}</T>
                  </View>
                ))}
              </View>
            </Carte>
          )
        })}
      </Section>

      <View style={{ flexDirection: 'row', gap: 10, backgroundColor: '#EDE5D6', borderRadius: R.moyen, padding: 12 }}>
        <Info size={17} color={C.gris} /><T style={{ flex: 1, fontSize: 13.5, color: C.gris }}>Amà n’indique jamais de dose, de nombre de tasses ni de durée.</T>
      </View>

      <Section titre="Précautions"><ListePrecautions items={precautions} /></Section>

      <Carte style={{ gap: 12 }}>
        <Text style={{ fontFamily: F.demi, fontSize: 11, letterSpacing: 1.1, color: C.gris }}>DOUBLE VALIDATION</Text>
        {r.contributeur_id ? (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}><ShieldCheck size={18} color={C.pousse} /><T style={{ flex: 1, fontSize: 14 }}><Text style={{ fontFamily: F.gras }}>Partagé par {r.contributeur_nom}</Text>{'\n'}usage traditionnel</T></View>
            {(r.relecteurs ?? []).map((v) => <View key={v} style={{ flexDirection: 'row', gap: 10 }}><ShieldCheck size={18} color={C.pousse} /><T style={{ flex: 1, fontSize: 14 }}><Text style={{ fontFamily: F.gras }}>Relu par {v}</Text></T></View>)}
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 10 }}><BookOpen size={18} color={C.feuille} /><T style={{ flex: 1, fontSize: 14 }}><Text style={{ fontFamily: F.gras }}>Enquête publiée</Text>{'\n'}{source?.titre ?? 'source à préciser'}</T></View>
            <View style={{ flexDirection: 'row', gap: 10 }}><CircleHelp size={18} color={C.kola} /><T style={{ flex: 1, fontSize: 14 }}><Text style={{ fontFamily: F.gras }}>Tradipraticien et pharmacien</Text>{'\n'}relecture à faire</T></View>
          </>
        )}
        {source && <Pressable><T style={{ fontSize: 12.5, color: C.gris }}>Source : {source.titre}</T></Pressable>}
      </Carte>

      <Bouton variante="danger" icone={TriangleAlert} onPress={() => router.push({ pathname: '/signaler', params: { remede: r.id } })}>J’ai eu un effet indésirable</Bouton>
      <MentionPied />
    </Ecran>
  )
}
