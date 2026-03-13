export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="font-display text-5xl mb-4">404</h1>
      <p className="text-text-secondary text-base mb-8">This page doesn't exist.</p>
      <a href="/" className="bg-blush-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-blush-600 transition-colors">
        Go Home
      </a>
    </div>
  );
}
