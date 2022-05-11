/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack5: true,
    reactStrictMode: true,
    webpack: function (config, options) {
        config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm'
        console.log(options.webpack.version); // 5.18.0
        if (!options.isServer) {
            config.resolve.fallback.fs = false;
        }
        config.experiments = { asyncWebAssembly: true };
        return config;
    },
}

module.exports = nextConfig
