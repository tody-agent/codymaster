"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostGuard = hostGuard;
exports.requireDashboardToken = requireDashboardToken;
/**
 * Reject any request whose Host header is not a loopback address.
 *
 * The dashboard binds to 127.0.0.1, but a localhost bind alone does not stop a
 * DNS-rebinding attack: a malicious page can rebind its own hostname to
 * 127.0.0.1 and then issue same-origin requests to the dashboard. The browser
 * still sends the *original* attacker hostname in the Host header, so refusing
 * non-loopback Host values closes that hole.
 */
function hostGuard() {
    const allowed = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
    return (req, res, next) => {
        const host = String(req.headers.host || '').split(':')[0].toLowerCase();
        if (!allowed.has(host)) {
            res.status(403).json({ error: 'forbidden host' });
            return;
        }
        next();
    };
}
/**
 * Require a bearer token on the protected API surface.
 *
 * The token is generated per dashboard launch and handed to the frontend via
 * the launch URL (?token=…). Static assets / the index shell stay public so the
 * page can boot and read its token, but every /api/* call must authenticate.
 * This prevents other local processes and cross-origin (CSRF) requests from
 * driving the state-changing API.
 */
function requireDashboardToken(token) {
    const want = `Bearer ${token}`;
    return (req, res, next) => {
        if ((req.headers.authorization || '') !== want) {
            res.status(401).json({ error: 'unauthorized' });
            return;
        }
        next();
    };
}
