import { useLanguage } from '@/i18n/LanguageContext';

export default function PrivacyPolicy() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">{t.privacy.title}</h1>
      <p className="text-muted-foreground mb-8">
        {t.privacy.lastUpdated}: {new Date().toLocaleDateString()}
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <p className="text-lg">{t.privacy.intro}</p>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.dataController.title}</h2>
          <p>{t.privacy.dataController.content}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.dataCollected.title}</h2>
          <p className="mb-2">{t.privacy.dataCollected.intro}</p>
          <ul className="list-disc pl-6 space-y-1">
            {t.privacy.dataCollected.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.legalBasis.title}</h2>
          <p className="mb-2">{t.privacy.legalBasis.intro}</p>
          <ul className="list-disc pl-6 space-y-1">
            {t.privacy.legalBasis.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.purposes.title}</h2>
          <ul className="list-disc pl-6 space-y-1">
            {t.privacy.purposes.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.retention.title}</h2>
          <p>{t.privacy.retention.content}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.sharing.title}</h2>
          <p className="mb-2">{t.privacy.sharing.intro}</p>
          <ul className="list-disc pl-6 space-y-1">
            {t.privacy.sharing.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.rights.title}</h2>
          <p className="mb-2">{t.privacy.rights.intro}</p>
          <ul className="list-disc pl-6 space-y-1">
            {t.privacy.rights.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p className="mt-3">{t.privacy.rights.howToExercise}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.cookies.title}</h2>
          <p>{t.privacy.cookies.content}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.security.title}</h2>
          <p>{t.privacy.security.content}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.children.title}</h2>
          <p>{t.privacy.children.content}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.updates.title}</h2>
          <p>{t.privacy.updates.content}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{t.privacy.contact.title}</h2>
          <p>{t.privacy.contact.content}</p>
        </section>
      </div>
    </div>
  );
}
