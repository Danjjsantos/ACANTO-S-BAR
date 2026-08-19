import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Category, ExtraOption } from '../types';
import { Package, Plus, Edit2, Trash2, X, ExternalLink, QrCode, Search, Globe, Copy, Check, Link as LinkIcon, Share2, PlusCircle, MinusCircle, Tag, Layers, Ban, ListChecks } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { getPublicCardapioUrl, getAdminStoreUrl } from '../utils/whatsappHelper';

export const CardapioManager: React.FC = () => {
  const {
    products,
    categories,
    extraGroups,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailable,
    addCategory,
    updateCategory,
    deleteCategory,
    setViewMode,
    settings,
    updateSettings,
    activeTab: globalActiveTab,
  } = useApp();

  const [copiedCustomerLink, setCopiedCustomerLink] = useState(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);

  const [activeTab, setActiveTab] = useState<'produtos' | 'categorias' | 'qrcode'>(
    globalActiveTab === 'categorias' ? 'categorias' : 'produtos'
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (globalActiveTab === 'categorias') {
      setActiveTab('categorias');
    } else if (globalActiveTab === 'produtos') {
      setActiveTab('produtos');
    }
  }, [globalActiveTab]);

  // Product modal form
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalTab, setProductModalTab] = useState<'dados' | 'adicionais' | 'removiveis'>('dados');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCode, setProdCode] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(29.9);
  const [prodCatId, setProdCatId] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodAvailable, setProdAvailable] = useState<boolean>(true);

  // Extras state
  const [prodCustomExtras, setProdCustomExtras] = useState<ExtraOption[]>([]);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState<string>('');
  const [prodExtraGroupIds, setProdExtraGroupIds] = useState<string[]>([]);

  // Removable items state
  const [prodRemovableItems, setProdRemovableItems] = useState<string[]>([]);
  const [newRemovableName, setNewRemovableName] = useState('');

  // Category modal form
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🍔');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code && p.code.includes(searchQuery))
  );

  const handleOpenProductModal = (product?: Product) => {
    setProductModalTab('dados');
    if (product) {
      setEditingProductId(product.id);
      setProdName(product.name);
      setProdCode(product.code || '');
      setProdDesc(product.description);
      setProdPrice(product.price);
      setProdCatId(product.categoryId);
      setProdImage(product.image);
      setProdAvailable(product.available !== undefined ? product.available : true);
      setProdCustomExtras(product.customExtras ? [...product.customExtras] : []);
      setProdRemovableItems(product.removableItems ? [...product.removableItems] : []);
      setProdExtraGroupIds(product.extraGroupIds ? [...product.extraGroupIds] : []);
    } else {
      setEditingProductId(null);
      setProdName('');
      setProdCode(String(100 + products.length + 1));
      setProdDesc('');
      setProdPrice(25.0);
      setProdCatId(categories[0]?.id || '');
      setProdImage('');
      setProdAvailable(true);
      setProdCustomExtras([]);
      setProdRemovableItems([]);
      setProdExtraGroupIds([]);
    }
    setNewExtraName('');
    setNewExtraPrice('');
    setNewRemovableName('');
    setShowProductModal(true);
  };

  const handleAddCustomExtra = () => {
    if (!newExtraName.trim()) return;
    const priceNum = parseFloat(newExtraPrice.replace(',', '.')) || 0;
    const newExtra: ExtraOption = {
      id: 'ext-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: newExtraName.trim(),
      price: priceNum,
    };
    setProdCustomExtras((prev) => [...prev, newExtra]);
    setNewExtraName('');
    setNewExtraPrice('');
  };

  const handleRemoveCustomExtra = (id: string) => {
    setProdCustomExtras((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddRemovableItem = (nameToAdd?: string) => {
    const item = (nameToAdd || newRemovableName).trim();
    if (!item) return;
    if (!prodRemovableItems.some((i) => i.toLowerCase() === item.toLowerCase())) {
      setProdRemovableItems((prev) => [...prev, item]);
    }
    if (!nameToAdd) setNewRemovableName('');
  };

  const handleRemoveRemovableItem = (itemToRemove: string) => {
    setProdRemovableItems((prev) => prev.filter((item) => item !== itemToRemove));
  };

  const handleToggleExtraGroup = (groupId: string) => {
    setProdExtraGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSaveProduct = () => {
    if (!prodName.trim() || !prodCatId) return;

    const defaultFallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

    const productPayload = {
      name: prodName,
      code: prodCode,
      description: prodDesc,
      price: prodPrice,
      categoryId: prodCatId,
      image: prodImage || defaultFallbackImage,
      available: prodAvailable,
      customExtras: prodCustomExtras,
      removableItems: prodRemovableItems,
      extraGroupIds: prodExtraGroupIds,
    };

    if (editingProductId) {
      updateProduct(editingProductId, productPayload);
    } else {
      addProduct(productPayload);
    }

    setShowProductModal(false);
  };

  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategoryId(category.id);
      setCatName(category.name);
      setCatIcon(category.icon || '🍔');
    } else {
      setEditingCategoryId(null);
      setCatName('');
      setCatIcon('🍔');
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = () => {
    if (!catName.trim()) return;

    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        name: catName.trim(),
        icon: catIcon.trim() || '🍔',
      });
    } else {
      addCategory({
        name: catName.trim(),
        icon: catIcon.trim() || '🍔',
        active: true,
      });
    }

    setEditingCategoryId(null);
    setCatName('');
    setShowCategoryModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" /> Editor de Cardápio
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Cache SWR Instantâneo
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre seus produtos, fotos, valores, adicionais e categorias com atualização em tempo real no cardápio público.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('produtos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'produtos' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600'
            }`}
          >
            🍔 Produtos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categorias')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'categorias' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600'
            }`}
          >
            🏷️ Categorias ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'qrcode' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600'
            }`}
          >
            📱 Cardápio Digital
          </button>
        </div>
      </div>

      {/* PRODUTOS TAB */}
      {activeTab === 'produtos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produto por nome ou código..."
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleOpenProductModal()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4" /> Cadastrar Produto
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const category = categories.find((c) => c.id === p.categoryId);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between hover:border-purple-300 transition group"
                >
                  <div>
                    <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-slate-100 mb-3">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      {p.code && (
                        <span className="absolute top-2 left-2 bg-slate-900/80 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs">
                          #{p.code}
                        </span>
                      )}
                      <button
                        onClick={() => toggleProductAvailable(p.id)}
                        className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs transition ${
                          p.available ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {p.available ? 'Disponível' : 'Pausado'}
                      </button>
                    </div>

                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md uppercase">
                      {category ? `${category.icon} ${category.name}` : 'Sem Categoria'}
                    </span>

                    <h3 className="font-bold text-slate-900 text-sm mt-1.5 mb-1">{p.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{p.description}</p>

                    {/* Extras & Removable Items Badges */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {((p.customExtras?.length || 0) > 0 || (p.extraGroupIds?.length || 0) > 0) && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          + {(p.customExtras?.length || 0) + (p.extraGroupIds?.length || 0)} adicionais
                        </span>
                      )}
                      {(p.removableItems?.length || 0) > 0 && (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          🚫 {p.removableItems?.length} para remover
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-base">
                      R$ {p.price.toFixed(2).replace('.', ',')}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenProductModal(p)}
                        className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORIAS TAB */}
      {activeTab === 'categorias' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Categorias do Cardápio</h3>
            <button
              onClick={() => handleOpenCategoryModal()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nova Categoria
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catProdsCount = products.filter((p) => p.categoryId === cat.id).length;

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between hover:border-purple-200 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon || '🍔'}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                      <p className="text-xs text-slate-500">{catProdsCount} produtos associados</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="p-1.5 text-slate-600 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition cursor-pointer"
                      title="Editar Categoria"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CARDÁPIO DIGITAL QR CODE LINK TAB */}
      {activeTab === 'qrcode' && (() => {
        const customerMenuUrl = getPublicCardapioUrl(settings);
        const adminStoreUrl = getAdminStoreUrl(settings);

        const handleCopyUrl = (urlToCopy: string, type: 'customer' | 'admin') => {
          navigator.clipboard.writeText(urlToCopy);
          if (type === 'customer') {
            setCopiedCustomerLink(true);
            setTimeout(() => setCopiedCustomerLink(false), 2500);
          } else {
            setCopiedAdminLink(true);
            setTimeout(() => setCopiedAdminLink(false), 2500);
          }
        };

        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-xl mx-auto space-y-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-900 text-base">Links de Acesso do Sistema</h3>
                  <p className="text-xs text-slate-500">
                    Endereços distintos e separados para os seus Clientes e para a Gestão da sua Loja.
                  </p>
                </div>
              </div>
            </div>

            {/* Name & Subdomain Inputs */}
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Nome do Cardápio / Estabelecimento
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    updateSettings({
                      name: newName,
                      pixName: (!settings.pixName || settings.pixName === settings.name) ? newName : settings.pixName,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-extrabold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="Ex: BAR DO ACANTO"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Identificador / Subdomínio (Slug)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-slate-400 font-mono select-none">https://</span>
                  <input
                    type="text"
                    value={settings.menuSlug || 'acantosbar'}
                    onChange={(e) => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      updateSettings({ menuSlug: clean });
                    }}
                    className="w-full pl-16 pr-28 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-purple-900 font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    placeholder="acantosbar"
                  />
                  <span className="absolute right-3 text-xs text-slate-400 font-mono select-none">.fazopedido.com</span>
                </div>
              </div>

              {/* 1. CUSTOMER MENU LINK */}
              <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                    <span>📱 1. Link do Cardápio para Clientes (Público)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    🟢 Para Divulgação
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white p-3 rounded-xl border border-purple-200 shadow-2xs">
                  <div className="flex items-center gap-2 overflow-hidden w-full sm:w-auto">
                    <LinkIcon className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-xs font-mono font-extrabold text-slate-800 truncate select-all">
                      {customerMenuUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => handleCopyUrl(customerMenuUrl, 'customer')}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs"
                    >
                      {copiedCustomerLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCustomerLink ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                    <button
                      onClick={() => setViewMode('public')}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg flex items-center justify-center gap-1 transition shrink-0 cursor-pointer shadow-xs"
                    >
                      <span>Testar</span>
                    </button>
                    <button
                      onClick={() => window.open(customerMenuUrl, '_blank')}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                      title="Abrir em Nova Aba"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. STORE ADMIN PANEL LINK */}
              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <span>🏪 2. Link do Painel / Gestão da Loja (Admin)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                    🔑 Uso Interno
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 overflow-hidden w-full sm:w-auto">
                    <LinkIcon className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-xs font-mono font-extrabold text-slate-800 truncate select-all">
                      {adminStoreUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => handleCopyUrl(adminStoreUrl, 'admin')}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs"
                    >
                      {copiedAdminLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAdminLink ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                    <button
                      onClick={() => setViewMode('admin')}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-lg flex items-center justify-center gap-1 transition shrink-0 cursor-pointer shadow-xs"
                    >
                      <span>Painel</span>
                    </button>
                    <button
                      onClick={() => window.open(adminStoreUrl, '_blank')}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                      title="Abrir em Nova Aba"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setViewMode('public')}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🚀 TESTAR CARDÁPIO DIGITAL (MODO CLIENTE)</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                {editingProductId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600 p-1 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Internal Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setProductModalTab('dados')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  productModalTab === 'dados'
                    ? 'bg-white text-purple-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📋 Dados</span>
              </button>
              <button
                type="button"
                onClick={() => setProductModalTab('adicionais')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  productModalTab === 'adicionais'
                    ? 'bg-white text-purple-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>➕ Adicionais</span>
                {prodCustomExtras.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full text-[10px]">
                    {prodCustomExtras.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setProductModalTab('removiveis')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  productModalTab === 'removiveis'
                    ? 'bg-white text-purple-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🚫 Remover Itens</span>
                {prodRemovableItems.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-full text-[10px]">
                    {prodRemovableItems.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab 1: DADOS BÁSICOS */}
            {productModalTab === 'dados' && (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Produto *</label>
                    <input
                      type="text"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Ex: Smash Burger Bacon"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Código PDV</label>
                    <input
                      type="text"
                      value={prodCode}
                      onChange={(e) => setProdCode(e.target.value)}
                      placeholder="101"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preço (R$) *</label>
                    <input
                      type="number"
                      step="0.10"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Categoria *</label>
                    <select
                      value={prodCatId}
                      onChange={(e) => setProdCatId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Descreva os ingredientes..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status de Disponibilidade *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProdAvailable(true)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                        prodAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-500/20 font-extrabold'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Disponível (Ativo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdAvailable(false)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                        !prodAvailable
                          ? 'bg-rose-50 text-rose-800 border-rose-400 ring-2 ring-rose-500/20 font-extrabold'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Indisponível (Pausado)
                    </button>
                  </div>
                </div>

                <div>
                  <ImageUploader
                    value={prodImage}
                    onChange={setProdImage}
                    label="Foto do Produto (Dispositivo)"
                    helperText="Selecione uma foto da galeria ou câmera do seu celular ou computador."
                  />
                </div>
              </div>
            )}

            {/* Tab 2: ADICIONAIS (+R$) & ITENS REMOVÍVEIS */}
            {productModalTab === 'adicionais' && (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                {/* CARD 1: Adicionais no produto */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0">
                      <ListChecks className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Adicionais no produto</h4>
                    </div>
                  </div>

                  {prodCustomExtras.length === 0 ? (
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Nenhum adicional ainda. Crie um pra oferecer acompanhamentos, sabores, extras...
                    </p>
                  ) : (
                    <div className="space-y-2 py-1">
                      {prodCustomExtras.map((ext) => (
                        <div
                          key={ext.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span className="font-bold text-slate-800">{ext.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-purple-700 text-xs">
                              + R$ {ext.price.toFixed(2).replace('.', ',')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomExtra(ext.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              title="Remover Adicional"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Extra Form */}
                  <div className="pt-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Adicional</label>
                          <input
                            type="text"
                            value={newExtraName}
                            onChange={(e) => setNewExtraName(e.target.value)}
                            placeholder="Ex: Bacon Extra, Queijo Duplo"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Preço R$</label>
                          <input
                            type="text"
                            value={newExtraPrice}
                            onChange={(e) => setNewExtraPrice(e.target.value)}
                            placeholder="5,00"
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomExtra}
                        className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-slate-700" /> Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Optional: Link Global Extra Groups */}
                  {extraGroups.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-600" /> Associar Grupos Globais de Adicionais
                      </label>
                      <div className="space-y-1.5">
                        {extraGroups.map((grp) => {
                          const isChecked = prodExtraGroupIds.includes(grp.id);
                          return (
                            <label
                              key={grp.id}
                              className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                                isChecked ? 'bg-purple-50 border-purple-300 text-purple-950 font-bold' : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleExtraGroup(grp.id)}
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <span>{grp.title} ({grp.options.length} opções)</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: ITENS REMOVÍVEIS */}
            {productModalTab === 'removiveis' && (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                {/* CARD 2: Itens removíveis */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0">
                      <MinusCircle className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Itens removíveis</h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    O cliente pode pedir pra tirar estes itens.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newRemovableName}
                      onChange={(e) => setNewRemovableName(e.target.value)}
                      placeholder="Ex: Cebola"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRemovableItem();
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddRemovableItem()}
                      className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4 text-slate-700" /> Adicionar
                    </button>
                  </div>

                  {/* Registered removable items */}
                  {prodRemovableItems.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Cadastrados ({prodRemovableItems.length}):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {prodRemovableItems.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-bold text-xs shadow-2xs"
                          >
                            <span>Sem {item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRemovableItem(item)}
                              className="p-1 hover:bg-rose-200 rounded-lg text-rose-700 hover:text-rose-950 transition cursor-pointer"
                              title="Excluir Opção de Remoção"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProduct}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingCategoryId ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ex: Porções Especiais"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ícone Emoji</label>
                <input
                  type="text"
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  placeholder="🍟"
                  className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                {editingCategoryId ? 'Salvar Categoria' : 'Criar Categoria'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
