import type { TokenPayload } from './jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'tribu-dulce-secret-key-fallback-2026';

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const decoded = atob(`${base64}${padding}`);
  const buffer = new ArrayBuffer(decoded.length);
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }

  return buffer;
}

function decodeJson(value: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

export async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const header = decodeJson(encodedHeader);
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return null;

    const payload = decodeJson(encodedPayload);
    if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
      return null;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isSignatureValid = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );

    if (!isSignatureValid) return null;

    return payload as unknown as TokenPayload;
  } catch (error: any) {
    console.log('error', error);
    return null;
  }
}
