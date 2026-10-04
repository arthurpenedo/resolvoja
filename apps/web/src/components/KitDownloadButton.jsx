import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadOrderKit } from '@/api/InternalEcommerceProductsApi';

/** Baixa a planilha do Kit de Arranque de um pedido pago. */
export default function KitDownloadButton({ orderId, label = 'Baixar meu Kit de Arranque', className }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleClick = async () => {
        setError(null);
        setLoading(true);
        try {
            await downloadOrderKit({ orderId });
        } catch {
            setError('Não foi possível baixar agora. Tente de novo em instantes.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleClick}
                disabled={loading}
                className={className ?? 'inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-60'}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {loading ? 'Preparando…' : label}
            </button>
            {error && <p className="mt-2 text-sm text-[hsl(var(--destructive))]" role="alert">{error}</p>}
        </div>
    );
}
