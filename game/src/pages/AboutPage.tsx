import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">About</h1>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">🦠 Germ Buster</h2>
          <p>
            Germ Buster is a quick reflex game for all ages. The rules fit in one sentence: tap the
            germs, not the healthy cells. Young kids can play on Easy with plenty of hearts and slow
            germs. Grown-ups can chase combos and high scores on Hard, where the germs are fast and
            superbugs take two hits.
          </p>
          <p>
            A round takes about a minute, so it's good for a quick break, and families can take
            turns to beat each other's best score.
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Good to know</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>No accounts, ads or tracking. Settings and best scores are saved only in this browser.</li>
            <li>Works with a mouse, a touch screen or the keyboard.</li>
            <li>Respects your device's reduced-motion setting.</li>
            <li>It's a game, not medical advice. Real germs are best beaten by washing your hands! 🧼</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Built with</h2>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'daisyUI', 'Tailwind CSS', 'Vite', 'React Router', 'Web Audio API'].map(
              (t) => (
                <span key={t} className="badge badge-outline">
                  {t}
                </span>
              ),
            )}
          </div>
          <p className="text-sm opacity-70">Version 1.0.0</p>
        </div>
      </div>

      <Link to="/play" className="btn btn-primary self-center">
        Play now
      </Link>
    </div>
  )
}
