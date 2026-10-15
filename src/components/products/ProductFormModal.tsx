import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Sparkles, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { BarcodeRenderer } from '../common/BarcodeRenderer';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}) => {
  const [nom, setNom] = useState('');
  const [reference, setReference] = useState('');
  const [categorie, setCategorie] = useState('Outillage Électroportatif');
  const [codeBarre, setCodeBarre] = useState('');
  const [quantite, setQuantite] = useState<number>(10);
  const [seuilAlerte, setSeuilAlerte] = useState<number>(3);
  const [emplacement, setEmplacement] = useState('');
  const [prixUnitaire, setPrixUnitaire] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setNom(productToEdit.nom);
      setReference(productToEdit.reference);
      setCategorie(productToEdit.categorie);
      setCodeBarre(productToEdit.codeBarre);
      setQuantite(productToEdit.quantite);
      setSeuilAlerte(productToEdit.seuilAlerte);
      setEmplacement(productToEdit.emplacement);
      setPrixUnitaire(productToEdit.prixUnitaire || 0);
      setDescription(productToEdit.description || '');
    } else {
      // Defaults for new product
      setNom('');
      setReference(`REF-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategorie('Outillage Électroportatif');
      handleGenerateBarcode();
      setQuantite(10);
      setSeuilAlerte(3);
      setEmplacement('Magasin Central - Casier 01');
      setPrixUnitaire(45.0);
      setDescription('');
    }
    setError(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleGenerateBarcode = () => {
    // Generate 12 digits then calculate EAN-13 check digit
    let base = '3' + Math.floor(10000000000 + Math.random() * 90000000000).toString();
    if (base.length > 12) base = base.substring(0, 12);
    // EAN-13 checksum algorithm
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(base[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const finalEan = base + checkDigit.toString();
    setCodeBarre(finalEan);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !reference.trim() || !codeBarre.trim() || !emplacement.trim()) {
      setError('Veuillez remplir au moins le nom, la référence, le code-barres et l’emplacement.');
      return;
    }

    const productData: Product = {
      id: productToEdit ? productToEdit.id : `prod-${Date.now()}`,
      nom: nom.trim(),
      reference: reference.trim().toUpperCase(),
      categorie: categorie.trim(),
      codeBarre: codeBarre.trim(),
      quantite: Number(quantite) >= 0 ? Number(quantite) : 0,
      seuilAlerte: Number(seuilAlerte) >= 0 ? Number(seuilAlerte) : 3,
      emplacement: emplacement.trim(),
      prixUnitaire: Number(prixUnitaire) >= 0 ? Number(prixUnitaire) : 0,
      description: description.trim() || undefined,
      createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(productData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {productToEdit ? 'Modifier la fiche matériel' : 'Ajouter un nouveau matériel au catalogue'}
              </h3>
              <p className="text-xs text-slate-500">
                Génération de code-barres EAN-13 / Code128 pour le suivi scanner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nom du matériel */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Désignation du matériel / Produit *
            </label>
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Scie Circulaire Plongeante 1400W"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
            />
          </div>

          {/* Référence & Catégorie */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Référence Interne *
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder="Ex: OUT-SCIE-04"
                className="w-full px-3.5 py-2 font-mono uppercase bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie *
              </label>
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              >
                <option value="Outillage Électroportatif">Outillage Électroportatif</option>
                <option value="Mesure & Électricité">Mesure & Électricité</option>
                <option value="Équipements de Sécurité (EPI)">Équipements de Sécurité (EPI)</option>
                <option value="Informatique & Réseaux">Informatique & Réseaux</option>
                <option value="Éclairage & Consommables">Éclairage & Consommables</option>
                <option value="Véhicules & Levage">Véhicules & Levage</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          {/* Code-barres avec bouton auto-génération */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Code-barres (EAN-13 / Code128) *
              </label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Générer un code
              </button>
            </div>
            <input
              type="text"
              required
              value={codeBarre}
              onChange={(e) => setCodeBarre(e.target.value)}
              placeholder="Ex: 3662894012345"
              className="w-full px-3.5 py-2 font-mono bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
            />

            {/* Live Barcode Preview */}
            {codeBarre.length >= 4 && (
              <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                <BarcodeRenderer
                  value={codeBarre}
                  height={45}
                  fontSize={11}
                  width={1.5}
                />
              </div>
            )}
          </div>

          {/* Quantité & Seuil Alerte */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantité en stock initiale *
              </label>
              <input
                type="number"
                min="0"
                required
                value={quantite}
                onChange={(e) => setQuantite(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seuil d'alerte stock bas *
              </label>
              <input
                type="number"
                min="0"
                required
                value={seuilAlerte}
                onChange={(e) => setSeuilAlerte(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
          </div>

          {/* Emplacement & Prix unitaire */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emplacement / Rayonnage *
              </label>
              <input
                type="text"
                required
                value={emplacement}
                onChange={(e) => setEmplacement(e.target.value)}
                placeholder="Ex: Atelier B - Armoire 02"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valeur unitaire (€ HT)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={prixUnitaire}
                onChange={(e) => setPrixUnitaire(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Spécifications
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Spécifications techniques, accessoires inclus..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition resize-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
            >
              {productToEdit ? 'Enregistrer les modifications' : 'Ajouter le Matériel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
