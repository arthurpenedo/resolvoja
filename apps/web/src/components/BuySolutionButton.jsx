import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOneTimeProducts } from '@/hooks/useOneTimeProducts';
import { createOneTimeCheckout } from '@/api/InternalEcommerceProductsApi';
import { useAuth } from '@/contexts/AuthContext';

const ONE_OFF_TITLE = 'Solução completa avulsa';

export default function BuySolutionButton({ context, className }) {
    const { products, loading: productsLoading } = useOneTimeProducts();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isAuthed } = useAuth();
    const navigate = useNavigate();

    const product = products.find((p) => p.title === ONE_OFF_TITLE) ?? products[0] ?? null;

    const handleClick = async () => {
        if (!isAuthed) {
            navigate('/login');
            return;
        }
        if (!product) return;
        setError(null);
        setLoading(true);
        try {
            const { url } = await createOneTimeCheckout({
                priceId: product.priceId,
                successUrl: `${window.location.origin}/consultoria/obrigado?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: window.location.href,
                area: context?.area,
                subdivision: context?.subdivision,
            });
            sessionStorage.setItem('ultimaSolucao', JSON.stringify(context ?? {}));
            window.location = url;
        } catch {
            setError('Não foi possível iniciar o checkout. Tente novamente.');
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleClick}
                disabled={loading || productsLoading || !product}
                className={className ?? 'w-full rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-60'}
            >
                {loading ? 'Redirecionando…' : product ? `Comprar solução completa — ${product.price_formatted}` : 'Carregando preço…'}
            </button>
            {error && <p className="mt-2 text-sm text-[hsl(var(--destructive))]" role="alert">{error}</p>}
        </div>
    );
}
