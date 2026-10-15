import React, { useState } from 'react';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';
import { useEcommerceSubscriptionsPlans } from '@/hooks/useEcommerceSubscriptionsPlans';
import SubscribeButton from './SubscribeButton.jsx';
import ManageSubscriptionButton from './ManageSubscriptionButton.jsx';
import { ListaBeneficios, PLANO_RECOMENDADO } from './PricingCards.jsx';

/**
 * Shipped pricing grid: loads plans via {@link useEcommerceSubscriptionsPlans} and renders one
 * card per plan with a {@link SubscribeButton}. For authenticated users with an active/trialing
 * subscription, the card whose `plan.id` matches the user's subscription shows a "Current plan"
 * badge and a {@link ManageSubscriptionButton} instead of Subscribe — so subscribed visitors on
 * /plans see their tier highlighted and have a direct path to the manage portal.
 *
 * Post-checkout polling (after the user returns from Ecommerce API, typically to /plans) is handled by
 * {@link SubscriptionAuthProvider} — when the `subscriptionPending` sessionStorage flag is set
 * by SubscribeButton, the provider refreshes subscriptions every 2s until the new one lands.
 * PlansList just re-renders when `subscriptions` updates and the Subscribe → Manage swap fires.
 *
 * Usage (pricing / plans page — prefer this over hand-rolling the hook):
 *   import PlansList from '@/components/PlansList.jsx';
 *   <PlansList /> // optional className for the grid wrapper
 *
 * Agents may restyle layout and copy; keep `useEcommerceSubscriptionsPlans`,
 * the `SubscribeButton plan/variant` wiring, and the Subscribe→Manage swap on the active-tier card.
 *
 * `periodo` ('Mensal' | 'Anual') escolhe a variante de todos os cartões de uma vez (seletor no topo da página);
 * `antes` é renderizado como primeiro item da grade (ex.: a solução avulsa).
 *
 * @param {{ className?: string, periodo?: string, antes?: React.ReactNode }} props
 */
export default function PlansList({ className, periodo, antes }) {
	const { plans, loading, error } = useEcommerceSubscriptionsPlans();
	const { subscriptions, polling } = useSubscriptionAuth();

	if (loading) {
		return (
			<div className={className ?? 'grid gap-6 md:grid-cols-3'}>
				{[0, 1, 2].map((i) => (
					<div key={i} className="rounded-lg border bg-card p-6 h-64 animate-pulse" />
				))}
			</div>
		);
	}

	if (error) {
		return <p className="text-destructive">Não foi possível carregar os planos. Recarregue a página.</p>;
	}

	if (!plans.length) {
		return <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>;
	}

	return (
		<>
			{polling && (
				<div className="mb-6 flex items-center gap-3 rounded-lg border bg-card p-4">
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					<p className="text-sm text-muted-foreground">Atualizando sua assinatura…</p>
				</div>
			)}
			<div className={className ?? 'grid gap-6 md:grid-cols-3'}>
				{antes}
				{plans.map((plan) => (
					<PlanCard
						key={plan.id}
						plan={plan}
						subscriptions={subscriptions}
						periodo={periodo}
					/>
				))}
			</div>
		</>
	);
}

const brl = (centavos) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Anual: 12 mensalidades riscadas ao lado do preço anual, e quanto isso dá por mês (mostra a economia). */
function PrecoAnual({ anual, mensal }) {
	const precoAnual = anual.sale_price_in_cents ?? anual.price_in_cents;
	const precoMensal = mensal.sale_price_in_cents ?? mensal.price_in_cents;
	const dozeMeses = precoMensal * 12;
	return (
		<div className="mb-6">
			{dozeMeses > precoAnual && (
				<p className="text-sm text-muted-foreground">
					De <span className="line-through">{brl(dozeMeses)}</span> por
				</p>
			)}
			<p className="text-3xl font-bold">
				{anual.sale_price_formatted ?? anual.price_formatted}
				<span className="text-sm font-normal text-muted-foreground"> / ano</span>
			</p>
			<p className="mt-1 text-sm font-medium text-[hsl(var(--primary))]">
				Equivale a {brl(Math.round(precoAnual / 12))} por mês
			</p>
		</div>
	);
}

function PlanCard({ plan, subscriptions, periodo }) {
	const variants = plan.variants ?? [];
	const [escolhida, setSelectedVariant] = useState(variants[0]);
	// com seletor global, a variante segue o período; se o plano não tiver aquele período, fica na primeira
	const selectedVariant = periodo ? (variants.find((v) => v.title === periodo) ?? variants[0]) : escolhida;
	const recomendado = plan.title === PLANO_RECOMENDADO;
	const isCurrentPlan = subscriptions.some(
		(subscription) => subscription && subscription.product_id === plan.id && (subscription.status === 'active' || subscription.status === 'trialing'),
	);
	const hasAnyActiveSub = subscriptions.some(
		(subscription) => subscription && (subscription.status === 'active' || subscription.status === 'trialing'),
	);
	const isLocked = hasAnyActiveSub && !isCurrentPlan;

	return (
		<div className={`relative rounded-lg border bg-card p-6 flex flex-col ${recomendado ? 'border-[hsl(var(--primary))]' : ''} ${isLocked ? 'opacity-60' : ''}`}>
			{recomendado && (
				<span className="absolute -top-3 left-6 rounded-full bg-[hsl(var(--primary))] px-3 py-1 text-xs font-semibold text-[hsl(var(--primary-foreground))]">
					Recomendado
				</span>
			)}
			<div className="flex items-start justify-between gap-2 mb-2">
				<h3 className="text-xl font-semibold">{plan.title}</h3>
				{isCurrentPlan && (
					<span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-1 text-xs font-semibold uppercase tracking-wide">
						Seu plano
					</span>
				)}
			</div>
			{plan.description && (
				<p className="text-muted-foreground mb-4">{plan.description}</p>
			)}
			{!periodo && variants.length > 1 && (
				<div className="mb-4 inline-flex rounded-lg border bg-background p-1 gap-1 self-start">
					{variants.map((variant) => (
						<button
							key={variant.id}
							type="button"
							onClick={() => setSelectedVariant(variant)}
							className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
								selectedVariant?.id === variant.id
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:bg-muted'
							}`}
						>
							{variant.title}
						</button>
					))}
				</div>
			)}
			{selectedVariant && selectedVariant.title === 'Anual' && variants.some((v) => v.title === 'Mensal') ? (
				<PrecoAnual anual={selectedVariant} mensal={variants.find((v) => v.title === 'Mensal')} />
			) : selectedVariant && (
				<p className="text-3xl font-bold mb-6">
					{selectedVariant.sale_price_in_cents != null && (
						<span className="mr-2 text-xl font-normal text-muted-foreground line-through">
							{selectedVariant.price_formatted}
						</span>
					)}
					{selectedVariant.sale_price_in_cents != null
						? selectedVariant.sale_price_formatted
						: selectedVariant.price_formatted}
					<span className="text-sm font-normal text-muted-foreground"> / {selectedVariant.title}</span>
				</p>
			)}
			<ListaBeneficios titulo={plan.title} />
			<div className="mt-auto">
				{selectedVariant && (
					isCurrentPlan ? (
						<ManageSubscriptionButton />
					) : isLocked ? (
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Troque de plano pelo portal de gerenciamento da assinatura.</p>
							<ManageSubscriptionButton />
						</div>
					) : (
						<SubscribeButton plan={plan} variant={selectedVariant} />
					)
				)}
			</div>
		</div>
	);
}
