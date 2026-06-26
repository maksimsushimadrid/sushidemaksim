import { Link, useLocation } from 'react-router-dom';

interface HeaderLogoProps {
    isTable: boolean;
    isScrolled: boolean;
    isTransparentHeaderPage: boolean;
    setShowMobileMenu: (show: boolean) => void;
}

export default function HeaderLogo({
    isTable,
    isScrolled,
    isTransparentHeaderPage,
    setShowMobileMenu,
}: HeaderLogoProps) {
    const location = useLocation();
    const targetPath = isTable ? '/table' : '/';
    const isAlreadyOnTarget = location.pathname === targetPath;

    return (
        <div
            className={`flex-1 flex items-center h-full ${isTable ? 'justify-end' : 'justify-start'}`}
        >
            <Link
                to={targetPath}
                onClick={e => {
                    if (isTable) {
                        e.preventDefault();
                    }
                    setShowMobileMenu(false);

                    // Only scroll to top if we're already on the target page.
                    // If navigating to a different page, let React Router handle it cleanly
                    // without interfering with scroll — the PageWrapper will handle scroll reset.
                    if (isAlreadyOnTarget) {
                        if ((window as any).lenis) {
                            (window as any).lenis.scrollTo(0, { immediate: true });
                        } else {
                            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
                        }
                    }
                }}
                className="flex items-center no-underline gap-0 group h-full"
            >
                <div
                    className={`
                        transition-all duration-500 shrink-0 flex items-center justify-center
                        md:bg-orange-600 md:h-full md:w-[200px]
                        bg-transparent h-16 w-auto px-1
                    `}
                >
                    <img
                        src="/logo.svg"
                        alt="Sushi de Maksim"
                        width={140}
                        height={56}
                        className={`
                            h-10 md:h-14 w-auto object-contain transition-all duration-500
                            ${
                                isTable
                                    ? 'brightness-0 invert'
                                    : isScrolled || !isTransparentHeaderPage
                                      ? 'brightness-0 md:invert'
                                      : 'brightness-0 invert'
                            }
                        `}
                    />
                </div>
            </Link>
        </div>
    );
}
