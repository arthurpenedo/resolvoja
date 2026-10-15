import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useOneTimeProducts } from '@/hooks/useOneTimeProducts';
import { createOneTimeCheckout } from '@/api/InternalEcommerceProductsApi';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';
import { LOGIN_PATH } from '@/config/subscriptionRoutes.js';

/**
 * Benefícios de cada oferta, pelo nome do produto no Stripe (o preço vem do Stripe; o texto, daqui).
 * Para mudar um preço, mude no Stripe; para mudar o texto, mude aqui.
 */
export const BENEFICIOS = {
	Consultoria: ['Conversa direta com um especialista', 'Foco no desafio específico da sua empresa', 'Pagamento único, sem assinatura'],
	'Solução completa avulsa': ['1 solução completa', 'Documento estruturado, modelos e planilhas editáveis', 'POPs quando aplicável', 'Plano de implementação passo a passo'],
	Essencial: ['3 soluções completas por mês', 'Documento estruturado, modelos e planilhas editáveis', 'POPs e plano de implementação passo a passo', 'Todas as áreas do seu negócio'],
	Pro: ['8 soluções completas por mês', 'Atendimento prioritário na fila', '1 sessão de 30 min com especialista por trimestre', 'Tudo o que está no Essencial'],
};

export const PLANO_RECOMENDADO = 'Essencial';

export function ListaBeneficios({ titulo }) {
	const itens = BENEFICIOS[titulo] ?? [];
	if (!itens.length) return null;
	return (
		<ul className="mb-6 space-y-2 text-sm">
			{itens.map((item) => (
				<li key={item} className="flex items-start gap-2">
					<Check className="mt-0.5 h-4 w-4 flex-none text-[hsl(var(--primary))]" aria-hidden="true" />
					<span>{item}</span>
				</li>
			))}
		</ul>
	);
}

function useCheckoutAvulso(product, successPath) {
	const [loading, setLoading] = useState(false);
	const [erro, setErro] = useState(null);
	const { isAuthenticated } = useSubscriptionAuth();
	const navigate = useNavigate();

	const comprar = async () => {
		if (!isAuthenticated) {
			navigate(LOGIN_PATH);
			return;
		}
		setErro(null);
		setLoading(true);
		try {
			const { url } = await createOneTimeCheckout({
				priceId: product.priceId,
				successUrl: window.location.origin + successPath,
				cancelUrl: window.location.href,
			});
			window.location = url;
		} catch (err) {
			console.error('Checkout failed', err);
			setLoading(false);
			setErro('Não foi possível iniciar o pagamento. Tente novamente.');
		}
	};
	return { comprar, loading, erro };
}

/** Consultoria em destaque, no topo da página (o foco do negócio: atendimento humano). */
export function ConsultoriaDestaque() {
	const { products, loading, error } = useOneTimeProducts();
	const consultoria = products.find((p) => p.title === 'Consultoria');
	const { comprar, loading: redirecionando, erro } = useCheckoutAvulso(
		consultoria ?? {}, '/consultoria/obrigado?session_id={CHECKOUT_SESSION_ID}',
	);

	if (loading) return <div className="h-48 animate-pulse rounded-2xl border bg-card" />;
	if (error || !consultoria) return null;

	return (
		<div className="relative rounded-2xl border-2 border-[hsl(var(--primary))] bg-card p-6 shadow-[0_0_60px_-20px_hsl(var(--primary))] sm:p-8">
			<span className="absolute -top-4 left-6 rounded-full bg-[hsl(var(--primary))] px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-[hsl(var(--primary-foreground))] sm:text-base">
				Atendimento humano
			</span>
			<div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
				<div>
					<h2 className="font-display text-2xl font-semibold">{consultoria.title}</h2>
					<p className="mt-2 mb-4 text-[hsl(var(--muted-foreground))]">
						{consultoria.description || 'Sem IA no meio: um especialista te ouve e dá sugestões direto, num papo avulso sobre o desafio da sua empresa.'}
					</p>
					<ListaBeneficios titulo="Consultoria" />
				</div>
				<div className="md:min-w-[16rem]">
					<p className="mb-4 text-4xl font-bold">
						{consultoria.price_formatted}
						<span className="text-sm font-normal text-[hsl(var(--muted-foreground))]"> avulso</span>
					</p>
					<button
						type="button"
						onClick={comprar}
						disabled={redirecionando}
						className="w-full rounded-md bg-[hsl(var(--primary))] px-4 py-3 font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-60"
					>
						{redirecionando ? 'Redirecionando…' : 'Falar com um especialista'}
					</button>
					{erro && <p className="mt-2 text-sm text-destructive" role="alert">{erro}</p>}
				</div>
			</div>
		</div>
	);
}

/** Solução avulsa: a compra acontece depois da prévia, então o botão leva para descrever o problema. */
export function AvulsaCard() {
	const { products, loading, error } = useOneTimeProducts();
	const avulsa = products.find((p) => p.title === 'Solução completa avulsa');

	if (loading) return <div className="h-64 animate-pulse rounded-lg border bg-card" />;
	if (error || !avulsa) return null;

	return (
		<div className="flex flex-col rounded-lg border bg-card p-6">
			<h3 className="mb-2 text-xl font-semibold">{avulsa.title}</h3>
			<p className="mb-4 text-[hsl(var(--muted-foreground))]">Para resolver um problema sem assinar nada.</p>
			<p className="mb-6 text-3xl font-bold">
				{avulsa.price_formatted}
				<span className="text-sm font-normal text-[hsl(var(--muted-foreground))]"> avulso</span>
			</p>
			<ListaBeneficios titulo="Solução completa avulsa" />
			<Link
				to="/#areas"
				className="mt-auto block w-full rounded-md border border-[hsl(var(--primary))] px-4 py-2 text-center font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10"
			>
				Descrever meu problema
			</Link>
		</div>
	);
}

/** Alterna mensal/anual em todos os planos de uma vez. Só aparece se algum plano tiver as duas opções. */
export function SeletorPeriodo({ periodo, onChange, temAnual }) {
	if (!temAnual) return null;
	const opcoes = [
		['Mensal', 'Mensal'],
		['Anual', 'Anual · 2 meses grátis'],
	];
	return (
		<div className="inline-flex gap-1 rounded-full border bg-card p-1" role="group" aria-label="Período de cobrança">
			{opcoes.map(([valor, rotulo]) => (
				<button
					key={valor}
					type="button"
					onClick={() => onChange(valor)}
					aria-pressed={periodo === valor}
					className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
						periodo === valor ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:text-foreground'
					}`}
				>
					{rotulo}
				</button>
			))}
		</div>
	);
}
