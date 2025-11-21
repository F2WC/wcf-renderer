const mfeVueName = '@mf/vue'
const mfeReactName = '@mf/react'
const mfeVue = await import(/* @vite-ignore */ mfeVueName)
const mfeReact = await import(/* @vite-ignore */ mfeReactName)

mfeVue.bootstrap()
mfeReact.bootstrap()

window.vue = {
  unmount: mfeVue.unmount,
  mount: mfeVue.mount,
}

window.react = {
  unmount: mfeReact.unmount,
  mount: mfeReact.mount,
}
