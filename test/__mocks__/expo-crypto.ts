let counter = 0

export const randomUUID = jest.fn(() => `test-uuid-${++counter}`)

export const getRandomValues = jest.fn(<T extends ArrayBufferView>(array: T): T => {
  if (array instanceof Uint8Array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return array
})
