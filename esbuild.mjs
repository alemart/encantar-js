import * as esbuild from 'esbuild';
import { readFile } from 'fs/promises';

const argv = process.argv.slice(2);
const json = await readFile(new URL('./package.json', import.meta.url), { encoding: 'utf8' });
const pack = JSON.parse(json);
const production = !pack.version.endsWith('-dev');
const minify = (argv.indexOf('--minify') >= 0);
const esm = (argv.indexOf('--module') >= 0);
const serve = (argv.indexOf('--serve') >= 0);
const AR_FLAGS = +(process.env.AR_FLAGS ?? 0);

const options = Object.assign({

    bundle: true,
    platform: 'browser',
    target: ['es2020'],
    minify: minify,

    define: {
        __AR_VERSION__: JSON.stringify(pack.version),
        __AR_WEBSITE__: JSON.stringify(pack.homepage),
        __AR_FLAGS__  : String(AR_FLAGS),
    },

    legalComments: 'inline',
    banner: { js: generateBanner() },
    footer: { js: serve ? generateLiveReloadCode() : '' },
    sourcemap: !production && 'linked',
    logLevel: 'info',

}, esm ? {

    // ESM
    format: 'esm',
    outfile: 'build/' + (minify ? 'encantar.module.min.js' : 'encantar.module.js'),
    //entryPoints: ['src/main.ts'], // error with --serve
    stdin: {
        contents: 'export * from "./main.ts";',
        resolveDir: 'src',
        sourcefile: 'index.ts',
    },

} : {

    // IIFE
    format: 'iife',
    globalName: 'AR',
    outfile: 'build/' + (minify ? 'encantar.min.js' : 'encantar.js'),
    stdin: {
        contents: (`
            import * as AR from "./main.ts";
            window.Speedy = window.Speedy || AR.Speedy;
            module.exports = AR;
        `),
        resolveDir: 'src',
        sourcefile: 'index.ts',
    },

});

if(AR_FLAGS & 1) {
    console.log('%s 👍 Reminder disabled - thank you for supporting open-source AR! %s', '\x1b[33m', '\x1b[0m');
}

if(!serve) {
    await esbuild.build(options);
    process.exit(0);
}

const ctx = await esbuild.context(options);
await ctx.watch();
await ctx.serve({
    host: '0.0.0.0',
    port: Number(process.env.PORT ?? 8000),
    servedir: 'www',
    keyfile: new URL('.local-server.key', import.meta.url).pathname,
    certfile: new URL('.local-server.cert', import.meta.url).pathname,
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
