import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Reveal from '@/components/Reveal';
import AuroraBackground from '@/components/AuroraBackground';
import PlansList from '@/components/PlansList.jsx';
import { AvulsaCard, ConsultoriaDestaque, SeletorPeriodo } from '@/components/PricingCards.jsx';
import { useEcommerceSubscriptionsPlans } from '@/hooks/useEcommerceSubscriptionsPlans';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

const faqs = [
    { q: 'Posso comprar só uma solução?', a: 'Sim. Depois da prévia você pode comprar a solução completa avulsa, sem assinar nada.' },
    { q: 'O que vem na solução completa?', a: 'Documento estruturado, modelos e planilhas editáveis, POPs quando aplicável e o plano de implementação passo a passo.' },
    { q: 'Posso cancelar a assinatura?', a: 'Sim, a qualquer momento pelo portal de cobrança dentro do seu painel.' },
];

export default function PlansPage() {
    const [periodo, setPeriodo] = useState('Mensal');
    const { plans } = useEcommerceSubscriptionsPlans();
    const temAnual = plans.some((plan) => (plan.variants ?? []).some((v) => v.title === 'Anual'));

    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
            <Helmet>
                <title>Planos e preços · Resolvo Já</title>
                <meta name="description" content="Assine o Resolvo Já e libere soluções ilimitadas geradas por IA para gestão, operações, fiscal, tecnologia, estoque e RH da sua pequena empresa." />
            </Helmet>
            <SiteHeader />

            <main className="relative overflow-hidden">
                <AuroraBackground />
                <div className="relative mx-auto max-w-[80rem] px-5 py-16 sm:px-8">
                    <Reveal>
                        <header className="max-w-2xl">
                            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                                Resolva do seu jeito: <span className="text-gradient-aurora">com gente ou com IA</span>
                            </h1>
                            <p className="mt-4 text-[hsl(var(--muted-foreground))]">
                                Fale direto com um especialista ou resolva na hora com a nossa IA. Sem fidelidade: cancele quando quiser.
                            </p>
                        </header>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <div className="mt-12">
                            <ConsultoriaDestaque />
                        </div>
                    </Reveal>

                    <Reveal delay={0.15}>
                        <div className="mt-20">
                            <h2 className="font-display text-2xl font-semibold">Prefere resolver na hora com IA?</h2>
                            <p className="mt-2 mb-6 text-[hsl(var(--muted-foreground))]">Descreva seu problema, veja a prévia e escolha como continuar.</p>
                            <SeletorPeriodo periodo={periodo} onChange={setPeriodo} temAnual={temAnual} />
                            <div className="mt-8">
                                <PlansList className="grid gap-6 md:grid-cols-3" periodo={periodo} antes={<AvulsaCard />} />
                            </div>
                        </div>
                    </Reveal>

                    <section className="mt-20">
                        <Reveal>
                            <h2 className="font-display text-2xl font-semibold">Perguntas frequentes</h2>
                        </Reveal>
                        <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
                            {faqs.map((f, i) => (
                                <Reveal key={f.q} delay={i * 0.06}>
                                    <div className="grid gap-2 py-6 md:grid-cols-[20rem_1fr]">
                                        <p className="font-semibold">{f.q}</p>
                                        <p className="text-[hsl(var(--muted-foreground))]">{f.a}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
