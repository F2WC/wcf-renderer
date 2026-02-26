import { LoadApp } from '@/types/index.js'

let globalLoader: LoadApp | undefined

export function setLoader(loader: LoadApp) {
  globalLoader = loader
}

export function getLoader(): LoadApp | undefined {
  return globalLoader
}
