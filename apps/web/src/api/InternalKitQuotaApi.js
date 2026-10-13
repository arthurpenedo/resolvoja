import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';

const authHeader = () => ({ Authorization: `Bearer ${pb.authStore.token}` });

/**
 * GET `/ecommerce/subscriptions/kits` — cota de Kits de Arranque do assinante no mês.
 *
 * @returns {Promise<{ plano: string|null, limite: number, usados: number, periodo: string, subdivisoes: string[] }>}
 */
export async function getKitQuota() {
	const response = await apiServerClient.fetch('/ecommerce/subscriptions/kits', { headers: authHeader() });
	if (!response.ok) throw new Error(`Falha ao consultar a cota: ${response.status}`);
	return response.json();
}

/**
 * GET `/ecommerce/subscriptions/kits/download?subdivision=` — baixa o kit da solução usando a cota do mês.
 * Lança um erro com a mensagem da API (sem assinatura, sem kit, cota esgotada).
 *
 * @param {{ subdivision: string }} params
 */
export async function downloadSubscriberKit({ subdivision }) {
	const response = await apiServerClient.fetch(
		`/ecommerce/subscriptions/kits/download?subdivision=${encodeURIComponent(subdivision)}`,
		{ headers: authHeader() },
	);
	if (!response.ok) {
		const corpo = await response.json().catch(() => ({}));
		throw new Error(corpo.error || 'Não foi possível baixar agora. Tente de novo em instantes.');
	}
	const disposition = response.headers.get('Content-Disposition') ?? '';
	const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? 'kit-de-arranque.xlsx';
	const url = URL.createObjectURL(await response.blob());
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
