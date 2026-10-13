import React, { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadSubscriberKit, getKitQuota } from '@/api/InternalKitQuotaApi';
import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';

const ATIVA = new Set(['active', 'trialing']);

/**
 * Para assinantes (Essencial/Pro): baixa a solução completa da subdivisão usando a cota do mês,
 * mostrando quantas já foram usadas. Para quem não assina, não renderiza nada (aparece a compra avulsa).
 */
export default function SubscriberKitButton({ subdivision }) {
	const { subscriptions } = useSubscriptionAuth();
	const assinante = subscriptions.some((s) => s && ATIVA.has(s.status));
	const [cota, setCota] = useState(null);
	const [loading, setLoading] = useState(false);
	const [erro, setErro] = useState(null);

	useEffect(() => {
		if (!assinante) return;
		getKitQuota().then(setCota).catch(() => setCota(null));
	}, [assinante]);

	if (!assinante || !cota?.plano) return null;

	const jaBaixou = cota.subdivisoes.includes(subdivision);
	const esgotou = !jaBaixou && cota.usados >= cota.limite;

	const baixar = async () => {
		setErro(null);
		setLoading(true);
		try {
			await downloadSubscriberKit({ subdivision });
			setCota(await getKitQuota());
		} catch (e) {
			setErro(e.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="sm:col-span-2 rounded-xl border border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5 p-4">
			<p className="text-sm font-semibold">Incluído no seu plano {cota.plano}</p>
			<p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
				{jaBaixou
					? 'Você já pegou esta solução este mês: baixar de novo não gasta cota.'
					: `${cota.usados} de ${cota.limite} soluções usadas este mês.`}
			</p>
			<button
				type="button"
				onClick={baixar}
				disabled={loading || esgotou}
				className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
			>
				{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
				{loading ? 'Preparando…' : esgotou ? 'Cota do mês esgotada' : 'Baixar a solução completa'}
			</button>
			{esgotou && (
				<p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">A cota renova no dia 1º. Se precisar antes, compre esta solução avulsa.</p>
			)}
			{erro && <p className="mt-2 text-sm text-[hsl(var(--destructive))]" role="alert">{erro}</p>}
		</div>
	);
}
