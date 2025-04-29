import { promises as fs } from 'fs';
import { compile } from 'json-schema-to-typescript';
import { JSONSchema4 } from 'json-schema';
import _ from 'lodash';

import { Schemas } from '../src/schemas';

const TYPES_FOLDER = 'src/schemas/types';

(async () => {
  try {
    const schemas = Object.values(Schemas);

    for (const schema of schemas) {
      const ts = await compile(schema as unknown as JSONSchema4, schema.title);
      await fs.writeFile(`${TYPES_FOLDER}/${_.kebabCase(schema.title)}.ts`, ts);
    }

    const index = schemas.reduce((acc, schema) => {
      return acc + `export * from './${_.kebabCase(schema.title)}';\n`;
    }, '');

    await fs.writeFile(`${TYPES_FOLDER}/index.ts`, index);
  } catch (e) {
    console.error('Error:', e);
  }
})();
