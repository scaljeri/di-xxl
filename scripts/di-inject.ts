#!/usr/bin/env node

import * as yargs from 'yargs'
import { glob } from 'glob';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';


const args = yargs
    .option('base', {
            alias: 'b',
            demand: false,
            description: 'Base path to the root of the source files'
        })
        .option('entry', {
            alias: 'e',
            demand: true,
            description: "Entry filename"
        })
        .option('pattern', {
            alias: 'p',
            demand: false,
            description: `Glob patterns specifying filenames with wildcard characters, defaults to '**/*.ts'`
        })
        .option('output', {
            alias: 'o',
            demand: true,
            description: "Output file relative to `base`"
        })
        .example(`$0 -b ./src -e index.ts -p \'**/*.ts\' -o out.ts`, '-- Builds new file with injected code')
        .argv;

// Promisify to enable async/await 
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const base = args.base as string;
const entry = args.entry as string;
const pattern = args.pattern as string || '**/*.ts';
const outfile = args.output as string;

let output = '';

glob(`${base}/${pattern}`, {}, async (er, files) => {
    for (const file of files) {
        const contents = await readFile(file, 'utf8');

        if (contents.match('@Injectable')) {
            console.log(`Injecting ${file}`);
            const name = file.replace(/\.ts/, '')
            const className = contents.match(/export class ([^ ]+)/)[1];
            output += `import { ${className} } from './${path.basename(name)}';`;
            output += `${className};\n`;
        }
    }

    const entryContent = await readFile(path.join(base, entry), 'utf8');

    await writeFile(path.join(base, outfile), `${output}\n\n${entryContent}`);

    console.log(`Output written to ${path.join(base, outfile)}`);
});