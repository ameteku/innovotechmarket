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
    page: '#f43f7e',
    gradient: 'linear-gradient(160deg, #fb7185 0%, #f43f7e 40%, #c026d3 100%)',
    playerBg: 'rgba(255,255,255,0.12)',
    playerBorder: 'rgba(255,255,255,0.2)',
    confetti: ['#fff', '#fce7f3', '#fbbf24', '#a5f3fc', '#bbf7d0'],
  },
  black: {
    page: '#09090b',
    gradient: 'linear-gradient(160deg, #18181b 0%, #09090b 50%, #0c0a09 100%)',
    playerBg: 'rgba(255,255,255,0.07)',
    playerBorder: 'rgba(255,255,255,0.12)',
    confetti: ['#fff', '#fbbf24', '#c4b5fd', '#6ee7b7', '#fca5a5'],
  },
  blue: {
    page: '#3b82f6',
    gradient: 'linear-gradient(160deg, #60a5fa 0%, #3b82f6 40%, #7c3aed 100%)',
    playerBg: 'rgba(255,255,255,0.12)',
    playerBorder: 'rgba(255,255,255,0.2)',
    confetti: ['#fff', '#fbbf24', '#fce7f3', '#d1fae5', '#fef9c3'],
  },
  red: {
    page: '#ef4444',
    gradient: 'linear-gradient(160deg, #f87171 0%, #ef4444 40%, #ea580c 100%)',
    playerBg: 'rgba(255,255,255,0.12)',
    playerBorder: 'rgba(255,255,255,0.2)',
    confetti: ['#fff', '#fbbf24', '#bae6fd', '#fef9c3', '#d1fae5'],
  },
};

const GLOBAL_CSS = `
  @keyframes confetti-fall {
    0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
    75%  { opacity: 0.9; }
    100% { transform: translateY(102vh) rotate(700deg); opacity: 0; }
  }
  @keyframes rise {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

function ConfettiLayer({ colors }: { colors: string[] }) {
  const pieces = useMemo(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: `${((i * 2.9) + (i % 7) * 1.1) % 100}%`,
      color: colors[i % colors.length],
      delay: `${((i * 0.19) % 3.5).toFixed(2)}s`,
      duration: `${(3 + (i % 8) * 0.3).toFixed(2)}s`,
      w: i % 4 === 0 ? 10 : i % 3 === 0 ? 7 : 5,
      h: i % 5 === 0 ? 14 : i % 3 === 0 ? 7 : 5,
      round: i % 3 !== 0,
    })), [colors]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.left,
          top: -16,
          width: p.w,
          height: p.h,
          backgroundColor: p.color,
          borderRadius: p.round ? '50%' : 3,
          animation: `confetti-fall ${p.duration} ${p.delay} linear infinite`,
        }} />
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
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Result not found' : 'Failed to load');
        return r.json();
      })
      .then(d => { setResult(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  const handleDownload = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.click();
  };

  const t = themes[result?.bg_color ?? 'pink'];

  if (loading) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: '100vh', background: themes.pink.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.7)' }} className="animate-spin" />
      </div>
    </>
  );

  if (error) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: '100vh', background: themes.pink.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>{error}</p>
      </div>
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <ConfettiLayer colors={t.confetti} />

      <div style={{ minHeight: '100vh', background: t.gradient, position: 'relative' }}>

        {/* ── Heading ── */}
        <div style={{
          paddingTop: 64,
          paddingBottom: result?.image ? 0 : 48,
          textAlign: 'center',
          animation: 'rise 0.6s ease-out both',
        }}>
          <div style={{
            fontFamily: 'Sora, sans-serif',
            color: 'white',
            lineHeight: 1,
            userSelect: 'none',
          }}>
            <div style={{ fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 300, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.85 }}>
              Happy
            </div>
            <div style={{ fontSize: 'clamp(72px, 18vw, 160px)', fontWeight: 900, letterSpacing: '-0.03em', marginTop: -8 }}>
              Birthday
            </div>
          </div>
        </div>

        {/* ── Message ── */}
        {result?.message && (
          <div style={{
            maxWidth: 560,
            margin: '0 auto',
            padding: '0 24px 40px',
            textAlign: 'center',
            animation: 'rise 0.6s 0.1s ease-out both',
            opacity: 0,
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.92)',
              fontSize: 'clamp(16px, 3vw, 20px)',
              fontStyle: 'italic',
              fontWeight: 300,
              lineHeight: 1.7,
              letterSpacing: '0.01em',
            }}>
              &ldquo;{result.message}&rdquo;
            </p>
          </div>
        )}

        {/* ── Image: full bleed ── */}
        {result?.image && (
          <div style={{ animation: 'rise 0.6s 0.2s ease-out both', opacity: 0 }}>
            <img
              src={result.image.url}
              alt="Birthday"
              style={{ display: 'block', width: '100%', maxHeight: '80vh', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* ── Audio ── */}
        {result?.music && (
          <div style={{
            padding: '40px 24px 16px',
            maxWidth: 680,
            margin: '0 auto',
            animation: 'rise 0.6s 0.3s ease-out both',
            opacity: 0,
          }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>
              Your Birthday Song
            </p>
            <div style={{
              background: t.playerBg,
              border: `1px solid ${t.playerBorder}`,
              backdropFilter: 'blur(12px)',
              borderRadius: 14,
              padding: '16px 20px',
            }}>
              <audio controls src={result.music.url} style={{ width: '100%', display: 'block' }} preload="metadata" />
            </div>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <button
                onClick={() => handleDownload(result.music!.url, result.music!.fileName)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <Download style={{ width: 12, height: 12 }} />
                Download
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 11,
          letterSpacing: '0.15em',
          padding: '32px 0 40px',
          textTransform: 'uppercase',
        }}>
          <a
            href="https://ammeterventures.com/labs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            ammeterLabs.com
          </a>
        </p>

      </div>
    </>
  );
};

export default ResultDetail;
