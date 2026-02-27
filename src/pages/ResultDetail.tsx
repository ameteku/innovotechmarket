import { useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface ResultMedia {
  url: string;
  prompt: string;
  fileName: string;
}

interface Result {
  id: string;
  created_at: string;
  bg_color?: 'pink' | 'black' | 'blue' | 'red';
  message?: string;
  music?: ResultMedia;
  image?: ResultMedia;
}

const themes = {
  pink: {
    bg: 'from-rose-400 via-pink-500 to-fuchsia-500',
    heading: 'from-white to-pink-100',
    card: 'bg-white/15 border-white/25',
    text: 'text-white',
    muted: 'text-white/60',
    downloadBtn: 'text-white/70 hover:text-white underline underline-offset-2',
    confetti: ['#fff', '#fce7f3', '#fbbf24', '#bae6fd', '#d1fae5'],
  },
  black: {
    bg: 'from-zinc-950 via-neutral-900 to-stone-900',
    heading: 'from-white to-zinc-300',
    card: 'bg-white/8 border-white/15',
    text: 'text-white',
    muted: 'text-white/50',
    downloadBtn: 'text-white/60 hover:text-white underline underline-offset-2',
    confetti: ['#fff', '#fbbf24', '#c4b5fd', '#6ee7b7', '#fca5a5'],
  },
  blue: {
    bg: 'from-blue-500 via-indigo-500 to-violet-600',
    heading: 'from-white to-blue-100',
    card: 'bg-white/15 border-white/25',
    text: 'text-white',
    muted: 'text-white/60',
    downloadBtn: 'text-white/70 hover:text-white underline underline-offset-2',
    confetti: ['#fff', '#fbbf24', '#fce7f3', '#fef9c3', '#bbf7d0'],
  },
  red: {
    bg: 'from-red-500 via-rose-500 to-orange-400',
    heading: 'from-white to-red-100',
    card: 'bg-white/15 border-white/25',
    text: 'text-white',
    muted: 'text-white/60',
    downloadBtn: 'text-white/70 hover:text-white underline underline-offset-2',
    confetti: ['#fff', '#fbbf24', '#bae6fd', '#fef9c3', '#d1fae5'],
  },
};

const CONFETTI_CSS = `
  @keyframes confetti-fall {
    0%   { transform: translateY(-16px) rotate(0deg) scale(1);   opacity: 1; }
    70%  { opacity: 1; }
    100% { transform: translateY(105vh) rotate(680deg) scale(0.7); opacity: 0; }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

type ConfettiPiece = {
  id: number;
  left: string;
  color: string;
  delay: string;
  duration: string;
  size: number;
  isCircle: boolean;
};

function ConfettiLayer({ colors }: { colors: string[] }) {
  const pieces = useMemo<ConfettiPiece[]>(() =>
    Array.from({ length: 32 }, (_, i) => ({
      id: i,
      left: `${(i * 3.25 + (i % 5) * 1.3) % 100}%`,
      color: colors[i % colors.length],
      delay: `${((i * 0.23) % 3.2).toFixed(2)}s`,
      duration: `${(3.2 + (i % 7) * 0.35).toFixed(2)}s`,
      size: i % 4 === 0 ? 9 : i % 3 === 0 ? 7 : 5,
      isCircle: i % 3 !== 0,
    })),
  [colors]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: '-12px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? '50%' : '2px',
            animation: `confetti-fall ${p.duration} ${p.delay} linear infinite`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

const ResultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/result?id=${id}`)
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Result not found' : 'Failed to load result');
        return res.json();
      })
      .then(data => { setResult(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [id]);

  const handleDownload = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const theme = themes[result?.bg_color ?? 'pink'];

  if (loading) {
    return (
      <>
        <style>{CONFETTI_CSS}</style>
        <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${themes.pink.bg}`}>
          <Loader2 className="w-8 h-8 animate-spin text-white/70" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{CONFETTI_CSS}</style>
        <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${themes.pink.bg}`}>
          <div className="text-center text-white px-6 max-w-sm">
            <p className="text-2xl font-bold mb-2">
              {error === 'Result not found' ? 'Celebration not found' : 'Something went wrong'}
            </p>
            <p className="text-white/60 text-sm">{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CONFETTI_CSS}</style>
      <ConfettiLayer colors={theme.confetti} />

      <div className={`min-h-screen bg-gradient-to-br ${theme.bg} py-16 px-4`}>
        <div className="relative max-w-md mx-auto space-y-8">

          {/* Heading */}
          <div
            className="text-center select-none"
            style={{ animation: 'fade-up 0.7s ease-out both' }}
          >
            <p className={`font-heading font-light text-2xl tracking-[0.25em] uppercase bg-gradient-to-b ${theme.heading} bg-clip-text text-transparent`}>
              Happy
            </p>
            <p className={`font-heading font-black text-7xl tracking-tight leading-none bg-gradient-to-b ${theme.heading} bg-clip-text text-transparent drop-shadow-lg`}>
              Birthday
            </p>
          </div>

          {/* Custom message */}
          {result?.message && (
            <div
              className={`${theme.card} backdrop-blur-md border rounded-2xl px-6 py-5`}
              style={{ animation: 'fade-up 0.7s 0.15s ease-out both' }}
            >
              <p className={`text-center text-lg italic leading-relaxed font-light ${theme.text}`}>
                &ldquo;{result.message}&rdquo;
              </p>
            </div>
          )}

          {/* Image */}
          {result?.image && (
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ animation: 'fade-up 0.7s 0.25s ease-out both' }}
            >
              <img
                src={result.image.url}
                alt="Birthday"
                className="w-full object-cover block"
              />
            </div>
          )}

          {/* Audio */}
          {result?.music && (
            <div
              className={`${theme.card} backdrop-blur-md border rounded-2xl p-5 space-y-4`}
              style={{ animation: 'fade-up 0.7s 0.35s ease-out both' }}
            >
              <p className={`text-xs font-semibold tracking-widest uppercase ${theme.muted}`}>
                Your Birthday Song
              </p>
              <audio
                controls
                src={result.music.url}
                className="w-full"
                preload="metadata"
              />
              <div className="text-right">
                <button
                  onClick={() => handleDownload(result.music!.url, result.music!.fileName)}
                  className={`inline-flex items-center gap-1.5 text-xs transition-colors ${theme.downloadBtn}`}
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <p
            className={`text-center text-xs tracking-wide ${theme.muted}`}
            style={{ animation: 'fade-up 0.7s 0.45s ease-out both' }}
          >
            Crafted with care · InnovoTech Market
          </p>

        </div>
      </div>
    </>
  );
};

export default ResultDetail;
