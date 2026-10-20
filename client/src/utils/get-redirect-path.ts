export function getRedirectPath(
  redirectToPath: string,
  requested: string | null
): string {
  const areaPrefix = `/${redirectToPath.split('/')[1] ?? ''}/`
  if (requested && areaPrefix !== '//' && requested.startsWith(areaPrefix)) {
    return requested
  }
  return redirectToPath
}
