#!/usr/bin/env node

import * as yargs from 'yargs'
import { glob } from 'glob';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';
import {Argv} from "yargs";

const { spawn } = require('child_process');


const args = yargs
    .option('compile', {
        alias: 'c',
        type: 'boolean',
        demand: false,
        description: 'Inject DI stuff and compiles. Default argument is `tsc`'
    })
    .option('base', {
        alias: 'b',
        type: 'string',
        demand: false,
        description: 'Base path to the root of the source files'
    })
    .option('debug', {
        alias: 'd',
        type: 'boolean',
        demand: false,
        description: 'Enable debug messages'
    })
    .option('entry', {
        alias: 'e',
        type: 'string',
        demand: false,
        description: "Entry filename"
    })
    .option('pattern', {
        alias: 'p',
        default: `'**/*.ts'`,
        type: 'string',
        demand: false,
        description: `Glob patterns specifying filenames with wildcard characters, defaults to`
    })
    .option('output', {
        alias: 'o',
        type: 'string',
        demand: false,
        description: 'Output file relative to `base. Defaults to `<entryfile>`-di.ts`'
    })
    .example(`$0 -b ./src -e index.ts -p \'**/*.ts\' -o out.ts`, '-- Builds new file with injected code')
    .example(`$0 -c -b ./src -e index.ts -p \'**/*.ts\' -o out.ts`, '-- Compiles all code with `tsc`')
    .example(`$0 -c 'yarn build' -b ./src -e index.ts -o out.ts`, '-- Compiles all code with `tsc`')
    .wrap(130) // yargs.terminalWidth())
    .argv;

sanitizeInput(yargs);

// Promisify to enable async/await
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const base = args.base as string || path.dirname(args.entry as string) || '.';
const entry = path.basename(args.entry as string);
const pattern = args.pattern || '**/*.ts';
const outfile = args.output || `${entry.replace(/\.ts/, '')}-di.ts`;
const compile = args.compile as boolean;
const debug = args.debug;

if (!fs.existsSync(path.join(base, entry))) {
    console.log(`Ooops, input file '${path.join(base, entry)}' does not exist`);
    process.exit(0);
}

(async () => {
    await inject();

    if (compile) {
        await compileCode();
    } else {
        await runCode();
    }
})();

// ================================================

function compileCode(): Promise<void> {
    const command = compile ? 'tsc' : compile;
    const tsNode = spawn(command);
    log(`Compiling: ${command}`);

    return new Promise(r => {
        tsNode.on('close', (code) => {
            r();
        });

        tsNode.stdout.on('data', (data) => {
            log(`stdout: ${data}`);
        });

        tsNode.stderr.on('data', (data) => {
            log(`stderr: ${data}`);
        });
    })
}

function runCode(): Promise<void> {
    const tsNode = spawn('./node_modules/.bin/ts-node', [path.join(base, outfile)]);

    log(`Running: ./node_modules/.bin/ts-node ${path.join(base, outfile)}`);

    return new Promise(r => {
        tsNode.on('close', (code) => {
            log(`child process exited with code ${code}`);
            r();
        });

        tsNode.stdout.on('data', (data) => {
            log(`stdout: ${data}`);
        });

        tsNode.stderr.on('data', (data) => {
            log(`stderr: ${data}`);
        });
    })
}

function inject(): Promise<void> {
    let output = '';

    return new Promise(resolve => {
        glob(`${base}/${pattern}`, {}, async (er, files) => {
            let entryContent = await readFile(path.join(base || '', entry), 'utf8');

            for (const file of files) {
                const name = file.replace('.ts', '').replace(base, '.');

                const re = new RegExp(`(from ['"]${name}['"]);`, 'm');


                const contents = await readFile(file, 'utf8');

                if (contents.match('@Injectable')) {
                    if (entryContent.match(re)) {
                        entryContent.replace(re, `${RegExp.$1}${name}`)
                    } else {
                        log(`Injecting ${file}`);
                        const className = contents.match(/export class ([^ ]+)/)[1];
                        entryContent = `import { ${className} } from '${name}';${className};\n` + entryContent;
                    }
                }
            }


            await writeFile(path.join(base || '', outfile), `${output}\n\n${entryContent}`);

            log(`Output written to ${path.join(base || '', outfile)}`);
            resolve();
        });
    });
}

function log(msg: string): void {
    if (!debug) {
        console.log(msg);
    }
}

function sanitizeInput(yargs: Argv<{}>): void {
    if (!args.entry) {
        const pargs = process.argv.slice(2);
        const last = pargs.slice(-1)[0] as string;
        const option = pargs.length > 1 ? pargs.slice(-2)[0] : null;

        if (last && fs.existsSync(path.join(args.base || '', last))) {
            args.entry = last;

            if (option && !option.match(/^-(d|-debug)/)) {
                args.debug = true;
            } else if (option && !option.match(/^-(c|-compile)/)) {
                args.compile = true;
            }
        }

        if (!args.entry) {
            yargs.showHelp();
            process.exit(0);
        }
    }
}

