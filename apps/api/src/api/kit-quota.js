import pocketbaseClient from '../utils/pocketbaseClient.js';
import { getKit, kitSlugFor } from '../constants/kits.js';
import { getUserSubscriptions } from './ecommerce-subscriptions.js';

/**
 * Cota mensal de Kits de Arranque para assinantes (planilha da Resolvo Já, 12/10/2026):
 * Essencial 3 soluções completas por mês, Pro 8. O mês é o do calendário (fuso de São Paulo),
 * então vale igual para quem paga mensal ou anual. Baixar de novo um kit já pego no mês não gasta cota.
 */
export const COTA_POR_PLANO = { Essencial: 3, Pro: 8 };

const ATIVA = new Set(['active', 'trialing']);

export function periodoAtual(agora = new Date()) {
	const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' })
		.formatToParts(agora);
	const ano = partes.find((p) => p.type === 'year').value;
	const mes = partes.find((p) => p.type === 'month').value;
	return `${ano}-${mes}`;
}

async function planoAtivo(userId) {
	const assinaturas = await getUserSubscriptions({ userId });
	const ativas = assinaturas.filter((s) => ATIVA.has(s.status) && COTA_POR_PLANO[s.product_title]);
	// se houver mais de uma, vale a de maior cota
	ativas.sort((a, b) => COTA_POR_PLANO[b.product_title] - COTA_POR_PLANO[a.product_title]);
	return ativas[0]?.product_title ?? null;
}

async function downloadsDoMes(userId, periodo) {
	return pocketbaseClient.collection('kit_downloads').getFullList({
		filter: pocketbaseClient.filter('userId = {:userId} && periodo = {:periodo}', { userId, periodo }),
		sort: 'created',
	});
}

/**
 * @returns {Promise<{ plano: string|null, limite: number, usados: number, periodo: string, subdivisoes: string[] }>}
 */
export async function statusCota({ userId }) {
	const periodo = periodoAtual();
	const plano = await planoAtivo(userId);
	if (!plano) return { plano: null, limite: 0, usados: 0, periodo, subdivisoes: [] };
	const registros = await downloadsDoMes(userId, periodo);
	return { plano, limite: COTA_POR_PLANO[plano], usados: registros.length, periodo, subdivisoes: registros.map((r) => r.subdivision) };
}

/**
 * Libera o kit da subdivisão para o assinante, consumindo cota se for a primeira vez no mês.
 *
 * @returns {Promise<{ kit: { title: string, filename: string, filePath: string }, status: object }>}
 */
export async function liberarKit({ userId, subdivision }) {
	const erro = (status, message) => Object.assign(new Error(message), { status });
	const kit = getKit(kitSlugFor(subdivision));
	if (!kit) throw erro(404, 'Ainda não há kit pronto para esta solução.');

	const status = await statusCota({ userId });
	if (!status.plano) throw erro(403, 'Disponível para assinantes do Essencial ou do Pro.');
	if (status.subdivisoes.includes(subdivision)) return { kit, status };
	if (status.usados >= status.limite) {
		throw erro(429, `Você já usou as ${status.limite} soluções do seu plano este mês. A cota renova no dia 1º.`);
	}
	try {
		await pocketbaseClient.collection('kit_downloads').create({
			userId, subdivision, kit_slug: kit.slug, periodo: status.periodo, plano: status.plano,
		});
	} catch (e) {
		// dois cliques ao mesmo tempo: o índice único segura; se já existe, é só rebaixar
		const recheck = await statusCota({ userId });
		if (!recheck.subdivisoes.includes(subdivision)) throw e;
		return { kit, status: recheck };
	}
	return { kit, status: { ...status, usados: status.usados + 1, subdivisoes: [...status.subdivisoes, subdivision] } };
}
