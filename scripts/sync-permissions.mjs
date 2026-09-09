#!/usr/bin/env node
/**
 * Regenera lib/auth/permissions.ts a partir do catálogo da API.
 *
 * A fonte da verdade é kumprahub-api/src/authz/permissions.ts. Este ficheiro
 * existe para o backoffice ter tipos, não para ter opinião: se divergir, é
 * ruído — e cópias manuais entre estes repositórios já divergiram antes (ver
 * lib/home-layout/schema.ts, que devia estar alinhado com o techarena e não
 * está).
 *
 *   node scripts/sync-permissions.mjs           regenera
 *   node scripts/sync-permissions.mjs --check   falha se estiver desalinhado
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const API_SOURCE =
  process.env.KUMPRAHUB_API_PATH ??
  resolve(root, '..', 'kumprahub-api', 'src', 'authz', 'permissions.ts');

const TARGET = join(root, 'lib', 'auth', 'permissions.ts');

if (!existsSync(API_SOURCE)) {
  console.error(
    `Não encontrei o catálogo da API em:\n  ${API_SOURCE}\n` +
      'Define KUMPRAHUB_API_PATH se o repositório estiver noutro sítio.',
  );
  process.exit(1);
}

const source = readFileSync(API_SOURCE, 'utf8');

/** Lê os literais de um `export const NOME = [...] as const;`. */
function readList(name) {
  const match = source.match(
    new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const;`),
  );
  if (!match) {
    console.error(`Não consegui ler ${name} do catálogo da API.`);
    process.exit(1);
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const store = readList('STORE_PERMISSIONS');
const storefront = readList('STOREFRONT_PERMISSIONS');
const platform = readList('PLATFORM_PERMISSIONS');

const lines = (list) => list.map((p) => `  "${p}",`).join('\n');

const generated = `// GERADO — não editar à mão.
//
// Fonte: kumprahub-api/src/authz/permissions.ts
// Regenerar: node scripts/sync-permissions.mjs
//
// O backoffice não decide permissões: recebe-as de /api/me e desenha a partir
// delas. Isto existe só para o TypeScript saber os nomes válidos, de forma a
// que um \`can("prodcuts.write")\` não compile.

export const STORE_PERMISSIONS = [
${lines(store)}
] as const;

export const STOREFRONT_PERMISSIONS = [
${lines(storefront)}
] as const;

export const PLATFORM_PERMISSIONS = [
${lines(platform)}
] as const;

export const ALL_PERMISSIONS = [
  ...STORE_PERMISSIONS,
  ...STOREFRONT_PERMISSIONS,
  ...PLATFORM_PERMISSIONS,
] as const;

export type StorePermission = (typeof STORE_PERMISSIONS)[number];
export type Permission = (typeof ALL_PERMISSIONS)[number];

const KNOWN: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return KNOWN.has(value);
}
`;

const check = process.argv.includes('--check');
const current = existsSync(TARGET) ? readFileSync(TARGET, 'utf8') : '';

if (check) {
  if (current !== generated) {
    console.error(
      'lib/auth/permissions.ts está desalinhado do catálogo da API.\n' +
        'Corre: node scripts/sync-permissions.mjs',
    );
    process.exit(1);
  }
  console.log(
    `Catálogo alinhado: ${store.length} + ${storefront.length} + ${platform.length} permissões.`,
  );
  process.exit(0);
}

writeFileSync(TARGET, generated, 'utf8');
console.log(
  `lib/auth/permissions.ts regenerado: ${store.length} de loja, ` +
    `${storefront.length} de storefront, ${platform.length} de plataforma.`,
);
