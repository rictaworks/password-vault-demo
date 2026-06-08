jest.mock('expo-secure-store')
jest.mock('expo-local-authentication')
jest.mock('expo-crypto')
jest.mock('expo-localization')
jest.mock('expo-sqlite')
jest.mock('expo-clipboard')

global.crypto = {
  getRandomValues: <T extends ArrayBufferView>(array: T): T => {
    if (array instanceof Uint8Array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
    }
    return array
  },
  subtle: {
    importKey: jest.fn().mockResolvedValue({}),
    deriveBits: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    generateKey: jest.fn(),
    exportKey: jest.fn(),
  },
} as unknown as Crypto
