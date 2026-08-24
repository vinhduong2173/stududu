const fs = require('fs');
const path = require('path');

const groupTranslations = {
  ja: {
    "join_pending": "承認待ち",
    "join_pending_msg": "加入リクエストは管理者/オーナーの承認待ちです",
    "request_join": "グループに参加リクエスト",
    "report_member": "メンバーを通報",
    "report_member_title": "違反メンバーの通報",
    "report_reason_placeholder": "違反理由を選択してください...",
    "reason_spam": "スパム / 迷惑広告",
    "reason_harassment": "嫌がらせ / 侮辱",
    "reason_hate_speech": "ヘイトスピーチ / 不適切な行動",
    "reason_inappropriate": "不適切なコンテンツ",
    "reason_other": "その他の理由",
    "submit_report": "通報を送信",
    "report_success": "メンバーの通報が正常に送信されました",
    "pending_join_requests": "承認待ちの加入リクエスト",
    "approve": "承認",
    "reject": "拒否"
  },
  de: {
    "join_pending": "Ausstehende Genehmigung",
    "join_pending_msg": "Deine Beitrittsanfrage wartet auf die Genehmigung des Admins/Besitzers",
    "request_join": "Beitritt anfragen",
    "report_member": "Mitglied melden",
    "report_member_title": "Mitgliedsverstoß melden",
    "report_reason_placeholder": "Verstoßgrund auswählen...",
    "reason_spam": "Spam / Unerwünschte Werbung",
    "reason_harassment": "Belästigung / Beleidigungen",
    "reason_hate_speech": "Hassrede / Unangemessenes Verhalten",
    "reason_inappropriate": "Unangemessener Inhalt",
    "reason_other": "Anderer Grund",
    "submit_report": "Meldung absenden",
    "report_success": "Mitgliedsmeldung erfolgreich übermittelt",
    "pending_join_requests": "Ausstehende Beitrittsanfragen",
    "approve": "Genehmigen",
    "reject": "Ablehnen"
  },
  fr: {
    "join_pending": "En attente d'approbation",
    "join_pending_msg": "Votre demande de rejointement est en attente d'approbation par l'administrateur/propriétaire",
    "request_join": "Demander à rejoindre",
    "report_member": "Signaler un membre",
    "report_member_title": "Signaler une violation de membre",
    "report_reason_placeholder": "Sélectionner la raison de la violation...",
    "reason_spam": "Spam / Publicité non sollicitée",
    "reason_harassment": "Harcèlement / Insultes",
    "reason_hate_speech": "Discours de haine / Comportement inapproprié",
    "reason_inappropriate": "Contenu inapproprié",
    "reason_other": "Autre raison",
    "submit_report": "Soumettre le signalement",
    "report_success": "Signalement du membre soumis avec succès",
    "pending_join_requests": "Demandes d'adhésion en attente",
    "approve": "Approuver",
    "reject": "Rejeter"
  },
  es: {
    "join_pending": "Pendiente de aprobación",
    "join_pending_msg": "Tu solicitud de unirse está esperando la aprobación del administrador/propietario",
    "request_join": "Solicitar unirse",
    "report_member": "Reportar miembro",
    "report_member_title": "Reportar infracción de miembro",
    "report_reason_placeholder": "Seleccionar motivo de infracción...",
    "reason_spam": "Spam / Publicidad no deseada",
    "reason_harassment": "Acoso / Insultos",
    "reason_hate_speech": "Discurso de odio / Comportamiento inapropiado",
    "reason_inappropriate": "Contenido inapropiado",
    "reason_other": "Otro motivo",
    "submit_report": "Enviar reporte",
    "report_success": "Reporte de miembro enviado con éxito",
    "pending_join_requests": "Solicitudes de unirse pendientes",
    "approve": "Aprobar",
    "reject": "Rechazar"
  },
  zh: {
    "join_pending": "等待批准",
    "join_pending_msg": "您的加入请求正等待管理员/群主批准",
    "request_join": "申请加入群组",
    "report_member": "举报成员",
    "report_member_title": "举报成员违规",
    "report_reason_placeholder": "选择违规原因...",
    "reason_spam": "垃圾信息 / 广告骚扰",
    "reason_harassment": "骚扰 / 侮辱",
    "reason_hate_speech": "仇恨言论 / 不当行为",
    "reason_inappropriate": "不良内容",
    "reason_other": "其他原因",
    "submit_report": "提交举报",
    "report_success": "成员举报已成功提交",
    "pending_join_requests": "待批准的加入请求",
    "approve": "批准",
    "reject": "拒绝"
  }
};

const msgDir = path.join(__dirname, '../../frontend/messages');

for (const lang of ['ja', 'de', 'fr', 'es', 'zh']) {
  const filePath = path.join(msgDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.group = groupTranslations[lang];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated group translations for ${lang}.json`);
  }
}
