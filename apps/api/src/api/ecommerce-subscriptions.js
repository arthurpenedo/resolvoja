import stripeClient from '../utils/stripe.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';

/**
 * @typedef {'daily' | 'weekly' | 'monthly' | 'yearly'} EcommerceBillingInterval
 */

/**
 * @typedef {'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused'} EcommerceSubscriptionStatus
 */

/**
 * Subscription data mapped from Stripe into the shape the frontend already expects.
 *
 * @typedef {object} EcommerceSubscription
 * @property {string} id - Subscription ID.
 * @property {string} product_id - Stripe product id.
 * @property {string} product_title - Stripe product name.
 * @property {string} variant_title - Human-readable billing period ("Mensal" / "Anual").
 * @property {EcommerceBillingInterval} billing_interval - Subscription billing interval.
 * @property {EcommerceSubscriptionStatus} status - Subscription status.
 * @property {string} current_period_start - Subscription current period start date.
 * @property {string} current_period_end - Subscription current period end date.
 */

const INTERVAL_TO_VARIANT_TITLE = {
	month: 'Mensal',
	year: 'Anual',
	week: 'Semanal',
	day: 'Diário',
};

const INTERVAL_TO_BILLING_INTERVAL = {
	month: 'monthly',
	year: 'yearly',
	week: 'weekly',
	day: 'daily',
};

/**
 * Maps a Stripe subscription (with `items.data.price` expanded) into the frontend shape,
 * fetching the product separately since Stripe caps `expand` at 4 levels and
 * `data.items.data.price.product` on a list call would be a 5th.
 */
async function mapSubscription(subscription) {
	const item = subscription.items.data[0];
	const price = item.price;
	const product = typeof price.product === 'string'
		? await stripeClient.products.retrieve(price.product)
		: price.product;

	return {
		id: subscription.id,
		product_id: product.id,
		product_title: product.name,
		variant_title: INTERVAL_TO_VARIANT_TITLE[price.recurring?.interval] ?? price.recurring?.interval,
		billing_interval: INTERVAL_TO_BILLING_INTERVAL[price.recurring?.interval] ?? price.recurring?.interval,
		status: subscription.status,
		current_period_start: new Date(item.current_period_start * 1000).toISOString(),
		current_period_end: new Date(item.current_period_end * 1000).toISOString(),
	};
}

/**
 * @param {string} userId PocketBase `users` record id.
 * @returns {Promise<string|null>} Stripe customer id already stored on the user, or null.
 */
export async function getStoredStripeCustomerId(userId) {
	const user = await pocketbaseClient.collection('users').getOne(userId);

	return user.stripe_customer_id || null;
}

/**
 * Finds or creates the Stripe customer for a PocketBase user, persisting the id back
 * onto the user record so future lookups don't need to hit Stripe's customer search.
 *
 * @param {{ userId: string }} params
 * @returns {Promise<string>} Stripe customer id.
 */
export async function findOrCreateStripeCustomer({ userId }) {
	const user = await pocketbaseClient.collection('users').getOne(userId);

	if (user.stripe_customer_id) {
		return user.stripe_customer_id;
	}

	const customer = await stripeClient.customers.create({
		email: user.email,
		metadata: { pocketbase_user_id: userId },
	});

	await pocketbaseClient.collection('users').update(userId, {
		stripe_customer_id: customer.id,
	});

	return customer.id;
}

/**
 * Returns the subscriptions for a given user, reading live from Stripe.
 *
 * @param {{ userId: string }} params
 * @returns {Promise<EcommerceSubscription[]>}
 */
export async function getUserSubscriptions({ userId }) {
	const customerId = await getStoredStripeCustomerId(userId);

	if (!customerId) {
		return [];
	}

	const subscriptions = await stripeClient.subscriptions.list({
		customer: customerId,
		status: 'all',
		expand: ['data.items.data.price'],
	});

	return Promise.all(subscriptions.data.map(mapSubscription));
}

/**
 * Create and return the Stripe billing portal URL for a given user.
 *
 * @param {{ userId: string, returnUrl: string }} params
 * @returns {Promise<string>} The manage subscriptions URL.
 */
export async function createManageUserSubscriptionUrl({ userId, returnUrl }) {
	const customerId = await getStoredStripeCustomerId(userId);

	if (!customerId) {
		throw new Error('No Stripe customer found for this user');
	}

	const session = await stripeClient.billingPortal.sessions.create({
		customer: customerId,
		return_url: returnUrl,
	});

	return session.url;
}

/**
 * Create a Stripe Checkout Session for a subscription price.
 *
 * @param {{ userId: string, priceId: string, successUrl: string, cancelUrl: string }} params
 * @returns {Promise<string>} Checkout URL to redirect the customer to.
 */
export async function createCheckoutSession({ userId, priceId, successUrl, cancelUrl }) {
	const customerId = await findOrCreateStripeCustomer({ userId });

	const session = await stripeClient.checkout.sessions.create({
		mode: 'subscription',
		// campo "Adicionar código promocional" no checkout do Stripe (cupons criados no painel do Stripe)
		allow_promotion_codes: true,
		customer: customerId,
		line_items: [{ price: priceId, quantity: 1 }],
		success_url: successUrl,
		cancel_url: cancelUrl,
	});

	return session.url;
}

/**
 * Lists active subscription plans (Stripe products + recurring prices), formatted for
 * `PlansList.jsx` / `PlanCard` (same shape the Hostinger catalog used to return).
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   title: string,
 *   description: string,
 *   variants: Array<{ id: string, title: string, price_in_cents: number, currency: string, price_formatted: string, sale_price_in_cents: number|null, sale_price_formatted: string|null }>,
 * }>>}
 */
export async function listPlans() {
	const prices = await stripeClient.prices.list({
		active: true,
		type: 'recurring',
		expand: ['data.product'],
		limit: 100,
	});

	const productsById = new Map();

	for (const price of prices.data) {
		const product = price.product;

		if (!product || !product.active) {
			continue;
		}

		if (!productsById.has(product.id)) {
			productsById.set(product.id, {
				id: product.id,
				title: product.name,
				description: product.description ?? '',
				order: Number(product.metadata?.order ?? 0),
				variants: [],
			});
		}

		const compareAtAmount = price.metadata?.compare_at_amount
			? Number(price.metadata.compare_at_amount)
			: null;

		productsById.get(product.id).variants.push({
			id: price.id,
			title: INTERVAL_TO_VARIANT_TITLE[price.recurring?.interval] ?? price.recurring?.interval,
			price_in_cents: compareAtAmount ?? price.unit_amount,
			currency: price.currency,
			price_formatted: formatBrl(compareAtAmount ?? price.unit_amount),
			sale_price_in_cents: compareAtAmount ? price.unit_amount : null,
			sale_price_formatted: compareAtAmount ? formatBrl(price.unit_amount) : null,
		});
	}

	// Mensal antes de Anual em todo plano (a primeira variante é a que aparece selecionada por padrão)
	const ORDEM_PERIODO = { Mensal: 0, Anual: 1 };
	for (const plan of productsById.values()) {
		plan.variants.sort((a, b) => (ORDEM_PERIODO[a.title] ?? 9) - (ORDEM_PERIODO[b.title] ?? 9));
	}
	return [...productsById.values()].sort((a, b) => a.order - b.order);
}

export function formatBrl(amountInCents) {
	return `R$${(amountInCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
