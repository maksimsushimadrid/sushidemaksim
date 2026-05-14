import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowDown, Flame, Check, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOptimizedImageUrl } from '../../utils/images';
import SafeImage from '../common/SafeImage';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
}

interface CartEmptyViewProps {
    popularItems: MenuItem[];
    isLoadingPopular: boolean;
    handleAddToCart: (item: MenuItem, quantity?: number, isSuggestion?: boolean) => void;
    getCategoryEmoji: (category: string) => string;
    addedItems: Set<number>;
}

export default function CartEmptyView({
    popularItems,
    isLoadingPopular,
    handleAddToCart,
    getCategoryEmoji,
    addedItems,
}: CartEmptyViewProps) {
    return (
        <div className="min-h-[85vh] mesh-bg px-2 md:px-6 py-8 flex flex-col">
            <div className="max-w-4xl mx-auto text-center py-8 md:py-12 w-full flex-1 flex flex-col justify-center">
                <div className="flex justify-center mb-8">
                    <div className="w-28 h-28 bg-white rounded-[40px] flex items-center justify-center animate-float shadow-2xl shadow-orange-500/10 border border-white/50 relative">
                        <div className="absolute inset-0 bg-orange-500/5 rounded-[40px] blur-xl"></div>
                        <ShoppingCart
                            size={48}
                            className="text-orange-500 relative z-10"
                            strokeWidth={1.2}
                        />
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 text-gray-900 tracking-tight text-shadow-sm">
                    Tu cesta está vacía
                </h1>
                <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">
                    <span className="block text-xl md:text-2xl font-black text-gray-900 mb-2">
                        Mira lo que tenemos para ti
                    </span>
                    Añade deliciosos platos o elige una de nuestras sugerencias favoritas.
                </p>
                <div className="flex flex-col items-center gap-4 mb-16">
                    <Link
                        to="/menu"
                        className="btn-premium flex items-center gap-3 bg-gray-900 text-white px-10 py-5 rounded-2xl no-underline font-black shadow-2xl shadow-gray-900/20 active:scale-95 text-xs tracking-widest uppercase"
                    >
                        EXPLORAR CARTA COMPLETA
                        <Plus size={18} />
                    </Link>

                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                        className="text-orange-400/50 mt-10"
                    >
                        <ArrowDown size={24} strokeWidth={2.5} />
                    </motion.div>
                </div>

                {(popularItems.length > 0 || isLoadingPopular) && (
                    <div className="mt-4">
                        <div className="flex flex-col items-center justify-center gap-2 mb-10">
                            <span className="inline-block text-orange-600 text-[10px] font-black uppercase tracking-widest mb-2">
                                RECOMENDACIONES DEL CHEF
                            </span>
                            <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter m-0 flex items-center gap-3 w-full justify-center">
                                <Flame
                                    size={32}
                                    strokeWidth={2}
                                    className="text-orange-600 shrink-0"
                                />
                                <span>Los Favoritos</span>
                                <Flame
                                    size={32}
                                    strokeWidth={2}
                                    className="text-orange-600 shrink-0"
                                />
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-8 text-left">
                            {isLoadingPopular
                                ? [1, 2, 3, 4, 5, 6].map(i => (
                                      <div
                                          key={i}
                                          className="bg-white rounded-[32px] p-4 space-y-4 border border-gray-100"
                                      >
                                          <div className="aspect-[4/3] bg-gray-100 animate-pulse rounded-2xl" />
                                          <div className="space-y-2">
                                              <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded" />
                                              <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded" />
                                          </div>
                                          <div className="flex justify-between items-center pt-2">
                                              <div className="h-6 w-16 bg-gray-100 animate-pulse rounded" />
                                              <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-xl" />
                                          </div>
                                      </div>
                                  ))
                                : popularItems.map(item => (
                                      <div
                                          key={item.id}
                                          className="premium-card premium-card-hover group relative flex flex-col h-full rounded-[28px] md:rounded-[36px] overflow-hidden bg-white/60 backdrop-blur-sm shadow-xl shadow-gray-900/5"
                                      >
                                          <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative border-b border-gray-100">
                                              <SafeImage
                                                  src={item.image}
                                                  alt={item.name}
                                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                  getOptimizedUrl={(url: string) =>
                                                      getOptimizedImageUrl(url, 640)
                                                  }
                                                  fallbackContent={
                                                      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-700">
                                                          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
                                                          <div className="absolute w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
                                                          <span className="text-4xl relative z-10 drop-shadow-2xl translate-y-2">
                                                              {getCategoryEmoji(item.category)}
                                                          </span>
                                                          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                                                      </div>
                                                  }
                                              />
                                              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-full text-orange-600 text-[8px] font-black uppercase tracking-widest shadow-sm border border-orange-100/50">
                                                  Más Vendido
                                              </div>
                                          </div>
                                          <div className="p-4 md:p-6 flex flex-col flex-1">
                                              <div className="mb-2">
                                                  <h3 className="text-[15px] md:text-xl font-black text-gray-900 leading-tight line-clamp-2 md:line-clamp-1 h-10 md:h-auto uppercase tracking-tight">
                                                      {item.name}
                                                  </h3>
                                              </div>
                                              <p className="text-gray-500 text-[11px] md:text-sm leading-tight md:leading-relaxed mb-4 md:mb-6 line-clamp-2 min-h-[2.5rem] md:min-h-0 font-medium">
                                                  {item.description}
                                              </p>
                                              <div className="mt-auto flex items-center justify-between gap-1">
                                                  <span className="text-lg md:text-2xl font-black text-gray-900 whitespace-nowrap">
                                                      {item.price.toFixed(2).replace('.', ',')}€
                                                  </span>
                                                  <button
                                                      onClick={() => handleAddToCart(item)}
                                                      className={`h-9 w-9 md:h-12 md:w-auto md:px-6 rounded-xl md:rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 border-none cursor-pointer flex-shrink-0 ${
                                                          addedItems.has(item.id)
                                                              ? 'bg-green-500 text-white scale-105'
                                                              : 'bg-gray-900 text-white hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/20 active:scale-90 shadow-lg'
                                                      }`}
                                                  >
                                                      {addedItems.has(item.id) ? (
                                                          <Check size={18} strokeWidth={3} />
                                                      ) : (
                                                          <>
                                                              <Plus size={18} strokeWidth={2.5} />
                                                              <span className="hidden md:inline">
                                                                  Añadir
                                                              </span>
                                                          </>
                                                      )}
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
