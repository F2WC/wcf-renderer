const mfeVueName = '@mf/vue'
const mfeReactName = '@mf/react'
const mfeVue = await import(/* @vite-ignore */ mfeVueName)
const mfeReact = await import(/* @vite-ignore */ mfeReactName)

mfeVue.register()
mfeReact.register()

await mfeVue.bootstrap()
await mfeVue.mount()

window.vue = {
  bootstrap: mfeVue.bootstrap,
  mount: mfeVue.mount,
  unmount: mfeVue.unmount,
}

window.react = {
  bootstrap: mfeReact.bootstrap,
  mount: mfeReact.mount,
  unmount: mfeReact.unmount,
}
