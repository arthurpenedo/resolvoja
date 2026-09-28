import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Wand2 } from 'lucide-react';
import Reveal from '@/components/Reveal';
import AuroraBackground from '@/components/AuroraBackground';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import BuySolutionButton from '@/components/BuySolutionButton';
import { AREAS, getArea, getAreaGradient } from '@/data/hub';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegratedAi } from '@/hooks/use-integrated-ai';
import { pocketbaseClient } from '@/lib/pocketbaseClient';
import { toast } from '@/hooks/use-toast';

const emptyForm = {
    empresa: '',
    setor: '',
    porte: '1 a 5 pessoas',
    problema: '',
    tentativas: '',
    objetivo: '',
};

export default function AreaPage() {
    const { areaId } = useParams();
    const area = getArea(areaId);
    const { isAuthed, user, requestVerification } = useAuth();
    const [subdivision, setSubdivision] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitted, setSubmitted] = useState(false);
    const [resending, setResending] = useState(false);
    const { messages, isStreaming, sendMessage } = useIntegratedAi();
    const g = getAreaGradient(areaId);
    const savedRef = useRef(false);
    const needsVerification = isAuthed && user && !user.verified;

    const handleResendVerification = async () => {
        if (!user?.email || resending) return;
        setResending(true);
        try {
            await requestVerification(user.email);
            toast({ title: 'E-mail enviado', description: 'Confira sua caixa de entrada para confirmar o e-mail.' });
        } catch {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível reenviar o e-mail. Tente novamente em instantes.' });
        } finally {
            setResending(false);
        }
    };

    const preview = useMemo(() => {
        const assistants = messages.filter((m) => m.role === 'assistant' && m.content);
        return assistants[assistants.length - 1]?.content ?? '';
    }, [messages]);

    useEffect(() => {
        savedRef.current = false;
    }, [subdivision]);

    useEffect(() => {
        if (!submitted || isStreaming || !preview || savedRef.current || !isAuthed) return;
        savedRef.current = true;
        pocketbaseClient.collection('briefings').create({
            userId: pocketbaseClient.authStore.model?.id,
            area: areaId,
            area_nome: area.name,
            subdivisao: subdivision,
            empresa: form.empresa,
            setor: form.setor,
            porte: form.porte,
            problema: form.problema,
            tentativas: form.tentativas,
            objetivo: form.objetivo,
            preview,
            status: 'aguardando',
        }).catch(() => {});
    }, [submitted, isStreaming, preview]);

    if (!area) return <Navigate to="/" replace />;

    const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.problema.trim() || isStreaming) return;
        setSubmitted(true);
        await sendMessage(
            `ÁREA: ${area.name}\nSUBDIVISÃO: ${subdivision}\nEmpresa: ${form.empresa || 'não informado'}\nSetor: ${form.setor || 'não informado'}\nPorte: ${form.porte}\nProblema: ${form.problema}\nJá tentou: ${form.tentativas || 'nada relevante'}\nObjetivo em 90 dias: ${form.objetivo || 'não informado'}\n\nGere a prévia da solução seguindo a estrutura definida.`,
        );
    };

    return (
        <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
            <Helmet>
                <title>{`${area.name} — soluções por IA | Resolvo Já`}</title>
                <meta name="description" content={`${area.tagline} Escolha a subdivisão do seu problema em ${area.name} e receba uma prévia de solução gerada por IA.`} />
            </Helmet>

            <SiteHeader />

            <main className="relative overflow-hidden">
                <AuroraBackground variant={areaId === 'estoque' || areaId === 'pessoas' ? 'warm' : 'cool'} />
                <div className="relative mx-auto max-w-[90rem] px-5 py-14 sm:px-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Voltar ao hub
                    </Link>

                    <Reveal>
                        <header className="mt-6 max-w-3xl">
                            <span className={`grid h-14 w-14 place-items-center rounded-2xl ${g.gradient} text-3xl shadow-3d`} aria-hidden="true">{area.icon}</span>
                            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                                {area.name}
                            </h1>
                            <p className="mt-3 text-[hsl(var(--muted-foreground))]">{area.tagline}</p>
                        </header>
                    </Reveal>

                    <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
                        {/* Subdivisions */}
                        <section>
                            <Reveal>
                                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                                    Subdivisões ({area.items.length})
                                </h2>
                            </Reveal>
                            <motion.div className="mt-5 flex flex-wrap gap-2" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}>
                                {area.items.map((item) => {
                                    const active = subdivision === item;
                                    return (
                                        <motion.button
                                            key={item}
                                            type="button"
                                            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                                            onClick={() => { setSubdivision(item); setSubmitted(false); }}
                                            className={`rounded-full border px-4 py-2 text-sm transition-all active:scale-[0.98] ${
                                                active
                                                    ? `border-transparent ${g.gradient} font-semibold text-white shadow-3d`
                                                    : 'border-white/15 text-[hsl(var(--muted-foreground))] hover:border-white/40 hover:text-foreground'
                                            }`}
                                        >
                                            {item}
                                        </motion.button>
                                    );
                                })}
                            </motion.div>

                            <Reveal delay={0.1}>
                                <div className="mt-10 rounded-2xl border border-white/10 glass p-6">
                                    <p className="text-sm font-semibold">Outras áreas</p>
                                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                                        {AREAS.filter((a) => a.id !== area.id).map((a) => (
                                            <Link key={a.id} to={`/area/${a.id}`} className="transition-colors hover:text-foreground">
                                                {a.icon} {a.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </Reveal>
                        </section>

                        {/* Form / preview panel */}
                        <Reveal delay={0.08}>
                            <section className="relative overflow-hidden rounded-3xl border border-white/10 glass-strong p-7 shadow-3d">
                                <AnimatePresence mode="wait">
                                    {!subdivision ? (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -16 }}
                                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                            className="flex h-full min-h-[22rem] flex-col items-center justify-center text-center"
                                        >
                                            <span className={`grid h-16 w-16 place-items-center rounded-2xl ${g.gradient} shadow-3d`} aria-hidden="true">
                                                <Wand2 className="h-7 w-7 text-white" />
                                            </span>
                                            <p className="mt-5 font-display text-2xl font-semibold">Selecione uma subdivisão</p>
                                            <p className="mt-3 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
                                                Escolha ao lado o problema específico e o formulário de contexto aparece aqui.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="form"
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -16 }}
                                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                        >
                                            <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Problema selecionado</p>
                                            <h2 className={`mt-2 font-display text-2xl font-semibold ${g.text}`}>{subdivision}</h2>

                                            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <Field label="Nome da empresa" value={form.empresa} onChange={update('empresa')} placeholder="Padaria Central" />
                                                    <Field label="Setor" value={form.setor} onChange={update('setor')} placeholder="Alimentação, varejo, serviços…" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium" htmlFor="porte">Porte da equipe</label>
                                                    <select id="porte" value={form.porte} onChange={update('porte')} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--primary))]">
                                                        {['Sozinho(a)', '1 a 5 pessoas', '6 a 20 pessoas', '21 a 50 pessoas', 'Mais de 50 pessoas'].map((o) => (
                                                            <option key={o} value={o} className="bg-[hsl(var(--card))]">{o}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <Field textarea required label="Descreva o problema" value={form.problema} onChange={update('problema')} placeholder="O que está acontecendo hoje, com que frequência e qual o impacto?" />
                                                <Field textarea label="O que já tentou" value={form.tentativas} onChange={update('tentativas')} placeholder="Planilhas, sistema, terceirização…" />
                                                <Field label="Objetivo em 90 dias" value={form.objetivo} onChange={update('objetivo')} placeholder="Reduzir 30% do retrabalho" />

                                                {!isAuthed && (
                                                    <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[hsl(var(--muted-foreground))]">
                                                        Você precisa <Link to="/login" className="font-semibold text-gradient-orange-pink">entrar na sua conta</Link> (e confirmar o e-mail) para gerar a prévia com IA.
                                                    </p>
                                                )}

                                                {needsVerification && (
                                                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[hsl(var(--muted-foreground))]">
                                                        <p>Confirme seu e-mail para gerar a prévia com IA. Não recebeu?</p>
                                                        <button
                                                            type="button"
                                                            onClick={handleResendVerification}
                                                            disabled={resending}
                                                            className="mt-2 inline-flex items-center gap-2 font-semibold text-gradient-orange-pink disabled:opacity-60"
                                                        >
                                                            {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                                            {resending ? 'Enviando…' : 'Reenviar e-mail de confirmação'}
                                                        </button>
                                                    </div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={isStreaming || !form.problema.trim() || needsVerification}
                                                    className="group mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-aurora px-5 py-3 font-semibold text-white shadow-3d transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                                                >
                                                    {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                    {isStreaming ? 'Gerando prévia…' : 'Gerar prévia da solução'}
                                                </button>
                                            </form>

                                            <AnimatePresence>
                                                {submitted && (
                                                    <motion.div
                                                        key="preview"
                                                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                                        className="mt-8 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] p-6 shadow-3d"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-aurora text-white" aria-hidden="true">
                                                                <Sparkles className="h-4 w-4" />
                                                            </span>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gradient-aurora">Prévia da solução</p>
                                                        </div>
                                                        {preview ? (
                                                            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{preview}</p>
                                                        ) : (
                                                            <div className="mt-4 flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                                                                {isStreaming ? (
                                                                    <>
                                                                        <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" />
                                                                        A IA está montando o diagnóstico…
                                                                    </>
                                                                ) : (
                                                                    'Nenhuma prévia ainda. Verifique se você está logado e com e-mail confirmado, e tente novamente.'
                                                                )}
                                                            </div>
                                                        )}

                                                        {preview && !isStreaming && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 12 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: 0.2, duration: 0.4 }}
                                                                className="mt-6 grid gap-3 sm:grid-cols-2"
                                                            >
                                                                <BuySolutionButton context={{ area: area.name, subdivision }} />
                                                                <Link
                                                                    to="/plans"
                                                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-center text-sm font-semibold transition-colors hover:bg-white/10"
                                                                >
                                                                    Assinar e liberar várias <ArrowRight className="h-4 w-4" />
                                                                </Link>
                                                            </motion.div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </section>
                        </Reveal>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}

function Field({ label, textarea, ...props }) {
    const id = label.toLowerCase().replace(/\s+/g, '-');
    const base = 'rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:bg-white/[0.07]';
    return (
        <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={id}>{label}</label>
            {textarea ? <textarea id={id} rows={4} className={base} {...props} /> : <input id={id} className={base} {...props} />}
        </div>
    );
}
