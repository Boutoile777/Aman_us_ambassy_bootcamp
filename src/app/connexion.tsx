import { router } from 'expo-router'
import { CircleAlert, MessageSquare } from 'lucide-react-native'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Bascule, Bouton, Carte, Ecran, T, Titre } from '@/components/ui'
import { CODE_DEMO, COMPTES_DEMO, connexionSimulee } from '@/lib/donnees'
import { C, F, R } from '@/theme'

// Connexion par numéro de téléphone et code SMS — l'envoi du SMS est SIMULÉ pour la démonstration.
export default function Connexion() {
  const [pays, setPays] = useState<'BJ' | 'TG'>('BJ')
  const [tel, setTel] = useState('')
  const [etape, setEtape] = useState<'numero' | 'code'>('numero')
  const [code, setCode] = useState('')
  const [sms, setSms] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [essais, setEssais] = useState(3)
  const champ = useRef<ComponentRef<typeof TextInput>>(null)

  useEffect(() => {
    if (etape !== 'code') return
    const t = setTimeout(() => setSms(true), 1200)
    return () => clearTimeout(t)
  }, [etape])

  async function valider(v = code) {
    setErreur(null)
    if (v !== CODE_DEMO) { setEssais(essais - 1); setErreur(`Code incorrect. Il vous reste ${essais - 1} essai${essais - 1 > 1 ? 's' : ''}.`); return }
    try { await connexionSimulee(tel); router.replace('/profil') } catch (e) { setErreur(e instanceof Error ? e.message : String(e)) }
  }

  if (etape === 'code') {
    return (
      <Ecran retour titre="Se connecter">
        {sms && (
          <Pressable onPress={() => { setCode(CODE_DEMO); void valider(CODE_DEMO) }} style={{ flexDirection: 'row', gap: 10, backgroundColor: C.ecorce, borderRadius: R.grand, padding: 14 }}>
            <MessageSquare size={20} color={C.dore} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.gras, color: '#fff', fontSize: 13 }}>SMS · Amà <Text style={{ fontFamily: F.texte, color: '#A9A293' }}>(simulé pour la démo)</Text></Text>
              <Text style={{ fontFamily: F.texte, color: '#E9E3D6', fontSize: 14 }}>Votre code Amà : {CODE_DEMO}. Ne le partagez avec personne.</Text>
            </View>
          </Pressable>
        )}
        <Titre taille={30}>Entrez le code reçu</Titre>
        <T style={{ color: C.gris }}>Envoyé au {pays === 'BJ' ? '+229' : '+228'} {tel}</T>
        <Pressable onPress={() => champ.current?.focus()} style={{ flexDirection: 'row', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{ flex: 1, height: 58, borderRadius: R.moyen, borderWidth: 1.5, borderColor: erreur ? C.terre : code.length === i ? C.feuille : C.bord, backgroundColor: C.carte, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.titre, fontSize: 26, color: C.ecorce }}>{code[i] ?? ''}</Text>
            </View>
          ))}
        </Pressable>
        <TextInput ref={champ} value={code} onChangeText={(v) => { const n = v.replace(/\D/g, '').slice(0, 6); setCode(n); if (n.length === 6) void valider(n) }}
          keyboardType="number-pad" autoFocus accessibilityLabel="Code reçu par SMS" style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }} />
        {erreur && <View style={{ flexDirection: 'row', gap: 8, backgroundColor: C.terreClair, borderRadius: R.petit, padding: 11 }}><CircleAlert size={17} color={C.terre} /><T style={{ color: C.terre, fontFamily: F.demi, fontSize: 14, flex: 1 }}>{erreur}</T></View>}
        <Bouton onPress={() => valider()} desactive={code.length < 6 || essais <= 0}>{erreur ? 'Réessayer' : 'Valider'}</Bouton>
        <Bouton variante="contour" onPress={() => { setSms(false); setCode(''); setErreur(null); setTimeout(() => setSms(true), 1200) }}>Renvoyer un code</Bouton>
      </Ecran>
    )
  }

  return (
    <Ecran retour titre="Se connecter">
      <Titre taille={30}>Votre numéro de téléphone</Titre>
      <T style={{ color: C.gris }}>Nous envoyons un code par SMS. Pas de mot de passe.</T>
      <Bascule options={[['BJ', 'Bénin · +229'], ['TG', 'Togo · +228']]} valeur={pays} choisir={setPays} />
      <View style={{ gap: 6 }}>
        <T style={{ fontSize: 13, fontFamily: F.demi }}>Numéro</T>
        <TextInput value={tel} onChangeText={setTel} keyboardType="phone-pad" placeholder="01 97 45 22 12" placeholderTextColor={C.grisClair}
          style={{ minHeight: 54, borderRadius: R.moyen, borderWidth: 1.5, borderColor: C.bord, backgroundColor: C.carte, paddingHorizontal: 14, fontFamily: F.moyen, fontSize: 19, letterSpacing: 1, color: C.ecorce }} />
      </View>
      {erreur && <T style={{ color: C.terre }}>{erreur}</T>}
      <Bouton desactive={tel.replace(/\D/g, '').length < 8} onPress={() => {
        if (!COMPTES_DEMO.some((c) => c.tel.replace(/\D/g, '') === tel.replace(/\D/g, ''))) { setErreur('En démonstration, utilisez un des numéros ci-dessous.'); return }
        setErreur(null); setEtape('code')
      }}>Recevoir le code</Bouton>

      <View style={{ gap: 8, marginTop: 6 }}>
        <Text style={{ fontFamily: F.demi, fontSize: 11, letterSpacing: 1.1, color: C.gris }}>COMPTES DE DÉMONSTRATION · PERSONNES FICTIVES</Text>
        {COMPTES_DEMO.map((c) => (
          <Carte key={c.tel} onPress={() => { setPays(c.pays as 'BJ' | 'TG'); setTel(c.tel); setErreur(null) }} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 }}>
            <View><Text style={{ fontFamily: F.demi, fontSize: 15, color: C.ecorce }}>{c.nom}</Text><T style={{ fontSize: 12.5, color: C.gris }}>{c.role}</T></View>
            <Text style={{ fontFamily: F.moyen, fontSize: 13, color: C.feuille }}>{c.pays === 'BJ' ? '+229' : '+228'} {c.tel}</Text>
          </Carte>
        ))}
      </View>
      <View style={{ backgroundColor: '#EDE5D6', borderRadius: R.moyen, padding: 14, gap: 10 }}>
        <T style={{ fontSize: 14, color: C.gris }}>Un compte sert à partager un savoir ou à relire des fiches. Pour consulter et signaler, il n’en faut pas.</T>
        <Bouton variante="contour" onPress={() => router.replace('/')}>Continuer sans compte</Bouton>
      </View>
    </Ecran>
  )
}
