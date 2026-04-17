export const metadata = { title: 'Terms — autoDSM' };

export default function TermsPage() {
  return (
    <main className="min-h-screen surface-primary px-6 py-16 md:px-10 md:py-24">
      <article className="mx-auto max-w-[680px]">
        <h1 className="font-display font-semibold text-[32px] md:text-[40px] text-t-primary">
          Terms of Service
        </h1>
        <p className="mt-2 text-[14px] text-t-tertiary">Last updated: April 2026</p>

        <div className="mt-10 flex flex-col gap-6 text-[15px] leading-[1.7] text-t-secondary">
          <p>
            Welcome to autoDSM. By using this product you agree to use it
            responsibly and to the terms outlined on this page. autoDSM is in
            active development, so these terms may evolve alongside the product.
          </p>
          <h2 className="font-display font-semibold text-[20px] text-t-primary mt-6">Use of the service</h2>
          <p>
            autoDSM reads public GitHub repositories you point at and turns
            their components into an interactive design system. You are
            responsible for ensuring you have the right to analyze the
            repositories you connect.
          </p>
          <h2 className="font-display font-semibold text-[20px] text-t-primary mt-6">Account</h2>
          <p>
            When you connect GitHub we store only the metadata required to make
            the product work. We never push code on your behalf.
          </p>
          <h2 className="font-display font-semibold text-[20px] text-t-primary mt-6">Contact</h2>
          <p>
            Questions? Reach us at{' '}
            <a
              className="underline underline-offset-2 text-t-primary"
              href="mailto:hello@autodsm.dev"
            >
              hello@autodsm.dev
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
