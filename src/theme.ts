// Palette A « Herbier vivant » — le savoir des plantes documenté comme une planche botanique.
export const C = {
  papier: '#F6F1E7', // fond
  carte: '#FFFFFF',
  bord: '#E2D8C6',
  bordFort: '#CFC2AB',
  feuille: '#2F4A33', // action principale, sélection
  feuilleFonce: '#22382A',
  feuilleClair: '#E4EBDD',
  pousse: '#4F7A3A', // sûr / validé
  dore: '#D9A441', // écoute, accent
  doreClair: '#F6EBD2',
  kola: '#A8701C', // attention
  kolaClair: '#F7EAD3',
  terre: '#A4452A', // danger
  terreClair: '#F6E2DB',
  ecorce: '#22261F', // texte
  gris: '#6B6253',
  grisClair: '#9A907F',
} as const

export const F = {
  titre: 'Fraunces_600SemiBold',
  titreGras: 'Fraunces_700Bold',
  titreItalique: 'Fraunces_400Regular_Italic',
  texte: 'Inter_400Regular',
  moyen: 'Inter_500Medium',
  demi: 'Inter_600SemiBold',
  gras: 'Inter_700Bold',
} as const

export const R = { petit: 6, moyen: 10, grand: 14, rond: 999 } as const
export const ESPACE = 18
