export const fonts = ['inter', 'manrope', 'system'] as const

export type Font = (typeof fonts)[number]
