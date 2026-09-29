const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

export default async function adminMiddleware(req, res, next) {
    const unauthorized = () => res.status(401).json({ error: 'Não autorizado' });
    const forbidden = () => res.status(403).json({ error: 'Acesso negado' });

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return unauthorized();

    const token = header.slice('Bearer '.length).trim();

    try {
        const response = await fetch(`${process.env.POCKETBASE_URL || 'http://localhost:8090'}/api/collections/users/auth-refresh`, {
            method: 'POST',
            headers: { Authorization: token },
        });
        if (!response.ok) return unauthorized();

        const data = await response.json();
        const email = data?.record?.email;
        if (!email) return unauthorized();

        // Fail closed: with no ADMIN_EMAILS configured, nobody is admin
        if (!ADMIN_EMAILS.includes(email)) return forbidden();

        req.user = { id: data.record.id, email };
    } catch {
        return unauthorized();
    }

    return next();
}
