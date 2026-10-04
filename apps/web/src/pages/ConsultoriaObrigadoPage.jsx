import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { confirmOneTimeOrder } from '@/api/InternalEcommerceProductsApi';
import KitDownloadButton from '@/components/KitDownloadButton';

/**
 * Post-checkout landing for the Consultoria (one-time) purchase. Stripe redirects here
 * with `?session_id=` after payment; this page confirms the session with the backend
 * (which records the order and triggers the admin-notification email) and shows what
 * was purchased. There is no ongoing "active" state to poll for like a subscription —
 * a paid Consultoria is a single event, not an ongoing plan.
 */
export default function ConsultoriaObrigadoPage() {
	const [searchParams] = useSearchParams();
	const sessionId = searchParams.get('session_id');
	const [status, setStatus] = useState('loading');
	const [order, setOrder] = useState(null);

	useEffect(() => {
		if (!sessionId) {
			setStatus('error');
			return;
		}
		confirmOneTimeOrder({ sessionId })
			.then((data) => {
				setOrder(data?.order ?? null);
				setStatus('success');
			})
			.catch((err) => {
				console.error('Failed to confirm order', err);
				setStatus('error');
			});
	}, [sessionId]);

	return (
		<div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
			<Helmet>
				<title>Consultoria contratada — Resolvo Já</title>
			</Helmet>
			<SiteHeader />

			<main className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
				{status === 'loading' && <p className="text-muted-foreground">Confirmando seu pagamento…</p>}

				{status === 'success' && (
					<>
						<h1 className="font-display text-3xl font-semibold">Compra confirmada!</h1>
						<p className="mt-4 text-[hsl(var(--muted-foreground))]">
							{order ? `Pagamento de ${order.amountFormatted} confirmado para ${order.productTitle}${order.subdivision ? ` (${order.subdivision})` : ''}.` : 'Pagamento confirmado.'}
							{' '}Nossa equipe vai entrar em contato em breve para montar a solução completa.
						</p>
						{order?.kit && (
							<div className="mt-8 rounded-2xl border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.08)] p-6 text-left">
								<p className="font-semibold">Comece agora: seu Kit de Arranque está pronto</p>
								<p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
									Uma planilha pronta para usar enquanto preparamos a sua solução completa, com passo a passo, fórmulas e painel.
									Abre no Excel, no Google Sheets e no LibreOffice. Ela também fica disponível no seu painel.
								</p>
								<div className="mt-4">
									<KitDownloadButton orderId={order.id} />
								</div>
							</div>
						)}
						<Link to="/painel" className="mt-8 inline-block rounded-md bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90">
							Ir para meu painel
						</Link>
					</>
				)}

				{status === 'error' && (
					<>
						<h1 className="font-display text-3xl font-semibold">Não conseguimos confirmar o pagamento</h1>
						<p className="mt-4 text-[hsl(var(--muted-foreground))]">
							Se o valor foi cobrado, entre em contato com a gente pelo e-mail contato@resolvoja.com que resolvemos.
						</p>
					</>
				)}
			</main>

			<SiteFooter />
		</div>
	);
}
