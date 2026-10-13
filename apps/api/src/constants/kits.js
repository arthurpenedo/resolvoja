import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Kits de Arranque: planilhas prontas entregues logo após o pagamento da solução
 * completa, enquanto a equipe desenvolve a versão final. Geradas por
 * `tools/kits/gerar_kits.py` (na raiz do monorepo) e versionadas em `apps/api/kits/`.
 *
 * `subdivisions` usa exatamente os nomes de `apps/web/src/data/hub.js`. Um mesmo kit
 * pode atender subdivisões de áreas diferentes quando o problema é o mesmo.
 */
export const KITS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../kits');

const MANUAL_KITS = {
	'controle-de-estoque': {
		title: 'Kit de Arranque · Controle de Estoque',
		subdivisions: ['Controle de estoque', 'Gestão de estoque'],
	},
	'gestao-de-pedidos': {
		title: 'Kit de Arranque · Gestão de Pedidos',
		subdivisions: ['Gestão de pedidos'],
	},
	'controle-de-vencimentos': {
		title: 'Kit de Arranque · Controle de Vencimentos',
		subdivisions: ['Controle de vencimentos'],
	},
};

/**
 * Kits gerados a partir das especificações em `tools/kits/specs/` por `tools/kits/gerar_kits_genericos.py`,
 * que grava o índice em `apps/api/kits/indice.json`. Os kits feitos à mão acima têm prioridade.
 */
function loadGeneratedKits() {
	try {
		return JSON.parse(fs.readFileSync(path.join(KITS_DIR, 'indice.json'), 'utf8'));
	} catch {
		return {};
	}
}

export const KITS = { ...loadGeneratedKits(), ...MANUAL_KITS };

/**
 * @param {string | null | undefined} subdivision
 * @returns {string | null} slug do kit para a subdivisão, ou null se ainda não houver kit.
 */
export function kitSlugFor(subdivision) {
	if (!subdivision) return null;
	const entry = Object.entries(KITS).find(([, kit]) => kit.subdivisions.includes(subdivision));
	return entry ? entry[0] : null;
}

/**
 * @param {string | null | undefined} slug
 * @returns {{ slug: string, title: string, filename: string, filePath: string } | null}
 */
export function getKit(slug) {
	const kit = slug ? KITS[slug] : null;
	if (!kit) return null;
	return {
		slug,
		title: kit.title,
		filename: `resolvoja-${slug}.xlsx`,
		filePath: path.join(KITS_DIR, `${slug}.xlsx`),
	};
}
