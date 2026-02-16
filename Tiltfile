docker_compose('./docker-compose.yml')

dc_resource('sdk', labels=['packages'])
dc_resource('shell-package', labels=['packages'], resource_deps=['sdk'])
dc_resource('mfe-vue-one', labels=['mfe'], resource_deps=['sdk'])
dc_resource('mfe-react-one', labels=['mfe'], resource_deps=['sdk'])
dc_resource('nginx', labels=['edge'], resource_deps=['mfe-vue-one', 'mfe-react-one'])
dc_resource('app-shell', labels=['playground'], resource_deps=['shell-package', 'nginx'])
