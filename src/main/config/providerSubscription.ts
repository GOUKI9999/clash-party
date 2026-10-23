import { parse } from '../utils/yaml'

// Profiles generated as proxy-providers (e.g. by SubConverter-Extended) carry no
// subscription-userinfo header; the core fetches traffic/expiry per provider instead.
// These helpers pick that information so the profile card can show it.

/** Names of `type: http` proxy-providers, in the order they appear in the profile. */
export function httpProviderNames(content: string): string[] {
  let doc: unknown
  try {
    doc = parse(content)
  } catch {
    return []
  }
  if (!doc || typeof doc !== 'object') return []
  const providers = (doc as Record<string, unknown>)['proxy-providers']
  if (!providers || typeof providers !== 'object' || Array.isArray(providers)) return []
  return Object.entries(providers as Record<string, unknown>)
    .filter(([, value]) => {
      return !!value && typeof value === 'object' && (value as { type?: unknown }).type === 'http'
    })
    .map(([name]) => name)
}

/**
 * Subscription info of the last provider (in profile order) that reports a total,
 * matching subconverter, which reports the last subscription when merging several.
 */
export function pickProviderSubscriptionInfo(
  providers: Record<string, IMihomoProxyProvider> | undefined,
  order: string[]
): ISubscriptionUserInfo | undefined {
  if (!providers) return undefined
  for (let i = order.length - 1; i >= 0; i--) {
    const info = providers[order[i]]?.subscriptionInfo
    if (info && info.Total > 0) {
      return {
        upload: info.Upload || 0,
        download: info.Download || 0,
        total: info.Total,
        expire: info.Expire || 0
      }
    }
  }
  return undefined
}

export function sameSubscriptionInfo(
  a: ISubscriptionUserInfo | undefined,
  b: ISubscriptionUserInfo | undefined
): boolean {
  if (!a || !b) return false
  return (
    a.upload === b.upload &&
    a.download === b.download &&
    a.total === b.total &&
    a.expire === b.expire
  )
}
