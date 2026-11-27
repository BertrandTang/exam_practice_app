/**
 * Pied de page (l'année est calculée automatiquement).
 */
export default function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Application Mes Tâches</p>
    </footer>
  );
}
