// Petit rappel informatif (non bloquant) affiché près des boutons de
// paiement pour les élèves dont le profil indique la Tunisie — certaines
// cartes bancaires tunisiennes ne sont pas acceptées par Stripe. Le
// paiement en ligne reste proposé normalement (une carte en euros, par
// exemple celle d'un proche à l'étranger, fonctionne) ; ce n'est qu'un
// filet de secours si la carte de l'élève est refusée.
export default function TunisiaPaymentNote({ user }) {
  if (user?.country !== "Tunisie") return null;
  return (
    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "6px 0 0" }}>
      Si votre carte bancaire est refusée, contactez-nous à{" "}
      <a href="mailto:contact@klassx.cloud">contact@klassx.cloud</a> pour régler par virement bancaire.
    </p>
  );
}
