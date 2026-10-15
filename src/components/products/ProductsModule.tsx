import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Barcode, 
  Edit3, 
  Trash2, 
  MapPin, 
  AlertTriangle, 
  Download, 
  Camera, 
  Boxes,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { Product, Employee } from '../../types';
import { storageService } from '../../services/storageService';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import { ProductLabelModal } from './ProductLabelModal';
import { ProductFormModal } from './ProductFormModal';
import { CameraScannerModal } from '../common/CameraScannerModal';

interface ProductsModuleProps {
  products: Product[];
  employees: Employee[];
}

export const ProductsModule: React.FC<ProductsModuleProps> = ({ products, employees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok'>('all');
  
  const [selectedProductForLabel, setSelectedProductForLabel] = useState<Product | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Extract distinct categories
  const categories = Array.from(new Set(products.map(p => p.categorie))).filter(Boolean);

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.nom.toLowerCase().includes(term) ||
      p.reference.toLowerCase().includes(term) ||
      p.codeBarre.includes(term) ||
      p.emplacement.toLowerCase().includes(term);

    const matchesCategory = selectedCategory === 'all' || p.categorie === selectedCategory;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.quantite <= p.seuilAlerte;
    } else if (stockFilter === 'ok') {
      matchesStock = p.quantite > p.seuilAlerte;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenLabel = (product: Product) => {
    setSelectedProductForLabel(product);
    setIsLabelModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setProductToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Confirmez-vous la suppression du produit "${name}" ?`)) {
      storageService.deleteProduct(id);
    }
  };

  const handleSave = (product: Product) => {
    storageService.saveProduct(product);
  };

  const handleQuickAdjust = (product: Product, delta: number) => {
    const newQty = Math.max(0, product.quantite + delta);
    storageService.saveProduct({
      ...product,
      quantite: newQty,
    });
  };

  const handleBarcodeScanFound = (code: string) => {
    setSearchTerm(code);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Catalogue Matériel & Codes-Barres</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos équipements, suivez les stocks en temps réel et imprimez les étiquettes codes-barres.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsCameraScannerOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            Scanner pour chercher
          </button>

          <button
            onClick={() => storageService.exportProductsCSV()}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={handleAddNew}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Ajouter Matériel
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, réf, code-barres, emplacement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition shadow-sm"
          />
        </div>

        {/* Category selector */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition shadow-sm"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Stock status filter */}
        <div className="md:col-span-3 flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setStockFilter('all')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              stockFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setStockFilter('low')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
              stockFilter === 'low'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-amber-700 hover:text-amber-900'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Alertes ({products.filter(p => p.quantite <= p.seuilAlerte).length})
          </button>
          <button
            onClick={() => setStockFilter('ok')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              stockFilter === 'ok'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            En stock
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Matériel & Réf</th>
                <th className="py-3.5 px-4">Code-Barres</th>
                <th className="py-3.5 px-4">Emplacement</th>
                <th className="py-3.5 px-4 text-center">Quantité & Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">Aucun produit trouvé</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Essayez d'ajuster votre recherche ou filtre.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.quantite <= p.seuilAlerte && p.quantite > 0;
                  const isOutOfStock = p.quantite === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition group">
                      {/* Name & Reference */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition">
                          {p.nom}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {p.reference}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {p.categorie}
                          </span>
                        </div>
                      </td>

                      {/* Barcode renderer preview */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <BarcodeRenderer
                            value={p.codeBarre}
                            width={1.2}
                            height={32}
                            fontSize={10}
                            displayValue={true}
                          />
                        </div>
                      </td>

                      {/* Emplacement */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.emplacement}</span>
                        </div>
                      </td>

                      {/* Quantité & Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleQuickAdjust(p, -1)}
                            disabled={p.quantite <= 0}
                            className="text-slate-400 hover:text-red-600 disabled:opacity-20 transition"
                            title="Décrémenter (-1)"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>

                          <div className="min-w-[70px]">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {p.quantite} un.
                            </span>
                          </div>

                          <button
                            onClick={() => handleQuickAdjust(p, 1)}
                            className="text-slate-400 hover:text-emerald-600 transition"
                            title="Incrémenter (+1)"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Seuil alerte : {p.seuilAlerte}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenLabel(p)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Imprimer l'étiquette code-barres"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.nom)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Label Print Modal */}
      <ProductLabelModal
        product={selectedProductForLabel}
        isOpen={isLabelModalOpen}
        onClose={() => {
          setIsLabelModalOpen(false);
          setSelectedProductForLabel(null);
        }}
      />

      {/* Product Add/Edit Form Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSave}
        productToEdit={productToEdit}
      />

      {/* Camera Search Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleBarcodeScanFound}
        title="Scanner le Code-Barres d'un Produit"
        subtitle="Pointez la caméra pour filtrer automatiquement le catalogue"
        mode="barcode_product"
        sampleEmployees={employees}
        sampleProducts={products}
      />
    </div>
  );
};
