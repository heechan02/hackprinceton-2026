export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="rounded-lg bg-white border border-stone-200 p-6 shadow-sm max-w-md w-full space-y-4">
        <h1 className="text-3xl font-semibold text-stone-900">Connect your card</h1>
        <p className="text-base text-stone-700 leading-relaxed">
          Link a payment card to enable Bill Protector. NannyCam will monitor transactions and
          alert you to suspicious activity.
        </p>
        <button
          type="button"
          className="rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-stone-800"
        >
          Connect your card
        </button>
      </div>
    </main>
  );
}
