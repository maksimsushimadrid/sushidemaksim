import { useState, useCallback } from 'react';
import { Languages, Share2 } from 'lucide-react';

interface TranslateMessageProps {
    originalText: string;
    className?: string;
    textClassName?: string;
    shareUrl?: string;
}

export function TranslateMessage({
    originalText,
    className = '',
    textClassName = 'text-gray-200 text-sm leading-relaxed whitespace-pre-wrap',
    shareUrl,
}: TranslateMessageProps) {
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showTranslated, setShowTranslated] = useState(false);

    // Detect browser language
    const browserLang =
        typeof navigator !== 'undefined' ? navigator.language.split('-')[0].toLowerCase() : 'es';

    const handleTranslate = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (translatedText) {
            setShowTranslated(!showTranslated);
            return;
        }

        setIsLoading(true);
        try {
            // Translate to browser language
            const targetLang = browserLang;

            const res = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
                    originalText
                )}`
            );

            if (!res.ok) throw new Error('Translation failed');

            const data = await res.json();
            const translated = data[0].map((item: any) => item[0]).join('');

            setTranslatedText(translated);
            setShowTranslated(true);
        } catch (error) {
            console.error('Translation error:', error);
            // Fallback: show original on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!shareUrl) return;

            if (navigator.share) {
                navigator.share({
                    title: 'Anuncio en Tablón | Sushi de Maksim',
                    text: originalText.slice(0, 100) + '...',
                    url: shareUrl,
                });
            } else {
                navigator.clipboard.writeText(shareUrl);
                // Simple toast-like feedback could be better but keeping it simple
                alert(
                    browserLang === 'ru'
                        ? 'Ссылка скопирована'
                        : browserLang === 'en'
                          ? 'Link copied'
                          : 'Enlace copiado al portapapeles'
                );
            }
        },
        [shareUrl, originalText, browserLang]
    );

    // Localized labels
    const labels: Record<
        string,
        { translate: string; original: string; translating: string; by: string }
    > = {
        ru: {
            translate: 'Перевести',
            original: 'Оригинал',
            translating: 'Перевод...',
            by: 'Переведено Google',
        },
        en: {
            translate: 'Translate',
            original: 'Show original',
            translating: 'Translating...',
            by: 'Translated by Google',
        },
        es: {
            translate: 'Ver traducción',
            original: 'Ver original',
            translating: 'Traduciendo...',
            by: 'Traducido por Google',
        },
    };

    const currentLabels = labels[browserLang] || labels.es;

    // Show translate button always to allow translating any post language
    const shouldShowTranslate = true;

    return (
        <div className={className} onClick={e => e.stopPropagation()}>
            <p className={textClassName}>
                {showTranslated && translatedText ? translatedText : originalText}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                {shouldShowTranslate && (
                    <button
                        type="button"
                        onClick={handleTranslate}
                        disabled={isLoading}
                        className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-orange-400 font-black transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                    >
                        <Languages size={12} strokeWidth={2.5} />
                        {isLoading
                            ? currentLabels.translating
                            : showTranslated
                              ? currentLabels.original
                              : currentLabels.translate}
                    </button>
                )}

                {shareUrl && (
                    <button
                        type="button"
                        onClick={handleShare}
                        className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-orange-400 font-black transition-colors inline-flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                    >
                        <Share2 size={12} strokeWidth={2.5} />
                        {browserLang === 'ru'
                            ? 'Поделиться'
                            : browserLang === 'en'
                              ? 'Share'
                              : 'Compartir'}
                    </button>
                )}
            </div>

            {showTranslated && (
                <p className="text-[9px] text-gray-700 italic mt-1 animate-fade-in">
                    {currentLabels.by}
                </p>
            )}
        </div>
    );
}
