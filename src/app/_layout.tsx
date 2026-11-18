import { Fraunces_400Regular_Italic, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces'
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { FournisseurDonnees } from '@/lib/donnees'
import { C } from '@/theme'

SplashScreen.preventAutoHideAsync()

export default function Racine() {
  const [pret] = useFonts({ Fraunces_400Regular_Italic, Fraunces_600SemiBold, Fraunces_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold })
  useEffect(() => { if (pret) void SplashScreen.hideAsync() }, [pret])
  if (!pret) return null
  return (
    <SafeAreaProvider>
      <FournisseurDonnees>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.papier } }} />
      </FournisseurDonnees>
    </SafeAreaProvider>
  )
}
