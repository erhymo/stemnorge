export default function GDPRPage() {
  return (
    <div className="py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Personvern og GDPR</h1>
      <p className="mb-4">
        StemNorge lagrer kun de opplysningene som er nødvendige for å sikre én stemme per person:
      </p>
      <ul className="list-disc pl-6 mb-6">
        <li>Fullt navn</li>
        <li>Telefonnummer</li>
        <li>Passord (kryptert i produksjon)</li>
      </ul>
      <p className="mb-4">
        Vi lagrer ikke hvilke alternativer du stemmer på. Stemmen din er anonym.
      </p>
      <p className="mb-4">
        Opplysningene brukes kun til innlogging og for å hindre at én person stemmer flere ganger.
      </p>
      <p className="text-blue-200">Dine data deles aldri med tredjeparter.</p>
    </div>
  );
}
