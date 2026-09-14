// Public page (rendered outside the auth gate) so it can be linked from the
// Google OAuth consent screen and read by anyone before they sign in or grant
// access. The text describes Orbit's actual data handling; review and fill the
// contact email before relying on it.

const LAST_UPDATED = '13 September 2026';
const CONTACT_EMAIL = '[your contact email]';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-serif font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-16 space-y-8">
        <header className="space-y-2">
          <a href="/" className="font-serif text-2xl font-bold tracking-tight text-primary">
            Orbit
          </a>
          <h1 className="text-3xl font-serif font-bold">Privacy Policy</h1>
          <p className="text-xs font-mono text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Orbit is a personal relationship tool. You capture notes about people you know, and Orbit
          helps you remember them, find them, and spot useful introductions. This policy explains
          what data Orbit handles and why.
        </p>

        <Section title="Information you provide">
          <p>
            <strong className="text-foreground font-medium">Account.</strong> When you sign up, Orbit
            stores your email address so you can log in.
          </p>
          <p>
            <strong className="text-foreground font-medium">People and notes.</strong> The people you
            add and the details you record about them (names, companies, roles, locations, tags,
            free-text notes, interactions, and the connections between them) are stored so Orbit can
            show them back to you.
          </p>
          <p>
            <strong className="text-foreground font-medium">Captures.</strong> When you add someone
            from a typed or voice note, Orbit processes that note to extract the person's details for
            your review.
          </p>
        </Section>

        <Section title="Contacts you import">
          <p>
            <strong className="text-foreground font-medium">Google.</strong> If you choose to import
            from Google, Orbit requests read-only access to your Google contacts. The access token is
            used once, in your browser, to fetch your contacts, and is not stored. Orbit never sees
            your Google password. Only the contacts you select are sent to Orbit and saved.
          </p>
          <p>
            <strong className="text-foreground font-medium">LinkedIn.</strong> If you upload a
            LinkedIn connections export, the file is read in your browser. Only the contacts you
            select are sent to Orbit and saved; the file itself is not uploaded.
          </p>
        </Section>

        <Section title="How your data is used">
          <p>
            Your data is used to provide Orbit: to store and search your network, surface people to
            reconnect with, and suggest and answer questions about introductions. It is not sold, and
            it is not used for advertising.
          </p>
          <p>
            <strong className="text-foreground font-medium">AI processing.</strong> To extract details
            from your notes and to generate introductions and answers, the relevant text is sent to
            Anthropic (Claude). Voice notes are sent to OpenAI for transcription. These providers
            process the data to return a result for you.
          </p>
        </Section>

        <Section title="Service providers">
          <p>Orbit relies on a small set of providers to run:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Anthropic, for AI extraction, introductions, and answers.</li>
            <li>OpenAI, for voice-note transcription.</li>
            <li>Neon, for the hosted database where your data is stored.</li>
            <li>Render, for hosting the application.</li>
            <li>Google, only when you choose to import your Google contacts.</li>
          </ul>
        </Section>

        <Section title="Storage and security">
          <p>
            Your data is stored in a hosted PostgreSQL database and served over encrypted (HTTPS)
            connections. Access is limited to your own account.
          </p>
        </Section>

        <Section title="Retention and deletion">
          <p>
            Orbit keeps your data until you ask to remove it. To request deletion of your account and
            associated data, contact {CONTACT_EMAIL}. You can also edit or delete individual people
            from within the app.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            This policy may be updated as Orbit changes. The date at the top reflects the most recent
            version.
          </p>
        </Section>

        <Section title="Contact">
          <p>Questions about privacy? Reach out at {CONTACT_EMAIL}.</p>
        </Section>

        <footer className="pt-4 border-t border-border">
          <a href="/" className="text-sm text-primary hover:underline underline-offset-4">
            Back to Orbit
          </a>
        </footer>
      </div>
    </div>
  );
}
