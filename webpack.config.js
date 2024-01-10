const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const pack = require('./package.json');

module.exports = (env, argv) => ({
    entry: './src/main.ts',
    mode: argv.mode == 'development' ? 'development' : 'production',
    devtool: argv.mode == 'development' ? 'source-map' : undefined,

    output: {
        filename: !env.minimize ? 'martins.js' : 'martins.min.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
        library: {
            name: 'Martins',
            type: 'umd',
            export: 'default',
        },
    },

    resolve: {
        extensions: [ '.ts', '.js' ],
        symlinks: false,
        modules: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, '../node_modules'),
            'node_modules',
        ],
    },

    plugins: [
        new webpack.BannerPlugin({
            banner: ((({ author, version, year, homepage, description, date }) => ([
                `MARTINS.js Free Edition version ${version}`,
                `${description}`,
                `Copyright ${year} ${author}`,
                `${homepage}`,
                ``,
                `@license AGPL-3.0-only`,
                `Date: ${date}`,
            ].join('\n')))({
                ...pack,
                'date': new Date().toISOString(),
                'year': [ ...(new Set([2022, new Date().getFullYear()])) ].join('-'),
                'author': pack.author.replace('@', '(at)'),
            }))
        }),
        new webpack.DefinePlugin({
            '__MARTINS_VERSION__': JSON.stringify(pack.version),
            '__MARTINS_DEVELOPMENT_MODE__': argv.mode == 'development',
            '__MARTINS_WEBSITE__': JSON.stringify(pack.homepage),
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /\.ignore\./i,
        }),
    ],

    module: {
        rules: [{
            test: /\.ts$/,
            include: path.resolve(__dirname, 'src'),
            exclude: /node_modules/,
            use: 'ts-loader',
        }],
    },

    devServer: {
        https: true,
        host: env.HOST || '0.0.0.0',
        port: env.PORT || 8000,
        static: ['assets', 'demos', 'tests'].map(dir => ({
            directory: path.resolve(__dirname, dir),
            publicPath: `/${dir}/`,
        })),
        //host: '0.0.0.0',
        //host: 'local-ip',
    },

    optimization: !env.minimize ? { minimize: false } : {
        minimize: true,
        minimizer: [new TerserPlugin({
            terserOptions: {
                format: {
                    comments: /@license/i,
                },
            },
            extractComments: false,
        })],
    },
});