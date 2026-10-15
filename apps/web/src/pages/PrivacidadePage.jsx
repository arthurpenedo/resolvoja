import React from 'react';
import { Helmet } from 'react-helmet';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

const ATUALIZADA_EM = '15 de outubro de 2026';
const EMAIL = 'contato@resolvoja.com';
// Preencher quando a empresa estiver formalizada; enquanto vazio, a linha do CNPJ não aparece.
const RAZAO_SOCIAL = '';
const CNPJ = '';

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

export default function PrivacidadePage() {
	return (
		<div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
			<Helmet>
				<title>Política de privacidade — Resolvo Já</title>
			</Helmet>
			<SiteHeader />

			<main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
				<h1 className="font-display text-3xl font-semibold">Política de privacidade</h1>
				<p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Última atualização: {ATUALIZADA_EM}</p>

				<div className="mt-8 space-y-8 leading-relaxed text-[hsl(var(--muted-foreground))]">
					<p>
						Esta política explica, em linguagem direta, quais dados pessoais o Resolvo Já coleta, para quê,
						com quem compartilha, por quanto tempo guarda e como você exerce seus direitos, conforme a Lei
						Geral de Proteção de Dados (Lei nº 13.709/2018, a LGPD). Ao usar o site, você declara ter lido
						este documento.
					</p>

					<Secao n={1} titulo="Quem é o responsável pelos seus dados">
						<p>
							O controlador dos dados é o Resolvo Já{RAZAO_SOCIAL && ` (${RAZAO_SOCIAL}${CNPJ ? `, CNPJ ${CNPJ}` : ''})`},
							que opera o site resolvoja.com. O encarregado pelo tratamento de dados pessoais (DPO) pode ser
							contatado pelo e-mail <a href={`mailto:${EMAIL}`} className="underline hover:text-foreground">{EMAIL}</a>.
						</p>
					</Secao>

					<Secao n={2} titulo="Quais dados coletamos">
						<Lista itens={[
							<><strong className="text-foreground">Cadastro:</strong> nome, e-mail e senha (guardada criptografada; nem a equipe consegue lê-la).</>,
							<><strong className="text-foreground">Descrição do problema:</strong> o que você escreve sobre a sua empresa e o desafio que quer resolver, e as soluções geradas a partir disso.</>,
							<><strong className="text-foreground">Pagamento:</strong> processado pela Stripe. Recebemos só o status do pagamento e o plano contratado; os dados do cartão ficam com a Stripe.</>,
							<><strong className="text-foreground">Consultoria:</strong> as informações que você compartilhar com o especialista durante o atendimento.</>,
							<><strong className="text-foreground">Navegação:</strong> endereço IP, tipo de navegador e registros técnicos de acesso, necessários para segurança. Dados de uso (páginas visitadas, tempo no site) só com o seu aceite nos cookies (veja o item 7).</>,
						]} />
						<p>
							Pedimos que você <strong className="text-foreground">não inclua dados pessoais de terceiros</strong> (de clientes ou
							funcionários, por exemplo) nem dados sensíveis, como saúde ou religião, na descrição do problema. Eles
							não são necessários para gerar a solução.
						</p>
					</Secao>

					<Secao n={3} titulo="Para que usamos e com qual base legal">
						<Lista itens={[
							<>Criar e manter sua conta, gerar as prévias e soluções e entregar o que você comprou: <em>execução de contrato</em> (art. 7º, V).</>,
							<>Processar pagamentos, emitir comprovantes e cumprir obrigações fiscais: <em>execução de contrato</em> e <em>obrigação legal</em> (art. 7º, II).</>,
							<>Enviar e-mails sobre a conta, como confirmação de cadastro, troca de senha e status de pedidos: <em>execução de contrato</em>.</>,
							<>Prevenir fraude e manter o site seguro: <em>legítimo interesse</em> (art. 7º, IX).</>,
							<>Medir o uso do site com o Google Analytics: <em>consentimento</em> (art. 7º, I), que você pode retirar a qualquer momento.</>,
						]} />
						<p>Não vendemos seus dados e não os usamos para treinar modelos de inteligência artificial.</p>
					</Secao>

					<Secao n={4} titulo="Inteligência artificial">
						<p>
							As soluções são geradas por um modelo de IA da Anthropic (Claude). O texto que você descreve é enviado à
							Anthropic apenas para gerar a resposta. Pelos termos comerciais da Anthropic, esses dados não são usados
							para treinar os modelos dela. O conteúdo gerado é uma orientação de apoio, e as decisões sobre o seu negócio
							continuam sendo suas.
						</p>
					</Secao>

					<Secao n={5} titulo="Com quem compartilhamos">
						<p>Só com os fornecedores necessários para o serviço funcionar, que tratam os dados em nosso nome:</p>
						<Lista itens={[
							<><strong className="text-foreground">Stripe</strong>: pagamentos e assinaturas.</>,
							<><strong className="text-foreground">Anthropic</strong>: geração das soluções por IA.</>,
							<><strong className="text-foreground">Railway</strong>: hospedagem do site e do banco de dados.</>,
							<><strong className="text-foreground">Resend</strong>: envio de e-mails da conta.</>,
							<><strong className="text-foreground">Google</strong>: estatísticas de uso (Google Analytics), só com o seu aceite.</>,
						]} />
						<p>Também podemos compartilhar dados quando a lei ou uma ordem judicial exigir.</p>
					</Secao>

					<Secao n={6} titulo="Transferência internacional">
						<p>
							Esses fornecedores têm servidores fora do Brasil, principalmente nos Estados Unidos. A transferência acontece
							para executar o contrato com você (art. 33, IX, da LGPD) e com fornecedores que adotam cláusulas contratuais
							e medidas de segurança compatíveis com a lei brasileira.
						</p>
					</Secao>

					<Secao n={7} titulo="Cookies">
						<Lista itens={[
							<><strong className="text-foreground">Essenciais:</strong> mantêm você logado e guardam suas escolhas. Sem eles o site não funciona, por isso não pedem aceite.</>,
							<><strong className="text-foreground">De medição (Google Analytics):</strong> contam visitas e páginas vistas, com IP anonimizado. Só são ativados se você clicar em “Aceitar” no aviso de cookies.</>,
						]} />
						<p>
							Para mudar a sua escolha, limpe os dados do site resolvoja.com no seu navegador. O aviso aparecerá de novo.
						</p>
					</Secao>

					<Secao n={8} titulo="Por quanto tempo guardamos">
						<Lista itens={[
							'Dados da conta, problemas descritos e soluções: enquanto a conta existir. Ao excluí-la, apagamos em até 30 dias.',
							'Registros de pagamento: pelo prazo exigido pela legislação fiscal (em geral, 5 anos).',
							'Registros de acesso ao site: 6 meses, como determina o Marco Civil da Internet (art. 15).',
						]} />
					</Secao>

					<Secao n={9} titulo="Seus direitos">
						<p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
						<Lista itens={[
							'confirmar se tratamos seus dados e ter acesso a eles;',
							'corrigir dados incompletos ou desatualizados;',
							'pedir a exclusão da conta e dos dados (exceto os que a lei nos obriga a guardar);',
							'receber seus dados em formato portável;',
							'saber com quem compartilhamos seus dados;',
							'retirar o consentimento dado para os cookies de medição;',
							'reclamar à Autoridade Nacional de Proteção de Dados (ANPD).',
						]} />
						<p>
							Basta escrever para <a href={`mailto:${EMAIL}`} className="underline hover:text-foreground">{EMAIL}</a> a partir do
							e-mail cadastrado. Respondemos em até 15 dias.
						</p>
					</Secao>

					<Secao n={10} titulo="Segurança">
						<p>
							A conexão é sempre criptografada (HTTPS), as senhas são guardadas com criptografia e o acesso aos dados é restrito
							à equipe que precisa deles para atender você. Se houver um incidente de segurança que possa afetar você,
							avisaremos você e a ANPD, como manda a lei.
						</p>
					</Secao>

					<Secao n={11} titulo="Menores de idade">
						<p>O Resolvo Já é voltado a empresas e não se destina a menores de 18 anos.</p>
					</Secao>

					<Secao n={12} titulo="Mudanças nesta política">
						<p>
							Se esta política mudar, a data no topo será atualizada. Mudanças relevantes serão avisadas por e-mail ou no próprio site.
						</p>
					</Secao>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
}
