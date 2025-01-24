import * as esbuild from 'esbuild';
import path from 'path';
import { readFile } from 'fs/promises';

const argv = process.argv.slice(2);
const json = await readFile(new URL('./package.json', import.meta.url), { encoding: 'utf8' });
const pack = JSON.parse(json);
const production = (pack.version.indexOf('-dev') < 0);
const minify = (argv.indexOf('--minify') >= 0);
const serve = (argv.indexOf('--serve') >= 0);

const options = {
    //entryPoints: ['src/main.ts'], // AR.default
    stdin: {
        contents: 'import AR from "./main.ts";\nmodule.exports = AR;',
        resolveDir: 'src',
        sourcefile: 'index.ts',
    },
    bundle: true,
    minify: minify,
    target: ['es2020'],
    format: 'iife',
    globalName: 'AR',
    define: {
        __AR_VERSION__: JSON.stringify(pack.version),
        __AR_WEBSITE__: JSON.stringify(pack.homepage),
    },
    legalComments: 'inline',
    banner: { js: generateBanner() },
    footer: { js: serve ? generateLiveReloadCode() : '' },
    outfile: 'www/dist/' + (minify ? 'encantar.min.js' : 'encantar.js'),
    sourcemap: !production && 'linked',
    logLevel: 'info',
};

if(!serve) {
    await esbuild.build(options);
    process.exit(0);
}

const ctx = await esbuild.context(options);
await ctx.watch();
await ctx.serve({
    host: '0.0.0.0',
    port: 8000,
    servedir: 'www',
    keyfile: path.join(import.meta.dirname, '.local-server.key'),
    certfile: path.join(import.meta.dirname, '.local-server.cert'),
});

function generateBanner()
{
    const { version, description, homepage, license } = pack;
    const author = pack.author.replace('@', '(at)');
    const year = new Date().getFullYear();
    const date = new Date().toISOString();

    return [
    `/*!`,
    ` * encantar.js version ${version}`,
    ` * ${description}`,
    ` * Copyright 2022-${year} ${author}`,
    ` * ${homepage}`,
    ` *`,
    ` * @license ${license}`,
    ` * Date: ${date}`,
    `*/`
    ].join('\n');
}

function generateLiveReloadCode()
{
    return `
    (function liveReload() {
       new EventSource('/esbuild').
       addEventListener('change', () => location.reload());
    })();
    `;
}
