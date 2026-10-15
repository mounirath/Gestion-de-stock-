import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  QrCode, 
  Barcode, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw, 
  MapPin, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Check
} from 'lucide-react';
import { Employee, Product, MovementType, MovementSubtype, StockMovement } from '../../types';
import { storageService } from '../../services/storageService';
import { CameraScannerModal } from '../common/CameraScannerModal';
import { BarcodeRenderer } from '../common/BarcodeRenderer';

interface TransactionScannerProps {
  employees: Employee[];
  products: Product[];
  onMovementCreated?: (movement: StockMovement) => void;
  onNavigateToHistory?: () => void;
}

export const TransactionScanner: React.FC<TransactionScannerProps> = ({
  employees,
  products,
  onMovementCreated,
  onNavigateToHistory,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Employee
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Step 2: Product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // Step 3: Transaction parameters
  const [movementType, setMovementType] = useState<MovementType>('sortie');
  const [movementSubtype, setMovementSubtype] = useState<MovementSubtype>('emprunt');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [operator, setOperator] = useState<string>('Magasinier Principal');
  const [dateRetourPrevue, setDateRetourPrevue] = useState<string>(
    new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0]
  );

  // Result state
  const [lastMovement, setLastMovement] = useState<StockMovement | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Scanner modal state
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'qr_employee' | 'barcode_product'>('qr_employee');

  // Trigger camera for Step 1 (QR Code Employee)
  const openQrScanner = () => {
    setScannerMode('qr_employee');
    setScannerModalOpen(true);
  };

  // Trigger camera for Step 2 (Barcode Product)
  const openBarcodeScanner = () => {
    setScannerMode('barcode_product');
    setScannerModalOpen(true);
  };

  const handleScanSuccess = (decoded: string) => {
    if (scannerMode === 'qr_employee') {
      const found = storageService.getEmployeeByMatricule(decoded);
      if (found) {
        setSelectedEmployee(found);
        setCurrentStep(2);
      } else {
        // Fallback: check if id matches
        const byId = employees.find(e => e.id === decoded || e.matricule.toLowerCase() === decoded.toLowerCase());
        if (byId) {
          setSelectedEmployee(byId);
          setCurrentStep(2);
        } else {
          alert(`Aucun employé trouvé avec le QR Code : "${decoded}"`);
        }
      }
    } else if (scannerMode === 'barcode_product') {
      const found = storageService.getProductByBarcode(decoded);
      if (found) {
        setSelectedProduct(found);
        setCurrentStep(3);
      } else {
        alert(`Aucun matériel trouvé avec le Code-Barres : "${decoded}"`);
      }
    }
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setCurrentStep(2);
  };

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setCurrentStep(3);
  };

  const handleValidateTransaction = async () => {
    setTransactionError(null);
    if (!selectedEmployee || !selectedProduct) {
      setTransactionError('Employé ou produit manquant.');
      return;
    }

    if (quantity <= 0) {
      setTransactionError('La quantité doit être supérieure à 0.');
      return;
    }

    if (movementType === 'sortie' && selectedProduct.quantite < quantity) {
      setTransactionError(
        `Stock insuffisant : Seulement ${selectedProduct.quantite} unité(s) disponible(s) en magasin.`
      );
      return;
    }

    const result = await storageService.recordMovement({
      type: movementType,
      sousType: movementSubtype,
      employeId: selectedEmployee.id,
      produitId: selectedProduct.id,
      quantite: quantity,
      notes: notes.trim() || (movementType === 'sortie' ? 'Sortie standard magasin' : 'Réintégration stock'),
      operateur: operator.trim() || 'Agent Magasin',
      dateRetourPrevue: movementType === 'sortie' ? dateRetourPrevue : undefined,
    });

    if (result.success && result.movement) {
      setLastMovement(result.movement);
      setCurrentStep(4);
      if (onMovementCreated) {
        onMovementCreated(result.movement);
      }
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti effect
      }
    } else {
      setTransactionError(result.error || 'Erreur lors de l’enregistrement de la transaction.');
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedEmployee(null);
    setSelectedProduct(null);
    setQuantity(1);
    setNotes('');
    setLastMovement(null);
    setTransactionError(null);
    setEmployeeSearch('');
    setProductSearch('');
  };

  // Filtered lists for manual fallbacks
  const filteredEmployees = employees.filter(
    (e) =>
      e.nom.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.prenom.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.matricule.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.nom.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.reference.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.codeBarre.includes(productSearch)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Module Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Module Scanner Entrées & Sorties</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interface fluide en 3 étapes : identification badge QR, scan matériel code-barres et mise à jour temps réel.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser le flux
        </button>
      </div>

      {/* 3-Step Wizard Navigation Indicator */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition ${
              currentStep === 1
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 shadow-sm'
                : selectedEmployee
                ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep === 1
                  ? 'bg-indigo-600 text-white'
                  : selectedEmployee
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {selectedEmployee ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="truncate">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Étape 1
              </div>
              <div className="text-xs font-bold truncate">
                {selectedEmployee
                  ? `${selectedEmployee.prenom} ${selectedEmployee.nom}`
                  : 'Employé (QR Code)'}
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => selectedEmployee && setCurrentStep(2)}
            className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition ${
              currentStep === 2
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 shadow-sm'
                : selectedProduct
                ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep === 2
                  ? 'bg-indigo-600 text-white'
                  : selectedProduct
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {selectedProduct ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div className="truncate">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Étape 2
              </div>
              <div className="text-xs font-bold truncate">
                {selectedProduct ? selectedProduct.nom : 'Matériel (Code-Barres)'}
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => selectedEmployee && selectedProduct && setCurrentStep(3)}
            className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition ${
              currentStep === 3
                ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 shadow-sm'
                : currentStep === 4
                ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                currentStep === 3
                  ? 'bg-indigo-600 text-white'
                  : currentStep === 4
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {currentStep === 4 ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <div className="truncate">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Étape 3
              </div>
              <div className="text-xs font-bold truncate">
                Validation du Mouvement
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: EMPLOYEE IDENTIFICATION */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="text-center max-w-md mx-auto space-y-2">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Identification de l'Employé
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scannez le QR Code présent sur le badge de l'employé avec la caméra, ou sélectionnez-le directement dans la liste ci-dessous.
            </p>
          </div>

          {/* Primary Action Button: Open Camera Scanner */}
          <div className="flex justify-center">
            <button
              onClick={openQrScanner}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-5 h-5 animate-pulse" />
              <span>Ouvrir la Caméra & Scanner le Badge QR</span>
            </button>
          </div>

          {/* Or Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Ou recherche manuelle
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Search bar & Quick select list */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un employé par nom, prénom ou matricule..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition flex items-center justify-between group bg-white shadow-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {emp.prenom[0]}
                      {emp.nom[0]}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                        {emp.prenom} {emp.nom}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {emp.matricule}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: MATERIAL SELECTION (BARCODE) */}
      {/* ========================================================================= */}
      {currentStep === 2 && selectedEmployee && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          {/* Employee Recap Card */}
          <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">
                  Employé Identifié :
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {selectedEmployee.prenom} {selectedEmployee.nom} •{' '}
                  <span className="font-mono text-indigo-700">{selectedEmployee.matricule}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
            >
              Changer
            </button>
          </div>

          <div className="text-center max-w-md mx-auto space-y-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Barcode className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Sélection du Matériel à Traiter
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scannez le code-barres étiqueté sur le matériel avec la caméra, ou recherchez le produit dans le catalogue.
            </p>
          </div>

          {/* Primary Action Button: Open Barcode Camera Scanner */}
          <div className="flex justify-center">
            <button
              onClick={openBarcodeScanner}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-5 h-5 animate-pulse" />
              <span>Ouvrir la Caméra & Scanner le Code-Barres</span>
            </button>
          </div>

          {/* Or Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Ou saisie / sélection manuelle
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Search bar & Quick select list */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom de matériel, référence ou code-barres..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleSelectProduct(prod)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition flex items-center justify-between group bg-white shadow-xs"
                >
                  <div className="space-y-1 truncate pr-2">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                      {prod.nom}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-bold">
                        {prod.reference}
                      </span>
                      <span>Stock: {prod.quantite} un.</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: TRANSACTION VALIDATION (TYPE, QUANTITY, NOTES) */}
      {/* ========================================================================= */}
      {currentStep === 3 && selectedEmployee && selectedProduct && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          {/* Header Recap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Employé recap */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Employé :
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {selectedEmployee.prenom} {selectedEmployee.nom}
                </div>
                <div className="text-xs font-mono text-indigo-700">
                  {selectedEmployee.matricule} • {selectedEmployee.poste}
                </div>
              </div>
              <button
                onClick={() => setCurrentStep(1)}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Modifier
              </button>
            </div>

            {/* Matériel recap */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Matériel :
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {selectedProduct.nom}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono font-bold">{selectedProduct.reference}</span>
                  <span>• Stock actuel : <strong>{selectedProduct.quantite} un.</strong></span>
                </div>
              </div>
              <button
                onClick={() => setCurrentStep(2)}
                className="text-xs text-emerald-700 hover:underline font-medium"
              >
                Modifier
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {transactionError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="font-bold">Attention :</span> {transactionError}
            </div>
          )}

          {/* Operation Type Selection (SORTIE vs ENTREE) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Type d'opération *
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* SORTIE / EMPRUNT */}
              <button
                type="button"
                onClick={() => {
                  setMovementType('sortie');
                  setMovementSubtype('emprunt');
                }}
                className={`p-4 rounded-xl border-2 text-left transition flex items-start gap-3 ${
                  movementType === 'sortie'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    movementType === 'sortie'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Sortie / Emprunt Matériel</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Décrémente le stock et attribue l'article à l'employé
                  </div>
                </div>
              </button>

              {/* ENTREE / RETOUR */}
              <button
                type="button"
                onClick={() => {
                  setMovementType('entree');
                  setMovementSubtype('restitution');
                }}
                className={`p-4 rounded-xl border-2 text-left transition flex items-start gap-3 ${
                  movementType === 'entree'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    movementType === 'entree'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Entrée / Retour / Réappro</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Incrémente le stock en magasin suite à un retour ou livraison
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Subtype & Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subtype */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motif précis / Catégorie de flux
              </label>
              <select
                value={movementSubtype}
                onChange={(e) => setMovementSubtype(e.target.value as MovementSubtype)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              >
                {movementType === 'sortie' ? (
                  <>
                    <option value="emprunt">Emprunt temporaire (Chantier / Atelier)</option>
                    <option value="consommation">Consommation définitive (Consommable)</option>
                    <option value="perte_casse">Déclaration Casse ou Perte</option>
                  </>
                ) : (
                  <>
                    <option value="restitution">Restitution de matériel emprunté</option>
                    <option value="reapprovisionnement">Livraison fournisseur / Réappro</option>
                    <option value="ajustement">Ajustement inventaire positif</option>
                  </>
                )}
              </select>
            </div>

            {/* Quantity Counter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantité *
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={movementType === 'sortie' ? selectedProduct.quantite : 9999}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition"
                >
                  +
                </button>
                <span className="text-xs text-slate-500">
                  {movementType === 'sortie'
                    ? `(Max dispo : ${selectedProduct.quantite})`
                    : 'unité(s)'}
                </span>
              </div>
            </div>
          </div>

          {/* Date de retour prévue (si emprunt) */}
          {movementType === 'sortie' && movementSubtype === 'emprunt' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Date de retour prévue
              </label>
              <input
                type="date"
                value={dateRetourPrevue}
                onChange={(e) => setDateRetourPrevue(e.target.value)}
                className="w-full md:w-64 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
          )}

          {/* Notes / Remarques */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarques / Notes (État du matériel, projet, motif)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Prêt pour chantier Bâtiment C, matériel testé et en bon état..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
            />
          </div>

          {/* Operator name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Opérateur / Magasinier validant
            </label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full md:w-64 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
            />
          </div>

          {/* Submit validation button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl"
            >
              Retour à l'étape précédente
            </button>

            <button
              type="button"
              onClick={handleValidateTransaction}
              className={`px-6 py-3 font-bold text-sm text-white rounded-xl shadow-lg transition flex items-center gap-2 ${
                movementType === 'sortie'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                Valider {movementType === 'sortie' ? 'la Sortie' : 'l’Entrée'} ({quantity} un.)
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: SUCCESS CONFIRMATION & RECEIPT */}
      {/* ========================================================================= */}
      {currentStep === 4 && lastMovement && (
        <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-xl space-y-6 animate-fade-in text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-900">
              Transaction Enregistrée avec Succès !
            </h3>
            <p className="text-xs text-slate-500">
              Le stock a été mis à jour instantanément en base de données.
            </p>
          </div>

          {/* Receipt Card */}
          <div className="max-w-md mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-5 text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-400">RÉF TRANSACTION:</span>
              <span className="font-bold text-slate-800">{lastMovement.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">TYPE MOUVEMENT:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  lastMovement.type === 'sortie'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {lastMovement.type.toUpperCase()} ({lastMovement.sousType})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">EMPLOYÉ:</span>
              <span className="font-bold text-slate-800 font-sans">
                {lastMovement.employeNom} ({lastMovement.employeMatricule})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">MATÉRIEL:</span>
              <span className="font-bold text-slate-800 font-sans truncate max-w-[200px]">
                {lastMovement.produitNom}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">QUANTITÉ:</span>
              <span className="font-bold text-indigo-600 text-sm">
                {lastMovement.quantite} unité(s)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DATE & HEURE:</span>
              <span className="text-slate-700">
                {new Date(lastMovement.date).toLocaleString('fr-FR')}
              </span>
            </div>
            {lastMovement.dateRetourPrevue && (
              <div className="flex justify-between border-t border-slate-200 pt-2 text-indigo-700 font-bold">
                <span>RETOUR PRÉVU:</span>
                <span>
                  {new Date(lastMovement.dateRetourPrevue).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Effectuer une Nouvelle Opération
            </button>
            {onNavigateToHistory && (
              <button
                onClick={onNavigateToHistory}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Consulter l'Historique
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        onScanSuccess={handleScanSuccess}
        title={
          scannerMode === 'qr_employee'
            ? 'Scanner le Badge QR de l\'Employé'
            : 'Scanner le Code-Barres du Matériel'
        }
        subtitle={
          scannerMode === 'qr_employee'
            ? 'Alignez le QR Code au centre du viseur'
            : 'Alignez le Code-Barres EAN-13 / Code128 au centre du viseur'
        }
        mode={scannerMode}
        sampleEmployees={employees}
        sampleProducts={products}
      />
    </div>
  );
};
