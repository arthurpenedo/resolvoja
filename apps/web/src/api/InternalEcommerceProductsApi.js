import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';

const authHeader = () => ({ Authorization: `Bearer ${pb.authStore.token}` });

/**
 * GET `/ecommerce/products` — list active one-time (non-subscription) products, e.g. Consultoria.
 *
 * @returns {Promise<{ products: Array<{
 *   id: string,
 *   priceId: string,
 *   title: string,
 *   description: string,
 *   price_in_cents: number,
 *   currency: string,
 *   price_formatted: string,
 * }> }>}
 */
export async function getOneTimeProducts() {
	const res = await apiServerClient.fetch('/ecommerce/products');
	if (!res.ok) {
		throw new Error(`Failed to fetch products: ${res.status}`);
	}
	return res.json();
}

/**
 * POST `/ecommerce/products/checkout` — creates a Stripe Checkout session (one-time payment) for a product price.
 *
 * Usage (Hire button — redirect with `window.location`):
 *   import { createOneTimeCheckout } from '@/api/InternalEcommerceProductsApi';
 *   const { url } = await createOneTimeCheckout({
 *     priceId: product.priceId,
 *     successUrl: window.location.origin + '/consultoria/obrigado?session_id={CHECKOUT_SESSION_ID}',
 *     cancelUrl: window.location.href,
 *   });
 *   window.location = url;
 *
 * `area` and `subdivision` identify the problem being bought, so the order can deliver
 * the matching Kit de Arranque.
 *
 * @param {{ priceId: string, successUrl: string, cancelUrl: string, area?: string, subdivision?: string }} params
 * @returns {Promise<{ url: string }>}
 */
export async function createOneTimeCheckout({ priceId, successUrl, cancelUrl, area, subdivision }) {
	const response = await apiServerClient.fetch('/ecommerce/products/checkout', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeader() },
		body: JSON.stringify({ priceId, successUrl, cancelUrl, area, subdivision }),
	});
	if (!response.ok) {
		let body = null;
		try { body = await response.json(); } catch { /* body was not JSON */ }
		throw new Error(body?.message ?? `Failed to start checkout: ${response.status}`);
	}
	return response.json();
}

/**
 * POST `/ecommerce/products/confirm` — confirms a completed one-time Checkout Session and
 * records the order, so the success page can show what was purchased.
 *
 * @param {{ sessionId: string }} params
 * @returns {Promise<{ order: { id: string, productTitle: string, amountFormatted: string, area: string, subdivision: string, kit: { title: string } | null } }>}
 */
export async function confirmOneTimeOrder({ sessionId }) {
	const response = await apiServerClient.fetch('/ecommerce/products/confirm', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeader() },
		body: JSON.stringify({ sessionId }),
	});
	if (!response.ok) {
		let body = null;
		try { body = await response.json(); } catch { /* body was not JSON */ }
		throw new Error(body?.message ?? `Failed to confirm order: ${response.status}`);
	}
	return response.json();
}

/**
 * GET `/ecommerce/products/orders` — the user's paid orders, each with its Kit de Arranque (if any).
 *
 * @returns {Promise<{ orders: Array<{ id: string, productTitle: string, amountFormatted: string, area: string, subdivision: string, kit: { title: string } | null, created: string }> }>}
 */
export async function getMyOrders() {
	const response = await apiServerClient.fetch('/ecommerce/products/orders', { headers: authHeader() });
	if (!response.ok) {
		throw new Error(`Failed to fetch orders: ${response.status}`);
	}
	return response.json();
}

/**
 * GET `/ecommerce/products/orders/:orderId/kit` — downloads the order's Kit de Arranque
 * (.xlsx). The endpoint needs the auth header, so the file is fetched as a blob and saved
 * through a temporary link instead of a plain `<a href>`.
 *
 * @param {{ orderId: string }} params
 */
export async function downloadOrderKit({ orderId }) {
	const response = await apiServerClient.fetch(`/ecommerce/products/orders/${encodeURIComponent(orderId)}/kit`, {
		headers: authHeader(),
	});
	if (!response.ok) {
		throw new Error(`Failed to download kit: ${response.status}`);
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
