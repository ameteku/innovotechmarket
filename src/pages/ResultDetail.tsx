import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
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

const colorStyles: Record<string, { bg: string; card: string; text: string; subtext: string; btn: string; loader: string }> = {
  pink: {
    bg: 'bg-gradient-to-br from-pink-400 via-rose-400 to-fuchsia-500',
    card: 'bg-white/20 backdrop-blur-sm border border-white/30',
    text: 'text-white',
    subtext: 'text-white/70',
    btn: 'bg-white/20 hover:bg-white/30 text-white border border-white/40',
    loader: 'text-white',
  },
  black: {
    bg: 'bg-gradient-to-br from-gray-950 via-zinc-900 to-neutral-900',
    card: 'bg-white/10 backdrop-blur-sm border border-white/20',
    text: 'text-white',
    subtext: 'text-white/60',
    btn: 'bg-white/10 hover:bg-white/20 text-white border border-white/30',
    loader: 'text-white',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600',
    card: 'bg-white/20 backdrop-blur-sm border border-white/30',
    text: 'text-white',
    subtext: 'text-white/70',
    btn: 'bg-white/20 hover:bg-white/30 text-white border border-white/40',
    loader: 'text-white',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500 via-rose-500 to-orange-500',
    card: 'bg-white/20 backdrop-blur-sm border border-white/30',
    text: 'text-white',
    subtext: 'text-white/70',
    btn: 'bg-white/20 hover:bg-white/30 text-white border border-white/40',
    loader: 'text-white',
  },
};

const BALLOONS = ['🎈', '🎉', '🎊', '🎂', '🎁', '✨', '🥳', '🎈'];

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

  const styles = colorStyles[result?.bg_color ?? 'pink'];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${colorStyles.pink.bg}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
          <p className="text-white/80 text-sm font-medium">Loading your surprise…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-fuchsia-500">
        <div className="text-center text-white px-6">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-xl font-bold mb-1">{error === 'Result not found' ? 'This celebration has expired' : 'Something went wrong'}</p>
          <p className="text-white/70 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${styles.bg} py-12 px-4`}>
      {/* Floating balloons row */}
      <div className="flex justify-center gap-3 mb-8 text-3xl select-none" aria-hidden>
        {BALLOONS.map((b, i) => (
          <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.12}s`, animationDuration: '1.8s' }}>
            {b}
          </span>
        ))}
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className={`font-heading text-4xl font-extrabold tracking-tight ${styles.text} drop-shadow-lg`}>
            Happy Birthday! 🎂
          </h1>
        </div>

        {/* Custom message */}
        {result?.message && (
          <div className={`${styles.card} rounded-2xl p-6 text-center`}>
            <p className={`text-lg font-medium leading-relaxed ${styles.text}`}>
              {result.message}
            </p>
          </div>
        )}

        {/* Generated image */}
        {result?.image && (
          <div className={`${styles.card} rounded-2xl overflow-hidden`}>
            <img
              src={result.image.url}
              alt="Birthday image"
              className="w-full object-cover"
            />
            <div className="p-4 flex items-center justify-between gap-4">
              <p className={`text-sm ${styles.subtext} truncate`}>🎨 {result.image.prompt}</p>
              <button
                onClick={() => handleDownload(result.image!.url, result.image!.fileName)}
                className={`shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${styles.btn}`}
              >
                <Download className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>
        )}

        {/* Audio player */}
        {result?.music && (
          <div className={`${styles.card} rounded-2xl p-5 space-y-3`}>
            <p className={`text-sm font-semibold ${styles.text}`}>🎵 Your Birthday Song</p>
            <audio
              controls
              src={result.music.url}
              className="w-full"
              preload="metadata"
            />
            <div className="flex items-center justify-between gap-4">
              <p className={`text-sm ${styles.subtext} truncate`}>{result.music.prompt}</p>
              <button
                onClick={() => handleDownload(result.music!.url, result.music!.fileName)}
                className={`shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${styles.btn}`}
              >
                <Download className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className={`text-center text-xs ${styles.subtext} pb-4`}>
          Made with ❤️ · InnovoTech Market
        </p>
      </div>
    </div>
  );
};

export default ResultDetail;
