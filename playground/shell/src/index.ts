const mfeVue = await import('~/mfe-vue-one/dist/index.js')
const mfeReact = await import('~/mfe-react-one/dist/index.js')

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
