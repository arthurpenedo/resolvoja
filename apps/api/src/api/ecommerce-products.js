import stripeClient from '../utils/stripe.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import { findOrCreateStripeCustomer, getStoredStripeCustomerId, formatBrl } from './ecommerce-subscriptions.js';
import { getKit, kitSlugFor } from '../constants/kits.js';

const METADATA_MAX = 200;

function metadataValue(value) {
	return typeof value === 'string' ? value.trim().slice(0, METADATA_MAX) : '';
}

/**
 * @typedef {object} EcommerceOneTimeProduct
 * @property {string} id - Stripe product id.
 * @property {string} priceId - Stripe price id (one-time, non-recurring).
 * @property {string} title - Product name.
 * @property {string} description - Product description.
 * @property {number} price_in_cents - Price in cents.
 * @property {string} currency - Price currency.
 * @property {string} price_formatted - Formatted BRL price.
 */

/**
 * Lists active one-time (non-recurring) Stripe products — e.g. avulso services like
 * the Consultoria. Separate from {@link listPlans} in ecommerce-subscriptions.js,
 * which only lists recurring subscription prices.
 *
 * @returns {Promise<EcommerceOneTimeProduct[]>}
 */
export async function listOneTimeProducts() {
	const prices = await stripeClient.prices.list({
		active: true,
		type: 'one_time',
		expand: ['data.product'],
		limit: 100,
	});

	return prices.data
		.filter((price) => price.product && price.product.active)
		.map((price) => ({
			id: price.product.id,
			priceId: price.id,
			title: price.product.name,
			description: price.product.description ?? '',
			order: Number(price.product.metadata?.order ?? 0),
			price_in_cents: price.unit_amount,
			currency: price.currency,
			price_formatted: formatBrl(price.unit_amount),
		}))
		.sort((a, b) => a.order - b.order);
}

/**
 * Create a Stripe Checkout Session for a one-time (non-subscription) purchase.
 *
 * `area` and `subdivision` (what the customer picked on the AreaPage) travel in the
 * session metadata so the confirmed order knows which problem was bought, and which
 * Kit de Arranque to deliver.
 *
 * @param {{ userId: string, priceId: string, successUrl: string, cancelUrl: string, area?: string, subdivision?: string }} params
 * @returns {Promise<string>} Checkout URL to redirect the customer to.
 */
export async function createOneTimeCheckoutSession({ userId, priceId, successUrl, cancelUrl, area, subdivision }) {
	const customerId = await findOrCreateStripeCustomer({ userId });

	const session = await stripeClient.checkout.sessions.create({
		mode: 'payment',
		customer: customerId,
		line_items: [{ price: priceId, quantity: 1 }],
		success_url: successUrl,
		cancel_url: cancelUrl,
		metadata: {
			area: metadataValue(area),
			subdivision: metadataValue(subdivision),
		},
	});

	return session.url;
}

/**
 * Confirms a completed Checkout Session belongs to `userId` and records the order in
 * PocketBase (`consultoria_orders`) so an admin gets notified (via the collection's
 * `consultoria-orders-notifier` hook) and can follow up manually — there is no
 * ongoing subscription state to poll for a one-time purchase, so this confirm step
 * (called from the success page) is what persists the order, instead of a webhook.
 * Idempotent: re-confirming the same session returns the existing record.
 *
 * @param {{ userId: string, sessionId: string }} params
 * @returns {Promise<{ id: string, productTitle: string, amountFormatted: string, area: string, subdivision: string, kit: { title: string } | null }>}
 */
export async function confirmOneTimeOrder({ userId, sessionId }) {
	const storedCustomerId = await getStoredStripeCustomerId(userId);
	const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
		expand: ['line_items.data.price.product'],
	});

	if (session.payment_status !== 'paid' || session.customer !== storedCustomerId) {
		throw new Error('Order not found for this user');
	}

	const existing = await pocketbaseClient
		.collection('consultoria_orders')
		.getFirstListItem(pocketbaseClient.filter('stripe_session_id = {:sessionId}', { sessionId }))
		.catch(() => null);

	if (existing) {
		return mapOrder(existing);
	}

	const user = await pocketbaseClient.collection('users').getOne(userId);
	const lineItem = session.line_items.data[0];
	const product = lineItem.price.product;
	const subdivision = metadataValue(session.metadata?.subdivision);

	const record = await pocketbaseClient.collection('consultoria_orders').create({
		userId,
		email: user.email,
		product_title: typeof product === 'string' ? product : product.name,
		amount_in_cents: lineItem.amount_total,
		stripe_session_id: session.id,
		area: metadataValue(session.metadata?.area),
		subdivision,
		kit_slug: kitSlugFor(subdivision) ?? '',
	});

	return mapOrder(record);
}

function mapOrder(record) {
	const kit = getKit(record.kit_slug);
	return {
		id: record.id,
		productTitle: record.product_title,
		amountFormatted: formatBrl(record.amount_in_cents),
		area: record.area ?? '',
		subdivision: record.subdivision ?? '',
		kit: kit ? { title: kit.title } : null,
	};
}

/**
 * Lists the user's paid orders (newest first), each with its kit, if any.
 *
 * @param {{ userId: string }} params
 */
export async function listUserOrders({ userId }) {
	const records = await pocketbaseClient.collection('consultoria_orders').getFullList({
		filter: pocketbaseClient.filter('userId = {:userId}', { userId }),
		sort: '-created',
	});
	return records.map((record) => ({ ...mapOrder(record), created: record.created }));
}

/**
 * Returns the Kit de Arranque file for an order, only if the order belongs to `userId`.
 *
 * @param {{ userId: string, orderId: string }} params
 * @returns {Promise<{ title: string, filename: string, filePath: string }>}
 */
export async function getOrderKit({ userId, orderId }) {
	const notFound = Object.assign(new Error('Kit não encontrado para este pedido'), { status: 404 });
	const record = await pocketbaseClient.collection('consultoria_orders').getOne(orderId).catch(() => null);
	if (!record || record.userId !== userId) throw notFound;
	const kit = getKit(record.kit_slug);
	if (!kit) throw notFound;
	return kit;
}
