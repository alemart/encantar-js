#!/usr/bin/env node
/**
 * @file Build script for encantar.js
 * @author Alexandre Martins
 * @license Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as esbuild from 'esbuild';
import { Command, Argument } from 'commander';

const program = new Command();
const metadata = readMetadata();

program
    .name('build.mjs')
    .description('Build script for encantar.js')
    .version(metadata.version);




// -----------------------------------------------------------------------------
// Core library
// -----------------------------------------------------------------------------
program.command('core')
    .description('build the core library')
    .addArgument(new Argument('[format]', 'output format').choices(['iife', 'esm']).default('iife'))
    .option('-d, --output-directory <outdir>', 'output directory', 'dist')
    .option('-m, --minify', 'whether or not to minify the output')
    .action(async (format, options) => {

        console.log(`🔨 Building the${options.minify ? ' minified' : ''} core library in ${format} format to ${options.outputDirectory}...`);

        try {
            await buildLibrary({
                format,
                outdir: options.outputDirectory,
                minify: options.minify,
            });
            console.log('✅ Success!');
        }
        catch(error) {
            console.error(`❌ Whoops!`, error);
        }

    });




// -----------------------------------------------------------------------------
// Plugins
// -----------------------------------------------------------------------------
program.command('plugins')
    .description('build the plugins')
    .argument('[plugin_name]', 'if specified, build only a specific plugin')
    .option('-d, --output-directory <outdir>', 'output directory', path.join('dist', 'plugins'))
    .option('-m, --minify', 'whether or not to minify the output')
    .action(async (name, options) => {

        console.log(`🔨 Building the${options.minify ? ' minified' : ''} plugins to ${options.outputDirectory}...`);

        try {
            const plugins = fs.readdirSync(path.join('src', 'plugins'))
                              .filter(file => file.endsWith('.js'))
                              .map(file => file.replace(/\.js$/, ''))
                              .filter(plugin => !name || plugin === name);

            if(plugins.length == 0 && name)
                throw new Error('Not Found: ' + name);

            for(const plugin of plugins) {
                console.log(plugin);
                await buildExtra({
                    filepath: path.join('src', 'plugins', plugin + '.js'),
                    outdir: options.outputDirectory,
                    minify: options.minify,
                });
            }

            console.log('✅ Success!');
        }
        catch(error) {
            console.error(`❌ Whoops!`, error);
        }

    });




// -----------------------------------------------------------------------------
// Addons
// -----------------------------------------------------------------------------
program.command('addons')
    .description('build the addons')
    .argument('[addon_name]', 'if specified, build only a specific addon')
    .option('-d, --output-directory <outdir>', 'output directory', path.join('dist', 'addons'))
    .option('-m, --minify', 'whether or not to minify the output')
    .action(async (name, options) => {

        console.log(`🔨 Building the${options.minify ? ' minified' : ''} addons to ${options.outputDirectory}...`);

        try {
            const addons = fs.readdirSync(path.join('src', 'addons'))
                             .filter(file => file.endsWith('.js'))
                             .map(file => file.replace(/\.js$/, ''))
                             .filter(addon => !name || addon === name);

            if(addons.length == 0 && name)
                throw new Error('Not Found: ' + name);

            for(const addon of addons) {
                console.log(addon);
                await buildExtra({
                    filepath: path.join('src', 'addons', addon + '.js'),
                    outdir: options.outputDirectory,
                    minify: options.minify,
                });
            }

            console.log('✅ Success!');
        }
        catch(error) {
            console.error(`❌ Whoops!`, error);
        }

    });




// -----------------------------------------------------------------------------
// Development server
// -----------------------------------------------------------------------------
program.command('serve')
    .description('start a local web server for development')
    .option('-p, --port <port>', 'port number', 8000)
    .option('-H, --host <host>', 'host', '0.0.0.0')
    .option('-s, --secure', 'enable HTTPS')
    .action(async (options) => {

        const protocol = options.secure ? 'https' : 'http';
        const host = options.host == '0.0.0.0' || options.host == '::' ? 'localhost' : options.host;
        console.log('💻 %sGet started at %s://%s:%d/demos %s', '\x1b[32m', protocol, host, options.port, '\x1b[0m');

        if(!options.secure)
            console.warn('⚠️  %sRecommended: use the --secure option to enable HTTPS %s', '\x1b[33m', '\x1b[0m');

        try {

            const basename = (new URL('.', import.meta.url)).pathname;
            const extras = !options.secure ? {} : {
                keyfile: path.join(basename, '.local-server.key'),
                certfile: path.join(basename, '.local-server.cert'),
            };

            if(options.secure && (!fs.existsSync(extras.keyfile) || !fs.existsSync(extras.certfile))) {
                const command = 'openssl req -x509 -newkey rsa:4096 -keyout .local-server.key -out .local-server.cert -days 9999 -nodes -subj /CN=127.0.0.1';
                throw new Error('Before serving over HTTPS, run\n' + command);
            }

            const ctx = await esbuild.context({});
            await ctx.serve({
                host: options.host,
                port: Number(options.port),
                servedir: basename,
                ...extras
            });

        }
        catch(error) {
            console.error(`❌ Whoops!`, error);
        }

    });




// -----------------------------------------------------------------------------
// Internals
// -----------------------------------------------------------------------------
await program.parseAsync();

function buildLibrary({ format = 'iife', outdir = 'dist', minify = false } = {})
{
    const { version, homepage } = metadata;
    const development = version.endsWith('-dev');
    const libdir = path.join('src', 'lib');

    const esm = {
        format: 'esm',
        outfile: path.join(outdir, minify ? 'encantar.module.min.js' : 'encantar.module.js'),
        stdin: {
            contents: 'export * from "./main.ts";',
            resolveDir: libdir,
            sourcefile: 'index.ts',
        },
        //entryPoints: [path.join(libdir, 'main.ts')], // error with serve
    };

    const iife = {
        format: 'iife',
        globalName: 'AR',
        outfile: path.join(outdir, minify ? 'encantar.min.js' : 'encantar.js'),
        stdin: {
            contents: (`
                import * as AR from "./main.ts";
                window.Speedy = window.Speedy || AR.Speedy;
                module.exports = AR;
            `),
            resolveDir: libdir,
            sourcefile: 'index.ts',
        },
    };

    const extras = ({ iife, esm })[format];
    if(!extras)
        throw new Error('Invalid format: ' + format);

    return esbuild.build({

        bundle: true,
        platform: 'browser',
        target: ['es2020'],
        minify: minify,

        define: {
            __AR_VERSION__: JSON.stringify(version),
            __AR_WEBSITE__: JSON.stringify(homepage),
            __AR_FLAGS__  : process.env.AR_FLAGS ?? '0',
        },

        legalComments: 'inline',
        banner: { js: generateBanner() },
        sourcemap: development && 'linked',
        logLevel: 'info',

        ...extras

    });
}

function buildExtra({ filepath = '', outdir = 'dist', minify = false } = {})
{
    return esbuild.build({
        platform: 'browser',
        target: ['es2020'],
        legalComments: 'inline',
        entryPoints: [ filepath ],
        outExtension: { '.js': minify ? '.min.js' : '.js' },
        outdir: outdir,
        minify: minify,
    });
}

function generateBanner()
{
    const { version, author, homepage, description } = metadata;
    const year = new Date().getFullYear();
    const date = new Date().toISOString();

    return [
    `/*!`,
    ` * encantar.js version ${version}`,
    ` * ${description}`,
    ` * Copyright 2022-${year} ${author.replace('@', ' at ')}`,
    ` * ${homepage}`,
    ` *`,
    ` * @license GPL-3.0-or-later`,
    ` * Date: ${date}`,
    `*/`
    ].join('\n');
}

function readMetadata()
{
    const url = new URL('package.json', import.meta.url);
    const json = fs.readFileSync(url, { encoding: 'utf8' });

    return Object.freeze(JSON.parse(json));
}