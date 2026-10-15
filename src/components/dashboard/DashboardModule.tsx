import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  ArrowLeftRight, 
  Clock, 
  PlusCircle, 
  QrCode, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Product, Employee, StockMovement, DashboardStats } from '../../types';

interface DashboardModuleProps {
  stats: DashboardStats;
  products: Product[];
  employees: Employee[];
  movements: StockMovement[];
  onNavigateTab: (tab: string) => void;
  onOpenQuickScan: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  stats,
  products,
  employees,
  movements,
  onNavigateTab,
  onOpenQuickScan,
}) => {
  const lowStockProducts = products.filter((p) => p.quantite <= p.seuilAlerte);
  const activeLoans = movements.filter((m) => m.type === 'sortie' && m.statutRetour === 'en_cours');
  const recentMovements = movements.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Articles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Articles Référencés
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stats.totalProducts}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats.totalQuantity} unités physiques en stock
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigateTab('products')}
          className={`cursor-pointer p-5 rounded-2xl border shadow-sm flex items-center justify-between transition hover:shadow-md ${
            stats.lowStockCount > 0
              ? 'bg-amber-50/60 border-amber-300 text-amber-950'
              : 'bg-white border-slate-200/80 text-slate-900'
          }`}
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Stock Bas / Rupture
            </span>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {stats.lowStockCount}
            </div>
            <div className="text-[11px] text-amber-800/80 mt-0.5">
              {stats.lowStockCount > 0 ? 'Réapprovisionnement requis' : 'Tous stocks optimaux'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Mouvements Aujourd'hui */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Flux Aujourd'hui
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stats.movementsToday}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Entrées et sorties magasin
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        {/* Emprunts Actifs */}
        <div
          onClick={() => onNavigateTab('history')}
          className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:shadow-md transition"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Emprunts en Cours
            </span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">
              {stats.activeLoansCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Matériels sortis sur le terrain
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1 text-center md:text-left">
          <h3 className="text-lg font-bold">Poste de Scan Magasin & Entrepôt</h3>
          <p className="text-xs text-slate-300 max-w-lg">
            Démarrez une transaction d'entrée ou de sortie en scannant le QR code du personnel et le code-barres du produit via la caméra.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenQuickScan}
            className="py-2.5 px-5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 transition flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Lancer un Scan Entrée / Sortie
          </button>
          <button
            onClick={() => onNavigateTab('products')}
            className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Produit
          </button>
        </div>
      </div>

      {/* Main Grid: Stock Alerts & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Low Stock Warnings */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Alertes de Réapprovisionnement ({lowStockProducts.length})
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('products')}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                Gérer
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-600">
                  Tous les stocks sont au-dessus de leur seuil d'alerte.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 flex items-center justify-between"
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {p.nom}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{p.reference}</span>
                        <span>• {p.emplacement}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.quantite === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.quantite} / {p.seuilAlerte} min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Movements Audit Log */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Derniers Mouvements Traités
                </h4>
              </div>
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
              >
                Voir tout ({movements.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {recentMovements.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        m.type === 'sortie'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {m.type === 'sortie' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 truncate">
                        {m.produitNom}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5 truncate">
                        Par <strong>{m.employeNom}</strong> ({m.employeMatricule})
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900">
                      {m.type === 'sortie' ? '-' : '+'}
                      {m.quantite} un.
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(m.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
