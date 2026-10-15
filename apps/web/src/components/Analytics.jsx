import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Google Analytics 4 com consentimento (LGPD): o script do Google só carrega depois que a pessoa
 * aceita os cookies de medição. Sem `VITE_GA_ID` no build, não mostra aviso nem carrega nada.
 * A escolha fica no localStorage; quem recusou não é rastreado.
 */
const GA_ID = import.meta.env.VITE_GA_ID;
const CHAVE = 'resolvoja_cookies';

function lerEscolha() {
	try {
		return localStorage.getItem(CHAVE);
	} catch {
		return null;
	}
}

function salvarEscolha(valor) {
	try {
		localStorage.setItem(CHAVE, valor);
	} catch {
		// navegação privada: a escolha vale só para esta visita
	}
}

function carregarGtag() {
	if (window.gtag) return;
	window.dataLayer = window.dataLayer || [];
	window.gtag = function gtag() {
		window.dataLayer.push(arguments);
	};
	window.gtag('js', new Date());
	// As trocas de rota da SPA viram page_view pela "métrica otimizada" do GA4 (eventos de histórico)
	window.gtag('config', GA_ID);
	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
	document.head.appendChild(script);
}

export default function Analytics() {
	const [escolha, setEscolha] = useState(lerEscolha);

	useEffect(() => {
		if (GA_ID && escolha === 'aceito') carregarGtag();
	}, [escolha]);

	if (!GA_ID || escolha) return null;

	const decidir = (valor) => {
		salvarEscolha(valor);
		setEscolha(valor);
	};

	return (
		<div
			role="region"
			aria-label="Aviso de cookies"
			className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 p-4 backdrop-blur sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-md sm:rounded-xl sm:border"
		>
			<p className="text-sm text-[hsl(var(--muted-foreground))]">
				Usamos cookies do Google Analytics para entender como o site é usado e melhorá-lo. Nada é
				coletado sem o seu aceite. Saiba mais na{' '}
				<Link to="/privacidade" className="underline hover:text-foreground">política de privacidade</Link>.
			</p>
			<div className="mt-3 flex gap-2">
				<button
					type="button"
					onClick={() => decidir('aceito')}
					className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90"
				>
					Aceitar
				</button>
				<button
					type="button"
					onClick={() => decidir('recusado')}
					className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-[hsl(var(--muted))]"
				>
					Recusar
				</button>
			</div>
		</div>
	);
}
