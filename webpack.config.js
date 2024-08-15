const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const pack = require('./package.json');

module.exports = (env, argv) => ({
    entry: './src/main.ts',
    mode: argv.mode == 'development' ? 'development' : 'production',
    devtool: argv.mode == 'development' ? 'source-map' : undefined,

    output: {
        filename: !env.minimize ? 'encantar.js' : 'encantar.min.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/',
        library: {
            name: 'AR',
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
                `encantAR.js version ${version}`,
                `${description}`,
                `Copyright ${year} ${author}`,
                `${homepage}`,
                ``,
                `@license LGPL-3.0-or-later`,
                `Date: ${date}`,
            ].join('\n')))({
                ...pack,
                'date': new Date().toISOString(),
                'year': [2022, new Date().getFullYear()].join('-'),
                'author': pack.author.replace('@', '(at)'),
            }))
        }),
        new webpack.DefinePlugin({
            '__AR_VERSION__': JSON.stringify(pack.version),
            '__AR_DEVELOPMENT_MODE__': argv.mode == 'development',
            '__AR_WEBSITE__': JSON.stringify(pack.homepage),
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
            use: [{
                loader: 'ts-loader',
                options: {
                    // improve the build time when using the dev server
                    transpileOnly: env.PORT !== undefined,
                },
            }],
        }],
    },

    devServer: {
        server: 'https',
        host: env.HOST || '0.0.0.0',
        port: env.PORT || 8000,
        static: ['demos', 'tests'].map(dir => ({
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