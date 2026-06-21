import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, RefreshCw, X } from 'lucide-react';
import api from '../lib/api.ts';
import { Product, Category, Brand } from '../types/product.ts';
import ProductGrid from '../components/product/ProductGrid.tsx';
import SEOHead from '../components/seo/SEOHead.tsx';

export const Boutique: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Read initial params
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const searchParam = searchParams.get('search') || '';
  const focusSearch = searchParams.get('focus') === 'search';

  // API State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const promotionsParam = searchParams.get('promotions') === 'true';
  
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedBrand, setSelectedBrand] = useState(brandParam);
  const [priceRange, setPriceRange] = useState<number>(15000);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onlySales, setOnlySales] = useState(promotionsParam);
  const [sortBy, setSortBy] = useState('popularity');

  const colorOptions = [
    { name: 'Noir', hex: '#000000', label: 'Noir' },
    { name: 'Blanc', hex: '#ffffff', border: true, label: 'Blanc' },
    { name: 'Rouge', hex: '#ff1a00', label: 'Rouge' },
    { name: 'Jaune', hex: '#ffcc00', label: 'Jaune' },
    { name: 'Bleu', hex: '#0066cc', label: 'Bleu' },
    { name: 'Vert', hex: '#009933', label: 'Vert' },
    { name: 'Orange', hex: '#ff6600', label: 'Orange' },
    { name: 'Gris', hex: '#999999', label: 'Gris' },
  ];
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Sync category and brand params on navigation
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSelectedBrand(brandParam);
    setOnlySales(searchParams.get('promotions') === 'true');
  }, [categoryParam, brandParam, searchParams]);

  // Load static filter data (Categories and Brands)
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands')
        ]);
        setCategories(catsRes.data || []);
        setBrands(brandsRes.data || []);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadFiltersData();
  }, []);

  // Main products fetcher
  const fetchProducts = async (currentPage = 1, append = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (searchParam) params.append('search', searchParam);
      if (priceRange < 15000) params.append('maxPrice', priceRange.toString());
      if (inStockOnly) params.append('inStockOnly', 'true');
      if (onlySales) params.append('promotions', 'true');
      if (selectedSizes.length > 0) params.append('sizes', selectedSizes.join(','));
      if (selectedColor) params.append('color', selectedColor);
      params.append('sort', sortBy);
      params.append('page', currentPage.toString());
      params.append('limit', '12');

      const response = await api.get(`/products?${params.toString()}`);
      const data = response.data;

      if (append) {
        setProducts(prev => [...prev, ...(data.products || [])]);
      } else {
        setProducts(data.products || []);
      }
      setTotalPages(data.pagination.pages || 1);
      setTotalProducts(data.pagination.total || 0);
    } catch (err) {
      console.error('Error loading products list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch when parameters or sorting change
  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [selectedCategory, selectedBrand, priceRange, inStockOnly, onlySales, sortBy, searchParam, selectedSizes, selectedColor]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, true);
    }
  };

  const handleSizeClick = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(prev => prev.filter(s => s !== size));
    } else {
      setSelectedSizes(prev => [...prev, size]);
    }
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange(15000);
    setInStockOnly(false);
    setOnlySales(false);
    setSelectedSizes([]);
    setSelectedColor('');
    setSearchParams({});
  };

  // Category listing flattener
  const flatCategories = categories.reduce((acc: any[], parent) => {
    acc.push(parent);
    if (parent.subcategories) {
      parent.subcategories.forEach(sub => acc.push({ ...sub, name: `— ${sub.name}` }));
    }
    return acc;
  }, []);

  const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL', '41', '42', '43', '44'];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-16 sm:pt-24 pb-16">
      <SEOHead
        title="Boutique Équipements Moto Maroc | MOTO PACO"
        description="Achetez vos équipements de moto au Maroc au meilleur prix. Casques intégraux, gants racing, bottes moto, protections. Livraison gratuite dès 2000 DH."
      />

      <div className="max-w-[1650px] mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Title and Top Sort Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E5E7EB] pb-4 sm:pb-6 mb-5 sm:mb-8 gap-3">
          <div>
            <h1 className="font-display font-black italic text-2xl sm:text-4xl lg:text-5xl text-[#111827] uppercase tracking-wide">
              {searchParam ? `Résultats : "${searchParam}"` : 'BOUTIQUE MOTO PACO'}
            </h1>
            <p className="text-[#4B5563] text-xs font-mono mt-1 font-bold">
              {totalProducts} PRODUITS TROUVÉS
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#FFFFFF] border border-[#E5E7EB] text-[#111827] px-4 py-2.5 rounded font-display text-xs font-bold uppercase tracking-wider hover:border-[#E63012] transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtres</span>
            </button>

            {/* Sorting Dropdown */}
            <div className="flex-1 sm:flex-none flex items-center bg-[#FFFFFF] border border-[#E5E7EB] rounded px-3 py-2 text-xs font-bold text-[#111827] gap-2 hover:border-[#E63012] transition-colors">
              <ArrowUpDown className="w-4 h-4 text-[#4B5563] shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-[#111827] w-full font-display uppercase tracking-wider text-xs"
              >
                <option value="popularity" className="bg-[#FFFFFF]">Par Popularité</option>
                <option value="price-asc" className="bg-[#FFFFFF]">Prix : Croissant</option>
                <option value="price-desc" className="bg-[#FFFFFF]">Prix : Décroissant</option>
                <option value="newest" className="bg-[#FFFFFF]">Nouveautés</option>
                <option value="rating" className="bg-[#FFFFFF]">Meilleures Notes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            
            {/* Categories filter */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-5 space-y-4">
              <h3 className="text-sm font-display font-extrabold uppercase text-[#111827] tracking-wider border-b border-[#E5E7EB] pb-2">Catégories</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`block text-left text-xs font-bold w-full truncate ${selectedCategory === '' ? 'text-[#E63012]' : 'text-[#4B5563] hover:text-[#111827]'}`}
                >
                  Toutes les catégories
                </button>
                {flatCategories.map((cat: any) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`block text-left text-xs font-bold w-full truncate ${selectedCategory === cat.slug ? 'text-[#E63012]' : 'text-[#4B5563] hover:text-[#111827]'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands filter */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-5 space-y-4">
              <h3 className="text-sm font-display font-extrabold uppercase text-[#111827] tracking-wider border-b border-[#E5E7EB] pb-2">Marques</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                <button
                  onClick={() => setSelectedBrand('')}
                  className={`block text-left text-xs font-bold w-full truncate ${selectedBrand === '' ? 'text-[#E63012]' : 'text-[#4B5563] hover:text-[#111827]'}`}
                >
                  Toutes les marques
                </button>
                {brands.map((brand) => (
                  <button
                    key={brand.slug}
                    onClick={() => setSelectedBrand(brand.slug)}
                    className={`block text-left text-xs font-bold w-full truncate ${selectedBrand === brand.slug ? 'text-[#E63012]' : 'text-[#4B5563] hover:text-[#111827]'}`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Prices filter */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-5 space-y-4">
              <h3 className="text-sm font-display font-extrabold uppercase text-[#111827] tracking-wider border-b border-[#E5E7EB] pb-2">Prix maximum</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min="200"
                  max="15000"
                  step="100"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full accent-[#E63012] cursor-pointer bg-[#F9FAFB] h-1 rounded-lg"
                />
                <div className="flex justify-between text-[11px] font-mono font-bold text-[#4B5563]">
                  <span>200 DH</span>
                  <span className="text-[#E63012]">{priceRange} DH</span>
                </div>
              </div>
            </div>

            {/* Colors filter */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-5 space-y-4">
              <h3 className="text-sm font-display font-extrabold uppercase text-[#111827] tracking-wider border-b border-[#E5E7EB] pb-2">Couleur</h3>
              <div className="flex flex-wrap gap-2.5">
                {colorOptions.map((color) => {
                  const isSelected = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(selectedColor === color.name ? '' : color.name)}
                      className={`w-7 h-7 rounded-full relative transition-transform hover:scale-110 ${
                        color.border ? 'border border-gray-300' : ''
                      } ${isSelected ? 'ring-2 ring-offset-2 ring-[#E63012]' : ''}`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    >
                      {isSelected && (
                        <span 
                          className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${
                            color.name === 'Blanc' || color.name === 'Jaune' ? 'text-black' : 'text-white'
                          }`}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sizes filter */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-5 space-y-4">
              <h3 className="text-sm font-display font-extrabold uppercase text-[#111827] tracking-wider border-b border-[#E5E7EB] pb-2">Tailles</h3>
              <div className="grid grid-cols-4 gap-2">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeClick(size)}
                    className={`border text-[10px] font-mono font-bold py-1.5 rounded transition-colors text-center ${
                      selectedSizes.includes(size)
                        ? 'border-[#E63012] bg-[#E63012]/10 text-[#E63012]'
                        : 'border-[#E5E7EB] bg-transparent text-[#4B5563] hover:border-[#4B5563]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle filters */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827]">En stock seulement</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#E63012] bg-[#F9FAFB] border-[#E5E7EB] rounded focus:ring-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#111827]">En Promotions</span>
                <input
                  type="checkbox"
                  checked={onlySales}
                  onChange={(e) => setOnlySales(e.target.checked)}
                  className="w-4 h-4 accent-[#E63012] bg-[#F9FAFB] border-[#E5E7EB] rounded focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Reset Filters CTA */}
            <button
              onClick={resetFilters}
              className="w-full bg-[#FFFFFF] hover:bg-[#E63012] hover:text-white text-[#4B5563] py-3 rounded text-xs font-display font-bold uppercase tracking-wider border border-[#E5E7EB] transition-colors flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>

          </aside>

          {/* Catalog products grid */}
          <main className="flex-1 space-y-8">
            
            {/* Active filter chips */}
            {(selectedCategory || selectedBrand || priceRange < 15000 || inStockOnly || onlySales || selectedColor || selectedSizes.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 bg-[#FFFFFF] border border-[#E5E7EB] p-3 rounded">
                <span className="text-[10px] font-mono text-[#4B5563] font-bold uppercase tracking-wider mr-2">Filtres actifs:</span>
                
                {selectedCategory && (
                  <span className="inline-flex items-center bg-[#F9FAFB] border border-[#E5E7EB] text-xs px-2.5 py-1 rounded text-[#111827] font-medium">
                    <span>Catégorie: {selectedCategory}</span>
                    <button onClick={() => setSelectedCategory('')} className="ml-1.5 text-[#4B5563] hover:text-[#E63012]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {selectedBrand && (
                  <span className="inline-flex items-center bg-[#F9FAFB] border border-[#E5E7EB] text-xs px-2.5 py-1 rounded text-[#111827] font-medium">
                    <span>Marque: {selectedBrand}</span>
                    <button onClick={() => setSelectedBrand('')} className="ml-1.5 text-[#4B5563] hover:text-[#E63012]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {priceRange < 15000 && (
                  <span className="inline-flex items-center bg-[#F9FAFB] border border-[#E5E7EB] text-xs px-2.5 py-1 rounded text-[#111827] font-medium">
                    <span>Max {priceRange} DH</span>
                    <button onClick={() => setPriceRange(15000)} className="ml-1.5 text-[#4B5563] hover:text-[#E63012]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {selectedColor && (
                  <span className="inline-flex items-center bg-[#F9FAFB] border border-[#E5E7EB] text-xs px-2.5 py-1 rounded text-[#111827] font-medium">
                    <span>Couleur: {selectedColor}</span>
                    <button onClick={() => setSelectedColor('')} className="ml-1.5 text-[#4B5563] hover:text-[#E63012]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {selectedSizes.map(size => (
                  <span key={size} className="inline-flex items-center bg-[#F9FAFB] border border-[#E5E7EB] text-xs px-2.5 py-1 rounded text-[#111827] font-medium">
                    <span>Taille: {size}</span>
                    <button onClick={() => handleSizeClick(size)} className="ml-1.5 text-[#4B5563] hover:text-[#E63012]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}

                {inStockOnly && (
                  <span className="inline-flex items-center bg-[#F9FAFB] border border-[#E5E7EB] text-xs px-2.5 py-1 rounded text-[#111827] font-medium">
                    <span>En stock</span>
                    <button onClick={() => setInStockOnly(false)} className="ml-1.5 text-[#4B5563] hover:text-[#E63012]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {onlySales && (
                  <span className="inline-flex items-center bg-[#F9FAFB] border border-[#E5E7EB] text-xs px-2.5 py-1 rounded text-[#111827] font-medium">
                    <span>En promotion</span>
                    <button onClick={() => setOnlySales(false)} className="ml-1.5 text-[#4B5563] hover:text-[#E63012]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                <button onClick={resetFilters} className="text-xs font-bold text-[#E63012] hover:underline ml-auto">
                  Effacer tout
                </button>
              </div>
            )}

            <ProductGrid products={products} isLoading={isLoading && products.length === 0} />

            {/* Load More Button */}
            {page < totalPages && (
              <div className="text-center pt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#E63012] text-[#111827] px-8 py-4 rounded font-display text-xs font-extrabold uppercase tracking-wider transition-colors inline-flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Chargement...</span>
                    </>
                  ) : (
                    <span>CHARGER PLUS DE PRODUITS</span>
                  )}
                </button>
              </div>
            )}

          </main>

        </div>
      </div>

      {/* Mobile Filters bottom sheet */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)}></div>
          
          <div className="relative w-full max-h-[85vh] bg-[#FFFFFF] border-t border-[#E5E7EB] rounded-t-2xl p-6 overflow-y-auto z-10 flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 bg-[#FFFFFF]">
              <h2 className="section-title">FILTRER LES PRODUITS</h2>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="text-[#4B5563] hover:text-[#E63012]">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Category List */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-[#4B5563] uppercase">Catégories</h3>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-medium rounded p-3 text-[#111827] focus:outline-none"
              >
                <option value="">Toutes les catégories</option>
                {flatCategories.map((cat: any) => (
                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Mobile Brand List */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-[#4B5563] uppercase">Marques</h3>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-[#E5E7EB] text-xs font-medium rounded p-3 text-[#111827] focus:outline-none"
              >
                <option value="">Toutes les marques</option>
                {brands.map((brand) => (
                  <option key={brand.slug} value={brand.slug}>{brand.name}</option>
                ))}
              </select>
            </div>

            {/* Mobile Color picker */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-[#4B5563] uppercase">Couleurs</h3>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => {
                  const isSelected = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(selectedColor === color.name ? '' : color.name)}
                      className={`w-7 h-7 rounded-full relative transition-transform ${
                        color.border ? 'border border-gray-300' : ''
                      } ${isSelected ? 'ring-2 ring-offset-2 ring-[#E63012]' : ''}`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && (
                        <span 
                          className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${
                            color.name === 'Blanc' || color.name === 'Jaune' ? 'text-black' : 'text-white'
                          }`}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Sizes Picker */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-[#4B5563] uppercase">Tailles</h3>
              <div className="flex flex-wrap gap-1.5">
                {sizeOptions.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => handleSizeClick(size)}
                      className={`border text-[10px] font-mono font-bold px-3 py-1.5 rounded transition-colors ${
                        isSelected
                          ? 'border-[#E63012] bg-[#E63012]/10 text-[#E63012]'
                          : 'border-[#E5E7EB] bg-transparent text-[#4B5563]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Price Slider */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono font-bold text-[#4B5563] uppercase">Prix Maximum</h3>
              <input
                type="range"
                min="200"
                max="15000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-full accent-[#E63012] bg-[#F9FAFB] h-1 rounded"
              />
              <div className="flex justify-between text-xs text-[#4B5563] font-mono font-bold">
                <span>200 DH</span>
                <span className="text-[#E63012]">{priceRange} DH</span>
              </div>
            </div>

            {/* Mobile In stock / promo options */}
            <div className="flex space-x-4">
              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`flex-1 border text-center py-3 rounded font-display text-xs font-bold uppercase transition-colors ${
                  inStockOnly ? 'border-[#E63012] bg-[#E63012]/15 text-[#E63012]' : 'border-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                En Stock
              </button>
              <button
                onClick={() => setOnlySales(!onlySales)}
                className={`flex-1 border text-center py-3 rounded font-display text-xs font-bold uppercase transition-colors ${
                  onlySales ? 'border-[#E63012] bg-[#E63012]/15 text-[#E63012]' : 'border-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                Promotions
              </button>
            </div>

            <div className="flex space-x-4 pt-4 border-t border-[#E5E7EB]">
              <button
                onClick={() => {
                  resetFilters();
                  setIsMobileFiltersOpen(false);
                }}
                className="flex-1 bg-[#E5E7EB] py-3.5 text-xs text-[#4B5563] font-display font-bold uppercase rounded text-center"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 bg-[#E63012] py-3.5 text-xs text-white font-display font-bold uppercase rounded text-center shadow red-glow"
              >
                Appliquer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Boutique;
