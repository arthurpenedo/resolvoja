import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileSpreadsheet, Sparkles } from 'lucide-react';
import Reveal from '@/components/Reveal';
import TiltCard from '@/components/TiltCard';
import AuroraBackground from '@/components/AuroraBackground';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import SubscriptionAccountSection from '@/components/SubscriptionAccountSection.jsx';
import { AREAS, getAreaGradient } from '@/data/hub';
import { useAuth } from '@/contexts/AuthContext';
import { pocketbaseClient } from '@/lib/pocketbaseClient';
import { getMyOrders } from '@/api/InternalEcommerceProductsApi';
import KitDownloadButton from '@/components/KitDownloadButton';

const STATUS_CONFIG = {
    aguardando: { label: 'Em análise', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
    em_desenvolvimento: { label: 'Em desenvolvimento', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
    entregue: { label: 'Entregue', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [params] = useSearchParams();
    const justBought = params.get('compra') === '1';
    const [briefings, setBriefings] = useState([]);
    const [briefingsLoading, setBriefingsLoading] = useState(true);
    const [kitOrders, setKitOrders] = useState([]);

    let lastSolution = null;
    try {
        lastSolution = JSON.parse(sessionStorage.getItem('ultimaSolucao') || 'null');
    } catch {
        lastSolution = null;
    }

    useEffect(() => {
        pocketbaseClient.collection('briefings').getFullList({ sort: '-created' })
            .then(setBriefings)
            .catch(() => setBriefings([]))
            .finally(() => setBriefingsLoading(false));
        getMyOrders()
            .then(({ orders }) => setKitOrders(orders.filter((o) => o.kit)))
            .catch(() => setKitOrders([]));
    }, []);

    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
            <Helmet>
                <title>Meu painel — Resolvo Já</title>
                <meta name="description" content="Acompanhe sua assinatura, suas soluções compradas e continue explorando as áreas do Resolvo Já." />
            </Helmet>
            <SiteHeader />

            <main className="relative overflow-hidden">
                <AuroraBackground variant="cool" />
                <div className="relative mx-auto max-w-[72rem] px-5 py-16 sm:px-8">
                    <Reveal>
                        <h1 className="font-display text-4xl font-semibold tracking-tight">
                            Olá, <span className="text-gradient-aurora">{user?.name || user?.email || 'empreendedor'}</span>
                        </h1>
                        <p className="mt-3 text-[hsl(var(--muted-foreground))]">Sua assinatura, seus pedidos e o atalho para gerar novas soluções.</p>
                    </Reveal>

                    {justBought && (
                        <Reveal delay={0.08}>
                            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.08)] p-6 shadow-3d">
                                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[hsl(var(--primary))]" />
                                <div>
                                    <p className="font-semibold">Compra confirmada</p>
                                    <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                                        {lastSolution?.subdivision
                                            ? `Sua solução completa de "${lastSolution.subdivision}" (${lastSolution.area}) está sendo montada e chega no seu e-mail.`
                                            : 'Sua solução completa está sendo montada e chega no seu e-mail.'}
                                    </p>
                                </div>
                            </div>
                        </Reveal>
                    )}

                    <div className="mt-10 grid gap-6 lg:grid-cols-2">
                        <Reveal delay={0.1}>
                            <SubscriptionAccountSection className="rounded-3xl border border-white/10 glass-strong p-7 shadow-3d" />
                        </Reveal>

                        <Reveal delay={0.16}>
                            <section className="relative overflow-hidden rounded-3xl border border-white/10 glass p-7 shadow-3d">
                                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-orange-pink opacity-30 blur-3xl" aria-hidden="true" />
                                <h2 className="relative font-display text-xl font-semibold">Compras avulsas</h2>
                                <p className="relative mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                                    Cada solução completa comprada é entregue por e-mail com documento, modelos e plano de implementação.
                                </p>
                                <Link
                                    to="/plans"
                                    className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
                                >
                                    Comparar com os planos <ArrowRight className="h-4 w-4" />
                                </Link>
                            </section>
                        </Reveal>
                    </div>

                    {kitOrders.length > 0 && (
                        <section className="mt-12">
                            <Reveal>
                                <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                                    <FileSpreadsheet className="h-5 w-5 text-[hsl(var(--primary))]" /> Meus Kits de Arranque
                                </h2>
                                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                                    Planilhas prontas para você começar enquanto a equipe monta a solução completa.
                                </p>
                            </Reveal>
                            <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 glass">
                                {kitOrders.map((o) => (
                                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                                        <div className="min-w-0">
                                            <p className="font-semibold">{o.kit.title}</p>
                                            <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                                                {o.subdivision} · comprado em {new Date(o.created).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <KitDownloadButton orderId={o.id} label="Baixar planilha" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Meus pedidos */}
                    <section className="mt-12">
                        <Reveal>
                            <h2 className="font-display text-2xl font-semibold">Meus pedidos</h2>
                        </Reveal>
                        {briefingsLoading && (
                            <div className="mt-4 h-20 animate-pulse rounded-2xl border border-white/10 bg-[hsl(var(--card))]" />
                        )}
                        {!briefingsLoading && briefings.length === 0 && (
                            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
                                Você ainda não gerou nenhuma prévia.{' '}
                                <Link to="/" className="font-semibold text-gradient-aurora">Explorar as áreas</Link>
                            </p>
                        )}
                        {briefings.length > 0 && (
                            <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 glass">
                                {briefings.map((b) => {
                                    const st = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.aguardando;
                                    return (
                                        <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                                            <div className="min-w-0">
                                                <p className="font-semibold">{b.subdivisao}</p>
                                                <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                                                    {b.area_nome} · {new Date(b.created).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${st.color}`}>
                                                {st.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="mt-12">
                        <Reveal>
                            <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                                <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" /> Continuar resolvendo
                            </h2>
                        </Reveal>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {AREAS.map((a, i) => {
                                const g = getAreaGradient(a.id);
                                return (
                                    <Reveal key={a.id} delay={i * 0.04}>
                                        <TiltCard intensity={8} className="h-full">
                                            <Link
                                                to={`/area/${a.id}`}
                                                className="group flex h-full items-center gap-3 rounded-2xl border border-white/10 glass p-5 text-sm transition-colors hover:border-white/25"
                                            >
                                                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${g.gradient} text-lg shadow-3d`} aria-hidden="true">{a.icon}</span>
                                                <span className="font-semibold">{a.name}</span>
                                            </Link>
                                        </TiltCard>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
