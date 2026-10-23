import { describe, expect, it } from 'vitest'
import {
  httpProviderNames,
  pickProviderSubscriptionInfo,
  sameSubscriptionInfo
} from './providerSubscription'

const provider = (
  name: string,
  info?: Partial<ISubscriptionUserInfoUpper>,
  vehicleType = 'HTTP'
): IMihomoProxyProvider => ({
  name,
  type: 'Proxy',
  vehicleType,
  expectedStatus: '*',
  subscriptionInfo: info ? { Upload: 0, Download: 0, Total: 0, Expire: 0, ...info } : undefined
})

describe('httpProviderNames', () => {
  it('returns http providers in config order', () => {
    const yaml = [
      'proxy-providers:',
      '  B:',
      '    type: http',
      '    url: https://b.example/sub',
      '  local:',
      '    type: file',
      '    path: ./a.yaml',
      '  A:',
      '    type: http',
      '    url: https://a.example/sub'
    ].join('\n')
    expect(httpProviderNames(yaml)).toEqual(['B', 'A'])
  })

  it('returns an empty list without providers or for invalid yaml', () => {
    expect(httpProviderNames('proxies: []')).toEqual([])
    expect(httpProviderNames('proxy-providers: [')).toEqual([])
    expect(httpProviderNames('')).toEqual([])
  })
})

describe('pickProviderSubscriptionInfo', () => {
  const providers = {
    A: provider('A', { Upload: 1, Download: 2, Total: 100, Expire: 1800000000 }),
    B: provider('B', { Upload: 3, Download: 4, Total: 200, Expire: 1900000000 }),
    C: provider('C'),
    Z: provider('Z', { Total: 0 })
  }

  it('picks the last provider in config order that reports a total', () => {
    expect(pickProviderSubscriptionInfo(providers, ['A', 'B'])).toEqual({
      upload: 3,
      download: 4,
      total: 200,
      expire: 1900000000
    })
    expect(pickProviderSubscriptionInfo(providers, ['B', 'A'])?.total).toBe(100)
  })

  it('skips providers without usable info', () => {
    expect(pickProviderSubscriptionInfo(providers, ['A', 'C', 'Z'])?.total).toBe(100)
    expect(pickProviderSubscriptionInfo(providers, ['C', 'Z', 'missing'])).toBeUndefined()
    expect(pickProviderSubscriptionInfo(undefined, ['A'])).toBeUndefined()
  })
})

describe('sameSubscriptionInfo', () => {
  it('compares all fields', () => {
    const a = { upload: 1, download: 2, total: 3, expire: 4 }
    expect(sameSubscriptionInfo(a, { ...a })).toBe(true)
    expect(sameSubscriptionInfo(a, { ...a, download: 5 })).toBe(false)
    expect(sameSubscriptionInfo(undefined, a)).toBe(false)
  })
})
