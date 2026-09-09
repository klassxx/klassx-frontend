import { IconCheckShield } from "./Icons";

/**
 * Petit badge de confiance affiché juste avant un paiement — spec :
 * certains visiteurs se sentent plus en sécurité en voyant explicitement
 * mentionné que le paiement est sécurisé, surtout sur une plateforme
 * encore peu connue. Ne remplace pas une vraie intégration PayPal
 * (discuté et volontairement mis de côté pour l'instant, faute de
 * demande confirmée) — c'est une façon peu coûteuse de rassurer sans
 * construire un second système de paiement complet.
 */
export default function PaymentTrustBadge() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: "var(--text-muted)",
        marginTop: 10,
      }}
    >
      <IconCheckShield width={16} height={16} />
      <span>Paiement 100% sécurisé — chiffrement SSL, traité par Stripe</span>
    </div>
  );
}
