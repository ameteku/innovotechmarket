import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Download, Music, ImageIcon, ArrowLeft, Loader2 } from 'lucide-react';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ResultMedia {
  url: string;
  prompt: string;
  fileName: string;
}

interface Result {
  id: string;
  created_at: string;
  music?: ResultMedia;
  image?: ResultMedia;
}

const ResultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      .then(data => {
        setResult(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleDownload = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </button>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading your result…</p>
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="font-heading text-xl font-bold text-foreground mb-2">
              {error === 'Result not found' ? 'Result Not Found' : 'Something went wrong'}
            </p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Generated Content</h1>
              {result.created_at && (
                <p className="text-muted-foreground text-sm mt-1">{formatDate(result.created_at)}</p>
              )}
            </div>

            {/* Image */}
            {result.image && (
              <Card className="overflow-hidden">
                <div className="relative">
                  <img
                    src={result.image.url}
                    alt="Generated image"
                    className="w-full object-cover"
                  />
                </div>
                <CardContent className="pt-4 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 min-w-0">
                      <ImageIcon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.image.prompt}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleDownload(result.image!.url, result.image!.fileName)}
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio */}
            {result.music && (
              <Card>
                <CardContent className="pt-5 pb-5 space-y-4">
                  <audio
                    controls
                    src={result.music.url}
                    className="w-full"
                    preload="metadata"
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 min-w-0">
                      <Music className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.music.prompt}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleDownload(result.music!.url, result.music!.fileName)}
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!result.image && !result.music && (
              <p className="text-center text-muted-foreground py-12">No content available for this result.</p>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ResultDetail;
