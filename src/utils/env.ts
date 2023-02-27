
export interface Env {
  inBrowser: boolean
  isAndroid?: boolean
  isiOS?: boolean
  isSafari?: boolean
  isChrome?: boolean
  isMobile?: boolean
  isInApp?: boolean
  safariVersion?: string
}

const getEnv = (ua?: string): Env => {
  const inBrowser = typeof window !== 'undefined'

  if (!ua && !inBrowser) {
    return { inBrowser }
  }

  const u = ua ?? window.navigator.userAgent

  return {
    inBrowser,
    isAndroid: u.includes('Android') || u.includes('Adr'),
    isiOS: /iPad|iPhone|iPod/.test(u),
    isSafari: u.includes('Safari') && !u.includes('Chrome'),
    isChrome: u.includes('Chrome'),
    isMobile: (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i).test(u),
    isInApp: (/bstar_[a|i]/i).test(u),
    safariVersion: u.match(/[v|V]ersion\/([\w|.]+)/)?.[1] ?? '0'
  }
}

// export const useEnv = (): Env => {
//   const context = import.meta.env.SSR ? useSSRContext() : null
//   return getEnv(context?.userAgent)
// }

const env = getEnv()

export default env