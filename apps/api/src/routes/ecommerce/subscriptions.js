import { Router } from 'express';
import { createCheckoutSession, createManageUserSubscriptionUrl, getUserSubscriptions } from '../../api/ecommerce-subscriptions.js';
import { liberarKit, statusCota } from '../../api/kit-quota.js';

const router = Router();

/**
 * Shape of `req.user` after your JWT middleware verifies the token and attaches the decoded payload
 * (e.g. `passport-jwt`, `express-jwt`, or `jwt.verify` then `req.user = payload`).
 *
 * @typedef {object} JwtUserPayload
 * @property {string} [sub] Standard JWT **subject** — commonly your application user id.
 * @property {string} [id] Some stacks put the user id here instead of (or in addition to) `sub`.
 */

/**
 * Returns the authenticated user id from the JWT payload on `req.user`.
 * Assumes an auth middleware has already run and rejected unauthenticated requests.
 *
 * @param {import('express').Request & { user?: JwtUserPayload }} req
 * @returns {string | null} `null` if no usable id claim is present.
 */
function getUserIdFromRequest(req) {
	const user = req.user;

	if (!user || typeof user !== 'object') {
		return null;
	}

	const fromSub = typeof user.sub === 'string' ? user.sub.trim() : '';
	
	if (fromSub) {
		return fromSub;
	}

	const fromId = typeof user.id === 'string' ? user.id.trim() : '';

	return fromId || null;
}

/**
 * Lists subscriptions for the resolved user (see {@link getUserIdFromRequest}).
 */
router.get('/', async (req, res) => {
	const userId = getUserIdFromRequest(req);

	if (!userId) {
		throw new Error('User ID is required');
	}

	const subscriptions = await getUserSubscriptions({ userId });

	return res.json({ subscriptions });
});

/**
 * Create and return the manage subscriptions URL for the resolved user (see {@link getUserIdFromRequest}).
 */
router.post('/manage', async (req, res) => {
	const { returnUrl, subscriptionId } = req.body;
	const userId = getUserIdFromRequest(req);

	if (!userId) {
		throw new Error('User ID is required');
	}

	if (typeof returnUrl !== 'string' || returnUrl.trim() === '' || typeof subscriptionId !== 'string' || subscriptionId.trim() === '') {
		throw new Error('Return URL and Subscription ID are required');
	}

	const url = await createManageUserSubscriptionUrl({ userId, returnUrl: returnUrl.trim() });

	return res.json({ url });
});

/**
 * Creates a Stripe Checkout session for the resolved user and returns its URL.
 */
router.post('/checkout', async (req, res) => {
	const { priceId, successUrl, cancelUrl } = req.body;
	const userId = getUserIdFromRequest(req);

	if (!userId) {
		throw new Error('User ID is required');
	}

	if (typeof priceId !== 'string' || priceId.trim() === '' || typeof successUrl !== 'string' || successUrl.trim() === '' || typeof cancelUrl !== 'string' || cancelUrl.trim() === '') {
		throw new Error('Price ID, success URL and cancel URL are required');
	}

	const url = await createCheckoutSession({
		userId,
		priceId: priceId.trim(),
		successUrl: successUrl.trim(),
		cancelUrl: cancelUrl.trim(),
	});

	return res.json({ url });
});

/**
 * Cota de Kits de Arranque do assinante no mês: plano, limite, usados e quais soluções já baixou.
 */
router.get('/kits', async (req, res) => {
	const userId = getUserIdFromRequest(req);

	if (!userId) {
		throw new Error('User ID is required');
	}

	return res.json(await statusCota({ userId }));
});

/**
 * Baixa o Kit de Arranque de uma solução usando a cota do mês do assinante.
 * 403 sem assinatura ativa, 404 sem kit, 429 com a cota esgotada.
 */
router.get('/kits/download', async (req, res) => {
	const userId = getUserIdFromRequest(req);
	const subdivision = typeof req.query.subdivision === 'string' ? req.query.subdivision.trim() : '';

	if (!userId) {
		throw new Error('User ID is required');
	}
	if (!subdivision) {
		return res.status(400).json({ error: 'Informe a solução (subdivision).' });
	}

	try {
		const { kit, status } = await liberarKit({ userId, subdivision });
		res.set('X-Cota-Usados', String(status.usados));
		res.set('X-Cota-Limite', String(status.limite));
		res.set('Access-Control-Expose-Headers', 'X-Cota-Usados, X-Cota-Limite, Content-Disposition');
		return res.download(kit.filePath, kit.filename);
	} catch (erro) {
		if ([403, 404, 429].includes(erro.status)) {
			return res.status(erro.status).json({ error: erro.message });
		}
		throw erro;
	}
});

export default router;
