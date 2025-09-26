import type {Plugin} from 'vite';

export default function wcfRenderer(): Plugin {
    return {
        name: 'wcf-renderer',
        config() {
            return {
                define: {
                    __WCFR_APP_NAME__: process.env.npm_package_name,
                },
            };
        },
    };
}
