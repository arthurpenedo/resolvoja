/**
 * Atualiza a tabela de preços no Stripe (modelo de 12/10/2026): idempotente, pode rodar mais de uma vez.
 *
 *   railway run --service api -- node scripts/atualizar-precos.mjs          # mostra o que faria
 *   railway run --service api -- node scripts/atualizar-precos.mjs --aplicar
 *
 * Usa a STRIPE_SECRET_KEY do ambiente (nunca imprime a chave). Para cada preço novo: procura pelo
 * lookup_key; se não existir, cria. Depois desativa os preços antigos do mesmo produto e período, para o
 * site (que lista só preços ativos) mostrar apenas a tabela nova. Assinantes antigos continuam no preço deles.
 */
import Stripe from 'stripe';

const APLICAR = process.argv.includes('--aplicar');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// produto (nome exato no Stripe) → preços desejados
const TABELA = [
	{ produto: 'Essencial', precos: [
		{ lookup: 'essencial_mensal_2026_10', centavos: 14900, intervalo: 'month' },
		{ lookup: 'essencial_anual_2026_10', centavos: 149000, intervalo: 'year' },
	] },
	{ produto: 'Pro', precos: [
		{ lookup: 'pro_mensal_2026_10', centavos: 29900, intervalo: 'month' },
		{ lookup: 'pro_anual_2026_10', centavos: 299000, intervalo: 'year' },
	] },
	{ produto: 'Solução completa avulsa', precos: [{ lookup: 'avulsa_2026_10', centavos: 14700 }] },
	{ produto: 'Consultoria', precos: [{ lookup: 'consultoria_2026_10', centavos: 59900 }] },
];

const brl = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function produtoPorNome(nome) {
	const lista = await stripe.products.list({ active: true, limit: 100 });
	const achados = lista.data.filter((p) => p.name === nome);
	if (achados.length !== 1) throw new Error(`esperava 1 produto ativo "${nome}", achei ${achados.length}`);
	return achados[0];
}

async function main() {
	if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY ausente');
	console.log(`Stripe em modo ${process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'PRODUÇÃO' : 'TESTE'} · ${APLICAR ? 'APLICANDO' : 'simulação (use --aplicar)'}`);
	for (const { produto, precos } of TABELA) {
		const prod = await produtoPorNome(produto);
		const ativos = (await stripe.prices.list({ product: prod.id, active: true, limit: 100 })).data;
		for (const alvo of precos) {
			const intervalo = alvo.intervalo ?? null;
			let preco = (await stripe.prices.list({ lookup_keys: [alvo.lookup], limit: 1 })).data[0];
			const igual = ativos.find((p) => p.unit_amount === alvo.centavos && (p.recurring?.interval ?? null) === intervalo);
			if (preco) {
				console.log(`= ${produto} ${intervalo ?? 'avulso'} ${brl(alvo.centavos)} já existe`);
			} else if (igual) {
				// o preço certo já existe: só ganha o lookup_key (assinantes atuais seguem nele)
				if (APLICAR) preco = await stripe.prices.update(igual.id, { lookup_key: alvo.lookup });
				else preco = igual;
				console.log(`= ${produto} ${intervalo ?? 'avulso'} ${brl(alvo.centavos)} reaproveitado`);
			} else if (APLICAR) {
				preco = await stripe.prices.create({
					product: prod.id, currency: 'brl', unit_amount: alvo.centavos, lookup_key: alvo.lookup,
					...(intervalo ? { recurring: { interval: intervalo } } : {}),
				});
				console.log(`+ ${produto} ${intervalo ?? 'avulso'} ${brl(alvo.centavos)} criado`);
			} else {
				console.log(`+ ${produto} ${intervalo ?? 'avulso'} ${brl(alvo.centavos)} seria criado`);
			}
			const antigos = ativos.filter((p) => (p.recurring?.interval ?? null) === intervalo && p.id !== preco?.id);
			for (const p of antigos) {
				if (APLICAR && p.id === prod.default_price && preco) {
					// o Stripe não desativa o preço padrão do produto: o novo vira o padrão antes
					await stripe.products.update(prod.id, { default_price: preco.id });
					prod.default_price = preco.id;
				}
				if (APLICAR) await stripe.prices.update(p.id, { active: false });
				console.log(`- ${produto} ${intervalo ?? 'avulso'} ${brl(p.unit_amount)} ${APLICAR ? 'desativado' : 'seria desativado'}`);
			}
		}
	}
}

main().catch((erro) => {
	console.error(`Erro: ${erro.message}`);
	process.exit(1);
});
