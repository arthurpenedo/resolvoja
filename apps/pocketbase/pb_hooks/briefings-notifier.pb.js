/// <reference path="../pb_data/types.d.ts" />
onRecordCreate((e) => {
    e.next();

    const adminEmail = $os.getenv("ADMIN_EMAIL");
    if (!adminEmail) return;

    const b = e.record;

    // Tudo que o cliente digita é escapado: o e-mail não pode carregar HTML injetado pelo formulário.
    const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const field = (name) => esc(b.getString(name));
    const preview = b.getString("preview");

    const subject = `[Resolvoja] Novo briefing${preview ? "" : " (sem prévia da IA)"}: ${b.getString("subdivisao")} — ${b.getString("empresa") || "empresa não informada"}`;

    const html = `
        <h2 style="color:#6366f1">Novo briefing recebido na Resolvoja</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px">
            <tr><td style="padding:6px 0;color:#666;width:140px"><strong>Área</strong></td><td>${field("area_nome")}</td></tr>
            <tr><td style="padding:6px 0;color:#666"><strong>Subdivisão</strong></td><td>${field("subdivisao")}</td></tr>
            <tr><td style="padding:6px 0;color:#666"><strong>Empresa</strong></td><td>${field("empresa") || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#666"><strong>Setor</strong></td><td>${field("setor") || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#666"><strong>Porte</strong></td><td>${field("porte") || "—"}</td></tr>
        </table>
        <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb">
        <p><strong>Problema descrito:</strong></p>
        <p style="background:#f9fafb;padding:12px;border-radius:8px">${field("problema")}</p>
        <p><strong>Já tentou:</strong> ${field("tentativas") || "—"}</p>
        <p><strong>Objetivo em 90 dias:</strong> ${field("objetivo") || "—"}</p>
        <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb">
        <p><strong>Prévia gerada pela IA:</strong></p>
        ${preview
            ? `<pre style="background:#f9fafb;padding:12px;border-radius:8px;white-space:pre-wrap;font-family:sans-serif">${esc(preview)}</pre>`
            : `<p style="background:#fef3c7;padding:12px;border-radius:8px">A IA estava indisponível e o cliente não recebeu prévia. Responda este pedido manualmente.</p>`}
    `;

    try {
        const message = new MailerMessage({
            from: {
                address: $os.getenv("BUILDER_MAILER_SENDER_ADDRESS") || adminEmail,
                name: "Resolvoja",
            },
            to: [{ address: adminEmail }],
            subject,
            html,
        });
        e.app.newMailClient().send(message);
    } catch (err) {
        e.app.logger().error("Falha ao enviar notificação de briefing", "error", `${err}`);
    }
}, "briefings");
