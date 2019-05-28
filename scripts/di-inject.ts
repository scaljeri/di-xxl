#!/usr/bin/env node

import { glob } from 'glob';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const [, , base, entryFile, pattern] = process.argv;

console.log(`pattern: ${pattern}`);
let output = '';

// console.log(path.dirname(entryFile));
// console.log(path.basename(entryFile));

// options is optional
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

    const entryContent = await readFile(path.join(base, entryFile), 'utf8');

    const outname = entryFile.replace(/\.ts/, '');
    const outName = path.join(base, outname + '-di.ts');
    await writeFile(outName, output + '\n\n' + entryContent);

    console.log(`Output written to ${outName}`);
});