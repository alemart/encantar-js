import * as esbuild from 'esbuild';
import { mkdirSync, readdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';

// Get target from arguments: 'plugins', 'addons', or empty (both)
const target = process.argv[2];
const allFolders = ['plugins', 'addons'];

// Filter folders based on argument
const foldersToProcess = target
    ? allFolders.filter(f => f === target)
    : allFolders;

console.log(`🔨 Building: ${foldersToProcess.join(', ')}...`);

for (const folder of foldersToProcess) {
    if (!existsSync(folder)) continue;

    // Create destination folder (e.g., build/plugins)
    const outDir = join('build', folder);
    mkdirSync(outDir, { recursive: true });

    // Find .js files
    const files = readdirSync(folder).filter(f => f.endsWith('.js'));

    for (const file of files) {
        const srcPath = join(folder, file);
        const destPath = join(outDir, file);
        const minPath = join(outDir, file.replace('.js', '.min.js'));

        // 1. Copy original file
        copyFileSync(srcPath, destPath);

        // 2. Minify using esbuild
        try {
            await esbuild.build({
                minify: true,
                outfile: minPath,
                entryPoints: [ srcPath ],
            });
        } catch (e) {
            console.error(`❌ Error minifying ${file}.`, e);
        }
    }
}

console.log('✅ Done.');