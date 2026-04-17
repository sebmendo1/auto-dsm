export const metadata = { title: 'Privacy — autoDSM' };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen surface-primary px-6 py-16 md:px-10 md:py-24">
      <article className="mx-auto max-w-[680px]">
        <h1 className="font-display font-semibold text-[32px] md:text-[40px] text-t-primary">
          Privacy Policy
        </h1>
        <p className="mt-2 text-[14px] text-t-tertiary">Last updated: April 2026</p>

        <div className="mt-10 flex flex-col gap-6 text-[15px] leading-[1.7] text-t-secondary">
          <p>
            We take your privacy seriously. autoDSM only reads what it needs to
            build your design system view, and we never sell your data.
          </p>
          <h2 className="font-display font-semibold text-[20px] text-t-primary mt-6">What we collect</h2>
          <p>
            Basic account information (email, GitHub handle) and the list of
            repositories you explicitly connect. We store parsed component
            metadata so scans stay fast.
          </p>
          <h2 className="font-display font-semibold text-[20px] text-t-primary mt-6">What we do not collect</h2>
          <p>
            We do not mine private code for training data. Your repository
            source is only read at scan time and is not persisted beyond what is
            required to render the app.
          </p>
          <h2 className="font-display font-semibold text-[20px] text-t-primary mt-6">Contact</h2>
          <p>
            Privacy questions? Email{' '}
            <a
              className="underline underline-offset-2 text-t-primary"
              href="mailto:privacy@autodsm.dev"
            >
              privacy@autodsm.dev
            </a>
            .
          </p>
        </div>

        <div className="mt-12">
          <a href="/" className="text-[14px] text-t-secondary hover:text-t-primary underline underline-offset-2">
            ← Back home
          </a>
        </div>
      </article>
    </main>
  );
}
