import { Capacitor } from '@capacitor/core'
import { SignInWithApple } from '@capacitor-community/apple-sign-in'

// TODO: keep in sync with appId in capacitor.config.ts and APPLE_NATIVE_BUNDLE_ID on Convex.
const BUNDLE_ID = 'com.example.tanstackchat'

export const isNativeApp = () => Capacitor.isNativePlatform()

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Shows the system Sign in with Apple sheet and returns what Convex needs.
export async function authorizeWithAppleNative() {
  const nonce = randomNonce()
  const { response } = await SignInWithApple.authorize({
    clientId: BUNDLE_ID,
    redirectURI: 'https://appleid.apple.com',
    scopes: 'email name',
    nonce,
  })
  const name = [response.givenName, response.familyName].filter(Boolean).join(' ')
  return { identityToken: response.identityToken, nonce, name }
}
