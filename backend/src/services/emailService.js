const { Resend } = require('resend');

// Initialisation paresseuse — évite le crash si la clé est absente en dev
let resend = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const APP_URL      = process.env.APP_URL      || 'http://localhost:3000';
const FROM_ADDRESS = process.env.FROM_ADDRESS || 'ProjetsÉtudiants <onboarding@resend.dev>';

/* ────────────────────────────────────────────────────────────
 * Notification : tâche assignée à un étudiant
 * ──────────────────────────────────────────────────────────── */
async function sendTaskAssigned({ to, studentName, taskTitle, taskId, projectName, projectId, deadline, assignedBy }) {
  const client = getResend();
  if (!client) {
    console.warn('[Email] RESEND_API_KEY manquante — email non envoyé');
    return;
  }

  const deadlineStr = deadline
    ? new Date(deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const taskUrl = `${APP_URL}/projects/${projectId}/tasks/${taskId}`;

  try {
    const { data, error } = await client.emails.send({
      from:    FROM_ADDRESS,
      to:      [to],
      subject: `📋 Nouvelle tâche assignée : ${taskTitle}`,
      html:    buildTaskAssignedHtml({ studentName, taskTitle, projectName, deadline: deadlineStr, taskUrl, assignedBy }),
    });

    if (error) {
      console.error('[Email] Erreur Resend :', error);
    } else {
      console.log('[Email] Envoyé →', to, '| id:', data.id);
    }
  } catch (err) {
    // Ne jamais faire crasher l'API à cause d'un email raté
    console.error('[Email] Exception :', err.message);
  }
}

/* ────────────────────────────────────────────────────────────
 * Template HTML
 * ──────────────────────────────────────────────────────────── */
function buildTaskAssignedHtml({ studentName, taskTitle, projectName, deadline, taskUrl, assignedBy }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nouvelle tâche assignée</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6d28d9,#4f46e5);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:#f97316;border-radius:8px;display:inline-block;line-height:36px;text-align:center;font-size:18px;">📋</div>
                <span style="color:white;font-size:20px;font-weight:700;letter-spacing:-0.5px;">ProjetsÉtudiants</span>
              </div>
              <p style="color:#c4b5fd;margin:8px 0 0;font-size:14px;">Plateforme de gestion de projets JUNIA</p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="background:white;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

              <p style="color:#6d28d9;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Nouvelle tâche assignée</p>
              <h1 style="color:#111827;font-size:24px;font-weight:700;margin:0 0 24px;line-height:1.3;">
                Bonjour ${studentName} 👋
              </h1>

              <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
                <strong style="color:#374151;">${assignedBy}</strong> vous a assigné une nouvelle tâche dans le projet
                <strong style="color:#374151;">${projectName}</strong>.
              </p>

              <!-- Carte tâche -->
              <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:24px;margin:0 0 28px;">
                <p style="color:#7c3aed;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Tâche</p>
                <h2 style="color:#111827;font-size:18px;font-weight:700;margin:0 0 16px;">${taskTitle}</h2>

                <table cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr>
                    <td style="padding:4px 0;">
                      <span style="color:#9ca3af;font-size:13px;">📁 Projet</span>
                    </td>
                    <td style="padding:4px 0;text-align:right;">
                      <span style="color:#374151;font-size:13px;font-weight:600;">${projectName}</span>
                    </td>
                  </tr>
                  ${deadline ? `
                  <tr>
                    <td style="padding:4px 0;">
                      <span style="color:#9ca3af;font-size:13px;">📅 Deadline</span>
                    </td>
                    <td style="padding:4px 0;text-align:right;">
                      <span style="color:#dc2626;font-size:13px;font-weight:600;">${deadline}</span>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin:0 0 28px;">
                <a href="${taskUrl}"
                   style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;letter-spacing:0.2px;">
                  Voir la tâche →
                </a>
              </div>

              <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;">
                Si le bouton ne fonctionne pas, copiez ce lien :<br/>
                <a href="${taskUrl}" style="color:#7c3aed;word-break:break-all;">${taskUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
              <p style="color:#d1d5db;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} ProjetsÉtudiants — JUNIA Grande École d'Ingénieurs<br/>
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

module.exports = { sendTaskAssigned };
