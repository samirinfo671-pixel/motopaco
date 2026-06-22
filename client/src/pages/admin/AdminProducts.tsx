import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Save, Check, AlertTriangle, Loader2, Star, Flame, Bold, Italic, Heading1, Heading2, List, Link as LinkIcon, Image as ImageIcon, Percent, AlertOctagon } from 'lucide-react';
import api from '../../lib/api.ts';
import { Product, Category, Brand } from '../../types/product.ts';
import { formatPrice } from '../../lib/formatters.ts';
import AdminLayout from '../../components/admin/AdminLayout.tsx';

const DEFAULT_TEMPLATES = [
  {
    name: 'Casques Standard (XS - XXL)',
    variants: [
      { size: 'XS', color: 'Noir Mat', stock: 5, description: 'Taille XS (53-54 cm)' },
      { size: 'S', color: 'Noir Mat', stock: 5, description: 'Taille S (55-56 cm)' },
      { size: 'M', color: 'Noir Mat', stock: 10, description: 'Taille M (57-58 cm)' },
      { size: 'L', color: 'Noir Mat', stock: 10, description: 'Taille L (59-60 cm)' },
      { size: 'XL', color: 'Noir Mat', stock: 5, description: 'Taille XL (61-62 cm)' },
      { size: 'XXL', color: 'Noir Mat', stock: 2, description: 'Taille XXL (63-64 cm)' }
    ]
  },
  {
    name: 'Bottes Standard (40 - 45)',
    variants: [
      { size: '40', color: 'Noir', stock: 5, description: 'Pointure 40' },
      { size: '41', color: 'Noir', stock: 5, description: 'Pointure 41' },
      { size: '42', color: 'Noir', stock: 10, description: 'Pointure 42' },
      { size: '43', color: 'Noir', stock: 10, description: 'Pointure 43' },
      { size: '44', color: 'Noir', stock: 5, description: 'Pointure 44' },
      { size: '45', color: 'Noir', stock: 2, description: 'Pointure 45' }
    ]
  },
  {
    name: 'Gants Standard (S - XL)',
    variants: [
      { size: 'S', color: 'Noir', stock: 5, description: 'Taille S' },
      { size: 'M', color: 'Noir', stock: 10, description: 'Taille M' },
      { size: 'L', color: 'Noir', stock: 10, description: 'Taille L' },
      { size: 'XL', color: 'Noir', stock: 5, description: 'Taille XL' }
    ]
  },
  {
    name: 'Taille Unique',
    variants: [
      { size: 'Taille Unique', color: 'Standard', stock: 10, description: 'Taille universelle unique' }
    ]
  }
];

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Sync value from props to editor ONLY if content is different to prevent cursor jumps
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '<p><br></p>';
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const addLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) exec('createLink', url);
  };

  const addImage = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) exec('insertImage', url);
  };

  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden bg-black/30">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 bg-[#1F2937]/50 border-b border-gray-700 p-2">
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 hover:bg-[#E63012]/10 hover:text-[#E63012] text-gray-400 rounded transition-colors"
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 hover:bg-[#E63012]/10 hover:text-[#E63012] text-gray-400 rounded transition-colors"
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<h1>')}
          className="p-1.5 hover:bg-[#E63012]/10 hover:text-[#E63012] text-gray-400 rounded transition-colors"
          title="Titre H1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<h2>')}
          className="p-1.5 hover:bg-[#E63012]/10 hover:text-[#E63012] text-gray-400 rounded transition-colors"
          title="Titre H2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="p-1.5 hover:bg-[#E63012]/10 hover:text-[#E63012] text-gray-400 rounded transition-colors"
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={addLink}
          className="p-1.5 hover:bg-[#E63012]/10 hover:text-[#E63012] text-gray-400 rounded transition-colors"
          title="Lien hypertexte"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="p-1.5 hover:bg-[#E63012]/10 hover:text-[#E63012] text-gray-400 rounded transition-colors"
          title="Ajouter une image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="bg-black/50 min-h-[180px] max-h-[350px] overflow-y-auto px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-0 leading-relaxed html-description custom-scrollbar"
        style={{ minHeight: '180px' }}
      />
    </div>
  );
};

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Form toggle states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [desc, setDesc] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [soldCount, setSoldCount] = useState<number>(0);
  const [isFeatured, setIsFeatured] = useState<number>(0);
  const [isBestseller, setIsBestseller] = useState<number>(0);
  const [isPromoFeatured, setIsPromoFeatured] = useState<number>(0);
  const [isOutOfStock, setIsOutOfStock] = useState<number>(0);
  const [productImages, setProductImages] = useState<any[]>([]);

  // Variants editor list: array of { size, color, sku, stock, image_url, description, price_override }
  const [variantsList, setVariantsList] = useState<Array<{ size: string; color: string; sku: string; stock: number; image_url?: string | null; description?: string | null; price_override?: number | null }>>([]);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newStock, setNewStock] = useState(10);
  const [newPriceOverride, setNewPriceOverride] = useState<number | ''>('');

  // Bulk Generator State
  const [bulkSizes, setBulkSizes] = useState<string[]>([]);
  const [bulkColors, setBulkColors] = useState<string>('');
  const [bulkBaseSku, setBulkBaseSku] = useState<string>('');
  const PREDEFINED_SIZES = ['Taille Unique', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '39', '40', '41', '42', '43', '44', '45', '46'];
  // Custom templates state
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [templateNameInput, setTemplateNameInput] = useState('');

  // Image upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      await loadFilterOptions();
      await loadProducts();
    };
    init();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/products');
      const loadedProducts = res.data || [];
      setProducts(loadedProducts);

      // Support editing from URL param ?edit=ID
      const params = new URLSearchParams(window.location.search);
      const editIdStr = params.get('edit');
      if (editIdStr) {
        const editId = parseInt(editIdStr, 10);
        const match = loadedProducts.find((p: Product) => p.id === editId);
        if (match) {
          handleOpenEdit(match);
        }
      }
    } catch (err) {
      console.error('Error fetching admin products list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [catsRes, brandsRes, settingsRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/brands'),
        api.get('/admin/settings')
      ]);
      setCategories(catsRes.data || []);
      setBrands(brandsRes.data || []);
      if (settingsRes.data && settingsRes.data.variant_templates) {
        try {
          setCustomTemplates(JSON.parse(settingsRes.data.variant_templates));
        } catch (e) {
          console.error('Error parsing variant templates:', e);
        }
      }
    } catch (err) {
      console.error('Error loading admin catalog options:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setShortDesc('');
    setDesc('');
    setCategoryId(categories.length > 0 ? categories[0].id.toString() : '');
    setBrandId(brands.length > 0 ? brands[0].id.toString() : '');
    setBasePrice('');
    setSalePrice('');
    setStatus('published');
    setMetaTitle('');
    setMetaDesc('');
    setSoldCount(0);
    setIsFeatured(0);
    setIsBestseller(0);
    setIsPromoFeatured(0);
    setIsOutOfStock(0);
    setProductImages([]);
    setVariantsList([{ size: 'Taille Unique', color: 'Standard', sku: '', stock: 10, image_url: null, description: null }]);
    setSelectedFile(null);
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setShortDesc(p.short_description);
    setDesc(p.description);
    setCategoryId(p.category_id ? p.category_id.toString() : '');
    setBrandId(p.brand_id ? p.brand_id.toString() : '');
    setBasePrice(p.base_price.toString());
    setSalePrice(p.sale_price !== null ? p.sale_price.toString() : '');
    setStatus(p.status);
    setMetaTitle(p.meta_title);
    setMetaDesc(p.meta_description);
    setSoldCount(p.sold_count || 0);
    setIsFeatured(p.is_featured || 0);
    setIsBestseller(p.is_bestseller || 0);
    setIsPromoFeatured(p.is_promo_featured || 0);
    setIsOutOfStock(p.is_out_of_stock || 0);
    setProductImages(p.images || []);
    
    // Set variants list from backend data
    const vars = p.variants?.map(v => ({
      size: v.size || 'Taille Unique',
      color: v.color || 'Standard',
      sku: v.sku,
      stock: v.stock,
      image_url: v.image_url || null,
      description: v.description || null,
      price_override: v.price_override || null
    })) || [];
    setVariantsList(vars);
    setSelectedFile(null);
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleDuplicate = (p: Product) => {
    setEditingProduct(null); // Force creation of a new product
    setName(p.name + ' (Copie)');
    setShortDesc(p.short_description);
    setDesc(p.description);
    setCategoryId(p.category_id ? p.category_id.toString() : '');
    setBrandId(p.brand_id ? p.brand_id.toString() : '');
    setBasePrice(p.base_price.toString());
    setSalePrice(p.sale_price !== null ? p.sale_price.toString() : '');
    setStatus('draft'); // Set draft by default to avoid accidental publication
    setMetaTitle(p.meta_title);
    setMetaDesc(p.meta_description);
    setSoldCount(0); // Reset sales for copy
    setIsFeatured(p.is_featured || 0);
    setIsBestseller(p.is_bestseller || 0);
    setIsPromoFeatured(p.is_promo_featured || 0);
    setIsOutOfStock(p.is_out_of_stock || 0);
    setProductImages([]); // Empty gallery for copy
    
    // Copy variants
    const vars = p.variants?.map(v => ({
      size: v.size || 'Taille Unique',
      color: v.color || 'Standard',
      sku: v.sku + '-COPY',
      stock: v.stock,
      image_url: null, // Don't copy variant images
      description: v.description || null,
      price_override: v.price_override || null
    })) || [];
    setVariantsList(vars);
    setSelectedFile(null);
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit de la base MOTO PACO ?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Voulez-vous vraiment supprimer ${selectedIds.length} produits ?`)) return;
    
    try {
      await api.delete('/admin/products/bulk', { data: { ids: selectedIds } });
      setSelectedIds([]);
      loadProducts();
    } catch (err) {
      console.error('Error bulk deleting products:', err);
      alert('Erreur lors de la suppression groupée.');
    }
  };

  const handleBulkUpdateStatus = async (newStatus: 'published' | 'draft' | 'archived') => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Voulez-vous passer ${selectedIds.length} produits en statut "${newStatus}" ?`)) return;
    
    try {
      await api.put('/admin/products/bulk', { ids: selectedIds, status: newStatus });
      setSelectedIds([]);
      loadProducts();
    } catch (err) {
      console.error('Error bulk updating status:', err);
      alert('Erreur lors de la mise à jour groupée.');
    }
  };

  // Add a variant row in memory
  const handleAddVariantRow = () => {
    const size = newSize.trim() || 'Taille Unique';
    const color = newColor.trim() || 'Standard';
    const slugifiedName = name ? name.substring(0, 5).replace(/\s+/g, '-').toUpperCase() : 'PROD';
    const sizePart = size.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const colorPart = color.toUpperCase().substring(0, 3).replace(/[^A-Z0-9]/g, '');
    const uniqueSuffix = Math.floor(Math.random() * 1000);
    const sku = `${slugifiedName}-${sizePart}-${colorPart}-${uniqueSuffix}`;

    setVariantsList(prev => [...prev, { size, color, sku, stock: newStock, image_url: null, description: null, price_override: newPriceOverride === '' ? null : newPriceOverride }]);
    setNewSize('');
    setNewColor('');
    setNewStock(10);
    setNewPriceOverride('');
  };

  const handleApplyBulkStock = () => {
    if (variantsList.length === 0) return;
    if (!window.confirm(`Appliquer un stock de ${newStock} à toutes les ${variantsList.length} variantes ?`)) return;
    setVariantsList(prev => prev.map(v => ({ ...v, stock: newStock })));
  };

  const handleApplyBulkPrice = () => {
    if (variantsList.length === 0) return;
    if (!window.confirm(`Appliquer le prix spécial ${newPriceOverride === '' ? 'vide' : newPriceOverride + ' DH'} à toutes les variantes ?`)) return;
    setVariantsList(prev => prev.map(v => ({ ...v, price_override: newPriceOverride === '' ? null : newPriceOverride })));
  };

  const handleApplyBulkSkuPrefix = () => {
    if (!bulkBaseSku || variantsList.length === 0) return;
    if (!window.confirm(`Générer automatiquement les SKU (Préfixe-Taille-Couleur) pour toutes les variantes ?`)) return;
    setVariantsList(prev => prev.map(v => ({ 
      ...v, 
      sku: `${bulkBaseSku}-${v.size}-${v.color}`.replace(/\s+/g, '-').toUpperCase() 
    })));
  };

  const handleGenerateBulkVariants = () => {
    if (bulkSizes.length === 0) {
      alert("Veuillez sélectionner au moins une taille.");
      return;
    }
    const colorArray = bulkColors.split(',').map(c => c.trim()).filter(c => c);
    if (colorArray.length === 0) colorArray.push('Standard');

    const newVars: typeof variantsList = [];
    colorArray.forEach(color => {
      bulkSizes.forEach(size => {
        newVars.push({
          size,
          color,
          sku: bulkBaseSku ? `${bulkBaseSku}-${size}-${color}`.replace(/\s+/g, '-').toUpperCase() : '',
          stock: newStock,
          price_override: newPriceOverride === '' ? null : newPriceOverride
        });
      });
    });
    setVariantsList(prev => [...prev, ...newVars]);
    setBulkSizes([]);
    setBulkColors('');
  };

  const handleClearVariants = () => {
    if (!window.confirm('Voulez-vous vraiment vider tout le tableau des variantes ?')) return;
    setVariantsList([]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setVariantsList(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setVariantsList(prev => prev.map((v, idx) => idx === index ? { ...v, [field]: value } : v));
  };

  const handleApplyTemplate = (template: any) => {
    if (!template) return;
    const newVars = template.variants.map((v: any, index: number) => {
      const slugifiedName = name ? name.substring(0, 5).replace(/\s+/g, '-').toUpperCase() : 'PROD';
      const sizePart = v.size.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const colorPart = v.color.toUpperCase().substring(0, 3).replace(/[^A-Z0-9]/g, '');
      const uniqueSuffix = Math.floor(Math.random() * 100) + index;
      const sku = `${slugifiedName}-${sizePart}-${colorPart}-${uniqueSuffix}`;
      
      return {
        size: v.size,
        color: v.color,
        stock: v.stock || 10,
        sku: sku,
        image_url: v.image_url || null,
        description: v.description || null
      };
    });
    setVariantsList(newVars);
  };

  const handleSaveAsTemplate = async () => {
    if (!templateNameInput.trim()) {
      alert('Veuillez entrer un nom pour le modèle.');
      return;
    }
    if (variantsList.length === 0) {
      alert('Veuillez ajouter au moins une variante pour créer un modèle.');
      return;
    }
    
    const newTemplate = {
      name: templateNameInput.trim(),
      variants: variantsList.map(v => ({
        size: v.size,
        color: v.color,
        stock: v.stock,
        image_url: v.image_url || null,
        description: v.description || null
      }))
    };
    
    const updatedTemplates = [newTemplate, ...customTemplates];
    try {
      await api.put('/admin/settings', {
        variant_templates: JSON.stringify(updatedTemplates)
      });
      setCustomTemplates(updatedTemplates);
      setTemplateNameInput('');
      alert('Modèle de variante enregistré avec succès !');
    } catch (err) {
      console.error('Error saving variant template:', err);
      alert("Erreur lors de l'enregistrement du modèle.");
    }
  };

  const handleSetPrimaryImage = async (imageId: number) => {
    if (!editingProduct) return;
    try {
      await api.put(`/admin/products/${editingProduct.id}/images/${imageId}/primary`);
      const res = await api.get('/admin/products');
      const updatedP = res.data.find((x: any) => x.id === editingProduct.id);
      if (updatedP) {
        setProductImages(updatedP.images || []);
        setEditingProduct(updatedP);
      }
      loadProducts();
    } catch (err) {
      console.error('Error setting primary image:', err);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!editingProduct) return;
    if (!window.confirm('Voulez-vous vraiment supprimer cette image de la galerie ?')) return;
    try {
      await api.delete(`/admin/products/${editingProduct.id}/images/${imageId}`);
      const res = await api.get('/admin/products');
      const updatedP = res.data.find((x: any) => x.id === editingProduct.id);
      if (updatedP) {
        setProductImages(updatedP.images || []);
        setEditingProduct(updatedP);
      }
      loadProducts();
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  const handleUploadGalleryImage = async (file: File) => {
    if (!editingProduct) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      setIsSubmitting(true);
      await api.post(`/admin/products/${editingProduct.id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const res = await api.get('/admin/products');
      const updatedP = res.data.find((x: any) => x.id === editingProduct.id);
      if (updatedP) {
        setProductImages(updatedP.images || []);
        setEditingProduct(updatedP);
      }
      loadProducts();
    } catch (err) {
      console.error('Error uploading gallery image:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !basePrice) {
      setErrorMsg('Veuillez remplir le nom et le prix de base.');
      return;
    }

    setIsSubmitting(true);
    try {
      const productPayload = {
        name,
        short_description: shortDesc,
        description: desc,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        brand_id: brandId ? parseInt(brandId, 10) : null,
        base_price: parseFloat(basePrice),
        sale_price: salePrice ? parseFloat(salePrice) : null,
        status,
        meta_title: metaTitle,
        meta_description: metaDesc,
        sold_count: soldCount,
        is_featured: isFeatured,
        is_bestseller: isBestseller,
        is_promo_featured: isPromoFeatured,
        is_out_of_stock: isOutOfStock,
        variants: variantsList
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        // Edit product
        await api.put(`/admin/products/${editingProduct.id}`, productPayload);
      } else {
        // Add product
        const response = await api.post('/admin/products', productPayload);
        productId = response.data.id;
      }

      // Handle Image file upload if selected
      if (selectedFile && productId) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        await api.post(`/admin/products/${productId}/images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setIsFormOpen(false);
      loadProducts();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la sauvegarde du produit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-30 -mx-8 px-8 pt-4">
          <div>
            <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">Gestion des Produits</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Créez, modifiez et configurez le catalogue d'équipements MOTO PACO.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-[#E63012] hover:bg-white hover:text-black text-white px-6 py-3.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all duration-300 inline-flex items-center space-x-2 shadow-[0_0_20px_rgba(230,48,18,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" />
            <span>Ajouter un Produit</span>
          </button>
        </div>

        {/* LIST TABLE VIEW */}
        {!isFormOpen ? (
          isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-10 h-10 animate-spin text-[#E63012]" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bulk Actions Toolbar */}
              {selectedIds.length > 0 && (
                <div className="bg-[#E63012]/10 border border-[#E63012]/30 text-white p-4 rounded-xl flex items-center justify-between shadow-[0_0_30px_rgba(230,48,18,0.1)] animate-in slide-in-from-bottom-2 sticky top-28 z-20 backdrop-blur-xl">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black uppercase tracking-widest text-[#E63012]">{selectedIds.length} sélectionné(s)</span>
                    <button onClick={() => setSelectedIds([])} className="text-xs text-gray-400 hover:text-white transition-colors">Annuler la sélection</button>
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkUpdateStatus(e.target.value as any);
                          e.target.value = '';
                        }
                      }}
                      className="bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-white focus:outline-none focus:border-[#E63012] cursor-pointer"
                    >
                      <option value="" className="text-black">Modifier le statut...</option>
                      <option value="published" className="text-black">Publier</option>
                      <option value="draft" className="text-black">Passer en brouillon</option>
                      <option value="archived" className="text-black">Archiver</option>
                    </select>
                    <button
                      onClick={handleBulkDelete}
                      className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border border-red-500/30 hover:border-red-500"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5px]" />
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 bg-black/40 text-gray-400 font-mono uppercase tracking-widest">
                      <th className="p-5 w-12 text-center">
                        <input 
                          type="checkbox" 
                          className="cursor-pointer rounded border-gray-700 bg-gray-900 text-[#E63012] focus:ring-[#E63012] focus:ring-offset-gray-900"
                          checked={products.length > 0 && selectedIds.length === products.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-5 w-20">Visuel</th>
                      <th className="p-5">Nom / SKU</th>
                      <th className="p-5">Catégorie</th>
                      <th className="p-5">Marque</th>
                      <th className="p-5 text-right">Prix (DH)</th>
                      <th className="p-5 text-center">Stock</th>
                      <th className="p-5 text-center">Accueil / Promos</th>
                      <th className="p-5 text-center">Statut</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {products.map((p) => (
                      <tr key={p.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.includes(p.id) ? 'bg-[#E63012]/5' : ''}`}>
                        <td className="p-5 text-center">
                          <input 
                            type="checkbox" 
                            className="cursor-pointer rounded border-gray-700 bg-gray-900 text-[#E63012] focus:ring-[#E63012] focus:ring-offset-gray-900"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => handleSelect(p.id)}
                          />
                        </td>
                        <td className="p-5">
                          <img
                            src={p.primary_image || 'https://placehold.co/100x100/111827/4B5563?text=NO+IMG'}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 object-cover rounded-lg bg-gray-900 border border-gray-800 shadow-lg group-hover:scale-105 transition-transform"
                          />
                        </td>
                        <td className="p-5 min-w-[200px]">
                          <p className="font-bold text-white text-sm leading-tight group-hover:text-[#E63012] transition-colors">{p.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-wider">SLUG: {p.slug}</p>
                        </td>
                        <td className="p-5 text-gray-400 font-medium">{p.category_name || 'N/A'}</td>
                        <td className="p-5 text-gray-400 font-medium">{p.brand_name || 'N/A'}</td>
                        <td className="p-5 text-right font-mono font-bold text-white text-sm">
                          {p.sale_price !== null ? (
                            <div className="flex flex-col items-end">
                              <p className="text-[10px] text-gray-500 line-through decoration-red-500/50">{formatPrice(p.base_price)}</p>
                              <p className="text-[#E63012]">{formatPrice(p.sale_price)}</p>
                            </div>
                          ) : (
                            <span>{formatPrice(p.base_price)}</span>
                          )}
                        </td>
                        <td className="p-5 text-center font-mono font-bold text-gray-400">
                          <span className={p.total_stock && p.total_stock <= 5 ? 'text-yellow-400 font-black bg-yellow-400/10 px-2 py-1 rounded' : ''}>
                            {p.total_stock ?? 0}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await api.put(`/admin/products/${p.id}/toggle-featured`);
                                  loadProducts();
                                } catch (err) {
                                  console.error('Error toggling featured:', err);
                                }
                              }}
                              className={`p-1 transition-all duration-300 hover:scale-125 ${p.is_featured ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'}`}
                              title={p.is_featured ? "Retirer de la page d'accueil" : "Mettre en avant sur la page d'accueil"}
                            >
                              <Star className={`w-4 h-4 ${p.is_featured ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await api.put(`/admin/products/${p.id}/toggle-bestseller`);
                                  loadProducts();
                                } catch (err) {
                                  console.error('Error toggling bestseller:', err);
                                }
                              }}
                              className={`p-1 transition-all duration-300 hover:scale-125 ${p.is_bestseller ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
                              title={p.is_bestseller ? "Retirer des Best Sellers" : "Ajouter aux Best Sellers"}
                            >
                              <Flame className={`w-4.5 h-4.5 ${p.is_bestseller ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await api.put(`/admin/products/${p.id}/toggle-promo-featured`);
                                  loadProducts();
                                } catch (err) {
                                  console.error('Error toggling promo featured:', err);
                                }
                              }}
                              className={`p-1 transition-all duration-300 hover:scale-125 ${p.is_promo_featured ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}`}
                              title={p.is_promo_featured ? "Retirer de la section promotionnelle" : "Ajouter à la section promotionnelle"}
                            >
                              <Percent className={`w-4 h-4 ${p.is_promo_featured ? 'stroke-[3px]' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await api.put(`/admin/products/${p.id}/toggle-outofstock`);
                                  loadProducts();
                                } catch (err) {
                                  console.error('Error toggling outofstock:', err);
                                }
                              }}
                              className={`p-1 transition-all duration-300 hover:scale-125 ${p.is_out_of_stock ? 'text-red-500 font-bold' : 'text-gray-600 hover:text-red-500'}`}
                              title={p.is_out_of_stock ? "Remettre en stock" : "Forcer en rupture de stock"}
                            >
                              <AlertOctagon className={`w-4.5 h-4.5 ${p.is_out_of_stock ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            p.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            p.status === 'draft' ? 'bg-gray-700/50 text-gray-300 border border-gray-600' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {p.status === 'published' ? 'Publié' : p.status === 'draft' ? 'Brouillon' : 'Archivé'}
                          </span>
                        </td>
                        <td className="p-5 text-right space-x-2 shrink-0">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-2.5 bg-gray-800 text-gray-400 hover:text-white hover:bg-[#E63012] border border-gray-700 hover:border-[#E63012] rounded-lg transition-all duration-300 shadow-sm"
                            aria-label="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p)}
                            className="p-2.5 bg-gray-800 text-gray-400 hover:text-white hover:bg-blue-600 border border-gray-700 hover:border-blue-600 rounded-lg transition-all duration-300 shadow-sm"
                            aria-label="Dupliquer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2.5 bg-gray-800 text-gray-400 hover:text-white hover:bg-red-600 border border-gray-700 hover:border-red-600 rounded-lg transition-all duration-300 shadow-sm"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-gray-500 font-medium">Aucun produit trouvé.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )
        ) : (
          /* FORM SUB-PAGE VIEW */
          <div className="bg-[#111827]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 space-y-8 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-gray-800 pb-6 sticky top-[90px] bg-[#111827]/95 backdrop-blur-xl z-20 -mx-8 px-8 pt-4 shadow-sm">
              <h2 className="font-display font-black text-2xl uppercase tracking-widest text-white flex items-center gap-3">
                <span className="w-2 h-8 bg-[#E63012] rounded-full inline-block"></span>
                {editingProduct ? `MODIFIER : ${editingProduct.name}` : 'AJOUTER UN NOUVEAU PRODUIT'}
              </h2>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 hover:bg-white/5 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-300"
                >
                  Annuler
                </button>
                <button
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                  className="bg-[#E63012] hover:bg-white hover:text-black text-white px-8 py-2.5 rounded-lg font-display text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(230,48,18,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5px]" />}
                  <span>{editingProduct ? 'Mettre à jour' : 'Sauvegarder'}</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-bold flex items-center space-x-3 shadow-inner">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-8">
              
              {/* Product Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Left col: inputs details */}
                <div className="md:col-span-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom du produit *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-black/50 border border-gray-700 rounded-xl px-5 py-3.5 text-sm text-white w-full focus:outline-none focus:border-[#E63012] focus:ring-1 focus:ring-[#E63012] transition-all"
                      placeholder="Ex: Casque Shoei NXR2"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description Courte *</label>
                    <input
                      type="text"
                      required
                      value={shortDesc}
                      onChange={(e) => setShortDesc(e.target.value)}
                      className="bg-black/50 border border-gray-700 rounded-xl px-5 py-3.5 text-sm text-white w-full focus:outline-none focus:border-[#E63012] focus:ring-1 focus:ring-[#E63012] transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description Détaillée</label>
                    <RichTextEditor
                      value={desc}
                      onChange={(val) => setDesc(val)}
                    />
                  </div>
                </div>

                {/* Right col: details/categorization settings */}
                <div className="md:col-span-4 space-y-6">
                  <div className="bg-white/5 border border-gray-800 rounded-xl p-5 space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie *</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] cursor-pointer"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marque *</label>
                      <select
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                        className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] cursor-pointer"
                      >
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prix Normal *</label>
                        <input
                          type="number"
                          required
                          value={basePrice}
                          onChange={(e) => setBasePrice(e.target.value)}
                          className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prix Promo</label>
                        <input
                          type="number"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Ventes (Social Proof)</label>
                      <input
                        type="number"
                        value={soldCount}
                        onChange={(e) => setSoldCount(parseInt(e.target.value, 10) || 0)}
                        className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012] font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-lg">
                      <span className="text-xs font-bold text-gray-300">Mis en avant (Page d'accueil)</span>
                      <input
                        type="checkbox"
                        checked={isFeatured === 1}
                        onChange={(e) => setIsFeatured(e.target.checked ? 1 : 0)}
                        className="w-4 h-4 accent-[#E63012] bg-[#F9FAFB] border-gray-700 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-lg">
                      <span className="text-xs font-bold text-gray-300">Best Seller</span>
                      <input
                        type="checkbox"
                        checked={isBestseller === 1}
                        onChange={(e) => setIsBestseller(e.target.checked ? 1 : 0)}
                        className="w-4 h-4 accent-[#E63012] bg-[#F9FAFB] border-gray-700 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-lg">
                      <span className="text-xs font-bold text-gray-300">Afficher dans la section des promotions</span>
                      <input
                        type="checkbox"
                        checked={isPromoFeatured === 1}
                        onChange={(e) => setIsPromoFeatured(e.target.checked ? 1 : 0)}
                        className="w-4 h-4 accent-[#E63012] bg-[#F9FAFB] border-gray-700 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/40 border border-gray-800 rounded-lg">
                      <span className="text-xs font-bold text-gray-300">Rupture de stock manuelle</span>
                      <input
                        type="checkbox"
                        checked={isOutOfStock === 1}
                        onChange={(e) => setIsOutOfStock(e.target.checked ? 1 : 0)}
                        className="w-4 h-4 accent-[#E63012] bg-[#F9FAFB] border-gray-700 rounded cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut Publication</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none cursor-pointer"
                      >
                        <option value="published">Publié</option>
                        <option value="draft">Brouillon / Masqué</option>
                        <option value="archived">Archivé</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>

              {/* Variants Matrix Section */}
              <div className="bg-white/5 border border-gray-800 rounded-2xl p-6 space-y-6">
                <h3 className="text-xs font-mono font-black text-[#E63012] uppercase tracking-widest border-b border-gray-800 pb-4">
                  Configuration des Variantes (Tailles & Couleurs)
                </h3>
                
                {/* Variant Templates Card */}
                <div className="bg-black/50 p-6 rounded-xl border border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-inner">
                  {/* Left: Load Template */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Appliquer un modèle prédéfini</label>
                    <div className="flex gap-3">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const parts = val.split(':');
                          const isCustom = parts[0] === 'custom';
                          const index = parseInt(parts[1], 10);
                          const t = isCustom ? customTemplates[index] : DEFAULT_TEMPLATES[index];
                          handleApplyTemplate(t);
                          e.target.value = ''; // Reset select
                        }}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-xs text-white flex-1 focus:outline-none focus:border-[#E63012] cursor-pointer font-bold"
                      >
                        <option value="">-- Choisir un modèle --</option>
                        <optgroup label="Modèles Système">
                          {DEFAULT_TEMPLATES.map((t, idx) => (
                            <option key={`sys:${idx}`} value={`sys:${idx}`}>{t.name}</option>
                          ))}
                        </optgroup>
                        {customTemplates.length > 0 && (
                          <optgroup label="Modèles Personnalisés">
                            {customTemplates.map((t, idx) => (
                              <option key={`custom:${idx}`} value={`custom:${idx}`}>{t.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={handleClearVariants}
                        className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-xs font-black uppercase px-4 py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center shadow-sm"
                        title="Vider tout le tableau des variantes"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">
                      L'application d'un modèle remplacera toutes les variantes configurées ci-dessous.
                    </p>
                  </div>

                  {/* Right: Save Template */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Enregistrer ces variantes comme modèle</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Ex: Tailles Casque AGV"
                        value={templateNameInput}
                        onChange={(e) => setTemplateNameInput(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-xs text-white flex-1 focus:outline-none focus:border-[#E63012] font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleSaveAsTemplate}
                        className="bg-gray-800 hover:bg-[#E63012] text-white text-[10px] font-black tracking-widest uppercase px-5 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap shadow-sm"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bulk Generator & Actions */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 bg-black/50 p-6 rounded-xl border border-gray-800 shadow-inner">
                  
                  {/* GENERATOR */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-[#E63012] uppercase tracking-widest border-b border-gray-800 pb-2">Générateur Rapide de Variantes</h4>
                    
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">SÉLECTIONNEZ LES TAILLES</label>
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_SIZES.map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setBulkSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                            className={`px-3 py-1.5 rounded text-[10px] font-black tracking-widest transition-colors ${bulkSizes.includes(size) ? 'bg-[#E63012] text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">COULEURS (séparées par une virgule)</label>
                        <input type="text" placeholder="Ex: Noir, Rouge" value={bulkColors} onChange={e => setBulkColors(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-xs text-white w-full focus:outline-none focus:border-[#E63012]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PRÉFIXE SKU (Optionnel)</label>
                        <input type="text" placeholder="Ex: AGV-K6" value={bulkBaseSku} onChange={e => setBulkBaseSku(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-xs text-white w-full focus:outline-none focus:border-[#E63012] font-mono" />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateBulkVariants}
                      disabled={bulkSizes.length === 0}
                      className="bg-gray-800 hover:bg-[#E63012] text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-lg transition-all duration-300 w-full disabled:opacity-50 shadow-[0_0_15px_rgba(230,48,18,0)] hover:shadow-[0_0_15px_rgba(230,48,18,0.3)] mt-2"
                    >
                      Générer les combinaisons
                    </button>
                  </div>

                  {/* BULK ACTIONS */}
                  <div className="space-y-4 xl:border-l xl:border-gray-800 xl:pl-6">
                    <h4 className="text-[10px] font-black text-[#E63012] uppercase tracking-widest border-b border-gray-800 pb-2">Édition en Masse (Toutes les variantes)</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">STOCK POUR TOUS</label>
                        <div className="flex gap-2">
                          <input type="number" value={newStock} onChange={e => setNewStock(parseInt(e.target.value) || 0)} className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-xs text-white w-full focus:outline-none focus:border-[#E63012] text-center font-mono" />
                          <button type="button" onClick={handleApplyBulkStock} className="bg-gray-800 hover:bg-white hover:text-black text-white px-3 py-2.5 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Appliquer</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PRIX SPÉCIAL POUR TOUS</label>
                        <div className="flex gap-2">
                          <input type="number" placeholder="Vide = Prix normal" value={newPriceOverride} onChange={e => setNewPriceOverride(e.target.value === '' ? '' : parseFloat(e.target.value))} className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-xs text-white w-full focus:outline-none focus:border-[#E63012] text-center font-mono" />
                          <button type="button" onClick={handleApplyBulkPrice} className="bg-gray-800 hover:bg-white hover:text-black text-white px-3 py-2.5 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Appliquer</button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-800/50">
                      <p className="text-[9px] text-gray-500 font-medium">Pour générer le SKU automatique pour toutes les variantes, renseignez le <b>PRÉFIXE SKU</b> à gauche puis cliquez ci-dessous :</p>
                      <button type="button" onClick={handleApplyBulkSkuPrefix} disabled={!bulkBaseSku || variantsList.length === 0} className="w-full bg-gray-800 hover:bg-white hover:text-black text-white px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50">
                        Appliquer Préfixe + Taille + Couleur
                      </button>
                    </div>

                    {/* Manual single variant adder toggle or simple link */}
                    <div className="pt-2 flex justify-end">
                      <button type="button" onClick={handleAddVariantRow} className="text-[10px] font-black text-gray-400 hover:text-[#E63012] uppercase tracking-widest flex items-center gap-1 transition-colors">
                        <Plus className="w-3 h-3" /> 
                        Ajouter une ligne vide manuellement
                      </button>
                    </div>
                  </div>
                </div>

                {/* Variants matrix table view */}
                {variantsList.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">Aucune variante configurée. Un produit sans variante ne pourra pas être commandé.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-800 bg-black/30">
                    <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400 font-mono uppercase tracking-widest bg-gray-900/50">
                          <th className="p-4 w-16">Visuel</th>
                          <th className="p-4 w-28">Taille</th>
                          <th className="p-4 w-28">Couleur</th>
                          <th className="p-4 w-32">SKU</th>
                          <th className="p-4 w-20 text-center">Stock</th>
                          <th className="p-4 w-24 text-center">Prix Spécial</th>
                          <th className="p-4">Note / Description</th>
                          <th className="p-4 text-right w-16">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {variantsList.map((v, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            {/* Variant image thumbnail & uploader */}
                            <td className="p-4 pr-2">
                              <div className="flex items-center space-x-2">
                                <label className="relative cursor-pointer group shrink-0">
                                  {v.image_url ? (
                                    <img src={v.image_url} alt="v-thumb" referrerPolicy="no-referrer" className="w-10 h-10 object-cover rounded border border-gray-700 group-hover:opacity-75 transition-opacity" />
                                  ) : (
                                    <div className="w-10 h-10 rounded border-2 border-dashed border-gray-700 group-hover:border-[#E63012] flex items-center justify-center text-[10px] text-gray-500 group-hover:text-[#E63012] transition-colors bg-black/50">
                                      +
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        const formData = new FormData();
                                        formData.append('image', file);
                                        try {
                                          const uploadRes = await api.post('/admin/upload', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                          });
                                          if (uploadRes.data && uploadRes.data.url) {
                                            updateVariant(idx, 'image_url', uploadRes.data.url);
                                          }
                                        } catch (err) {
                                          console.error("Error uploading variant image:", err);
                                        }
                                      }
                                    }}
                                    className="sr-only"
                                  />
                                </label>
                                {v.image_url && (
                                  <button
                                    type="button"
                                    onClick={() => updateVariant(idx, 'image_url', null)}
                                    className="text-[10px] text-gray-500 hover:text-red-500 font-black p-1"
                                    title="Supprimer l'image"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Size input */}
                            <td className="p-4 pr-2">
                              <input
                                type="text"
                                value={v.size || ''}
                                onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-[#E63012] font-bold"
                              />
                            </td>

                            {/* Color input */}
                            <td className="p-4 pr-2">
                              <input
                                type="text"
                                value={v.color || ''}
                                onChange={(e) => updateVariant(idx, 'color', e.target.value)}
                                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-white w-full focus:outline-none focus:border-[#E63012] font-bold"
                              />
                            </td>

                            {/* SKU input */}
                            <td className="p-4 pr-2">
                              <input
                                type="text"
                                value={v.sku || ''}
                                onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs font-mono text-gray-400 w-full focus:outline-none focus:border-[#E63012]"
                              />
                            </td>

                            {/* Stock input */}
                            <td className="p-4 pr-2 text-center">
                              <input
                                type="number"
                                value={v.stock}
                                onChange={(e) => updateVariant(idx, 'stock', parseInt(e.target.value, 10) || 0)}
                                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-white w-16 text-center focus:outline-none focus:border-[#E63012] font-mono"
                              />
                            </td>

                            {/* Price Override input */}
                            <td className="p-4 pr-2 text-center">
                              <input
                                type="number"
                                placeholder="Base"
                                value={v.price_override === null || v.price_override === undefined ? '' : v.price_override}
                                onChange={(e) => updateVariant(idx, 'price_override', e.target.value === '' ? null : parseFloat(e.target.value))}
                                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-white w-20 text-center focus:outline-none focus:border-[#E63012] font-mono"
                              />
                            </td>

                            {/* Description input */}
                            <td className="p-4 pr-2">
                              <input
                                type="text"
                                value={v.description || ''}
                                onChange={(e) => updateVariant(idx, 'description', e.target.value)}
                                placeholder="Description spécifique..."
                                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-gray-400 w-full focus:outline-none focus:border-[#E63012]"
                              />
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveVariantRow(idx)}
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg text-xs font-black uppercase transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Image and Gallery Management */}
              <div className="bg-white/5 border border-gray-800 rounded-2xl p-6 space-y-6">
                <h3 className="text-xs font-mono font-black text-[#E63012] uppercase tracking-widest border-b border-gray-800 pb-4">
                  Galerie d'Images du Produit
                </h3>
                
                {editingProduct ? (
                  <div className="space-y-6">
                    {/* Gallery grid */}
                    {productImages.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">Aucune image dans la galerie. Ajoutez-en ci-dessous.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                        {productImages.map((img) => (
                          <div key={img.id} className="relative group bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col items-center justify-between shadow-lg">
                            <img src={img.url} alt="Gallery item" referrerPolicy="no-referrer" className="w-full h-28 object-cover rounded-lg bg-black border border-gray-800" />
                            
                            <div className="mt-3 w-full flex flex-col gap-2">
                              {img.is_primary === 1 ? (
                                <span className="bg-green-500/20 text-green-400 text-[10px] font-black tracking-widest uppercase py-1.5 rounded text-center border border-green-500/30">
                                  Principale
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => img.id && handleSetPrimaryImage(img.id)}
                                  className="bg-gray-800 hover:bg-[#E63012] text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-white py-1.5 px-2 rounded transition-colors"
                                >
                                  Définir Principale
                                </button>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => img.id && handleDeleteImage(img.id)}
                                className="border border-red-500/30 hover:bg-red-500 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-white py-1.5 px-2 rounded transition-all"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Direct uploader for edit mode */}
                    <div className="border-t border-gray-800 pt-6">
                      <label className="border-2 border-dashed border-gray-700 hover:border-[#E63012] bg-black/50 hover:bg-[#E63012]/5 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors">
                        <Upload className="w-6 h-6 text-gray-500 group-hover:text-[#E63012] mb-3" />
                        <span className="text-sm text-white font-black uppercase tracking-widest">Ajouter des images</span>
                        <span className="text-[10px] text-gray-500 mt-2 font-mono uppercase">Téléversement instantané</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const files = Array.from(e.target.files);
                              for (const f of files) {
                                await handleUploadGalleryImage(f);
                              }
                            }
                          }}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Basic uploader for new product */
                  <div className="space-y-4">
                    <label className="border-2 border-dashed border-gray-700 hover:border-[#E63012] bg-black/50 hover:bg-[#E63012]/5 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <Upload className="w-6 h-6 text-gray-500 mb-3" />
                      <span className="text-sm text-white font-black uppercase tracking-widest">Choisir l'image principale</span>
                      <span className="text-[10px] text-gray-500 mt-2 font-mono uppercase">L'image sera enregistrée lors de la création</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                        className="sr-only"
                      />
                    </label>
                    {selectedFile && (
                      <p className="text-xs text-green-400 font-black tracking-widest uppercase flex items-center justify-center">
                        <Check className="w-4 h-4 mr-2" /> Fichier sélectionné : {selectedFile.name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* SEO Tags Section */}
              <div className="bg-white/5 border border-gray-800 rounded-2xl p-6 space-y-6">
                <h3 className="text-xs font-mono font-black text-[#E63012] uppercase tracking-widest border-b border-gray-800 pb-4">Paramètres SEO (Metadatas)</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta Title</label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={e => setMetaTitle(e.target.value)}
                      placeholder="Titre de la page dans Google"
                      className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta Description</label>
                    <input
                      type="text"
                      value={metaDesc}
                      onChange={e => setMetaDesc(e.target.value)}
                      placeholder="Texte d'explication de la page sous Google"
                      className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-sm text-white w-full focus:outline-none focus:border-[#E63012]"
                    />
                  </div>
                </div>
              </div>

            </form>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
