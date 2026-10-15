import React from 'react';
import { Helmet } from 'react-helmet';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { Link } from 'react-router-dom';

const EMAIL = 'contato@resolvoja.com';

function Secao({ n, titulo, children }) {
	return (
		<section className="space-y-3">
			<h2 className="text-lg font-semibold text-foreground">{n}. {titulo}</h2>
			{children}
		</section>
	);
}

function Lista({ itens }) {
	return (
		<ul className="list-disc space-y-1.5 pl-5">
			{itens.map((item, i) => <li key={i}>{item}</li>)}
		</ul>
	);
}

export default function TermosPage() {
	return (
		<div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
			<Helmet>
				<title>Termos de uso — Resolvo Já</title>
			</Helmet>
			<SiteHeader />

			<main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
				<h1 className="font-display text-3xl font-semibold">Termos de uso</h1>
				<p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Última atualização: 15 de outubro de 2026</p>

				<div className="mt-8 space-y-8 leading-relaxed text-[hsl(var(--muted-foreground))]">
					<p>
						Estes termos regulam o uso do site resolvoja.com. Ao criar uma conta ou fazer uma compra, você concorda com
						eles e com a nossa <Link to="/privacidade" className="underline hover:text-foreground">política de privacidade</Link>.
					</p>

					<Secao n={1} titulo="O serviço">
						<p>
							O Resolvo Já ajuda pequenas empresas a resolver problemas do dia a dia. Você descreve o desafio, recebe na hora
							uma prévia gerada por inteligência artificial e pode obter a solução completa, com documento, modelos, planilhas e
							plano de implementação, por compra avulsa ou assinatura. Também oferecemos consultoria com um especialista humano.
						</p>
					</Secao>

					<Secao n={2} titulo="Conteúdo gerado por IA">
						<p>
							As soluções são orientações de apoio à gestão, geradas por IA a partir do que você descreve. Elas não substituem
							aconselhamento jurídico, contábil, tributário ou médico. Revise o conteúdo antes de aplicá-lo: as decisões e os
							resultados no seu negócio são de sua responsabilidade.
						</p>
					</Secao>

					<Secao n={3} titulo="Cadastro e conta">
						<p>
							Para comprar, você precisa de uma conta com e-mail válido. Você é responsável por manter sua senha em sigilo e por
							toda atividade feita na sua conta. O serviço é destinado a maiores de 18 anos.
						</p>
					</Secao>

					<Secao n={4} titulo="Planos, preços e pagamento">
						<Lista itens={[
							'Os preços em vigor são os mostrados na página de planos no momento da compra. Os pagamentos são processados pela Stripe.',
							<>Assinaturas (Essencial e Pro) são cobradas de forma recorrente, <strong className="text-foreground">mensal ou anual</strong>, conforme a opção escolhida, até serem canceladas.</>,
							'Cada plano dá direito a um número de soluções completas por mês (Essencial: 3; Pro: 8). A cota renova a cada mês e o que não for usado não acumula.',
							'A solução avulsa e a consultoria são cobradas uma única vez.',
							'Cupons de desconto valem nas condições informadas no próprio cupom (prazo, quantidade e produtos).',
						]} />
					</Secao>

					<Secao n={5} titulo="Direito de arrependimento (7 dias)">
						<p>
							Como a contratação é feita pela internet, você pode desistir em até 7 dias da compra e receber o valor pago de
							volta, conforme o art. 49 do Código de Defesa do Consumidor. Basta escrever para{' '}
							<a href={`mailto:${EMAIL}`} className="underline hover:text-foreground">{EMAIL}</a> a partir do e-mail cadastrado.
							O reembolso é feito no mesmo meio de pagamento.
						</p>
					</Secao>

					<Secao n={6} titulo="Cancelamento da assinatura">
						<Lista itens={[
							'Você pode cancelar a qualquer momento, sem multa, no portal de gerenciamento da assinatura.',
							'O cancelamento vale ao fim do período já pago (o mês, no plano mensal; o ano, no plano anual). Até lá, você continua com acesso completo e com a sua cota mensal.',
							'Fora do prazo de arrependimento do item 5, os pagamentos não são reembolsáveis, salvo quando a lei exigir. Isso inclui o plano anual: não há devolução proporcional dos meses restantes.',
							'A renovação é automática. Para não ser cobrado no próximo período, cancele pelo menos 24 horas antes da data de renovação.',
						]} />
					</Secao>

					<Secao n={7} titulo="Consultoria">
						<p>
							Depois do pagamento, entramos em contato pelo e-mail cadastrado para agendar a conversa com o especialista. Se
							precisar remarcar, avise com pelo menos 24 horas de antecedência.
						</p>
					</Secao>

					<Secao n={8} titulo="Uso aceitável">
						<p>
							Não é permitido usar o serviço para fins ilegais, revender as soluções como produto próprio, tentar acessar dados de
							outros usuários ou áreas restritas, nem sobrecarregar ou automatizar o uso do site de forma abusiva. Contas que
							violarem estas regras podem ser suspensas.
						</p>
					</Secao>

					<Secao n={9} titulo="Propriedade intelectual">
						<p>
							Você pode usar e adaptar livremente, na sua empresa, as soluções que comprou. A marca, o site e os modelos de base
							do Resolvo Já continuam sendo nossos.
						</p>
					</Secao>

					<Secao n={10} titulo="Responsabilidade">
						<p>
							Trabalhamos para manter o site no ar e as soluções corretas, mas não garantimos funcionamento ininterrupto nem
							resultados específicos no seu negócio. Se houver falha nossa, nossa responsabilidade se limita ao valor pago pelo
							serviço em questão, sem prejuízo dos direitos garantidos pelo Código de Defesa do Consumidor.
						</p>
					</Secao>

					<Secao n={11} titulo="Alterações e foro">
						<p>
							Podemos atualizar estes termos. Mudanças relevantes serão avisadas por e-mail ou no site, e a data no topo será
							atualizada. Fica eleito o foro do domicílio do consumidor para resolver qualquer questão.
						</p>
					</Secao>

					<Secao n={12} titulo="Contato">
						<p>
							Dúvidas: <a href={`mailto:${EMAIL}`} className="underline hover:text-foreground">{EMAIL}</a>
						</p>
					</Secao>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
