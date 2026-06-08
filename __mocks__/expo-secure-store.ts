const store: Record<string, string> = {}

const defaultGetItem = async (key: string): Promise<string | null> =>
  store[key] ?? null

const defaultSetItem = async (key: string, value: string): Promise<void> => {
  store[key] = value
}

const defaultDeleteItem = async (key: string): Promise<void> => {
  delete store[key]
}

export const getItemAsync = jest.fn(defaultGetItem)
export const setItemAsync = jest.fn(defaultSetItem)
export const deleteItemAsync = jest.fn(defaultDeleteItem)

export function __reset() {
  Object.keys(store).forEach((k) => delete store[k])
  getItemAsync.mockReset()
  setItemAsync.mockReset()
  deleteItemAsync.mockReset()
  getItemAsync.mockImplementation(defaultGetItem)
  setItemAsync.mockImplementation(defaultSetItem)
  deleteItemAsync.mockImplementation(defaultDeleteItem)
}
