import React, { useState } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  History,
  RotateCcw
} from 'lucide-react';
import { StockMovement, Employee, Product } from '../../types';
import { storageService } from '../../services/storageService';

interface HistoryModuleProps {
  movements: StockMovement[];
  employees: Employee[];
  products: Product[];
}

export const HistoryModule: React.FC<HistoryModuleProps> = ({
  movements,
  employees,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'loans'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'entree' | 'sortie'>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Handle return loan
  const handleReturnLoan = async (movementId: string, productName: string) => {
    if (confirm(`Confirmez-vous le retour en stock du matériel "${productName}" ?`)) {
      const res = await storageService.markLoanReturned(movementId, 'Restitution confirmée depuis le journal');
      if (!res.success) {
        alert(res.error || 'Erreur lors de la restitution.');
      }
    }
  };

  const filteredMovements = movements.filter((m) => {
    if (activeTab === 'loans') {
      if (!(m.type === 'sortie' && m.statutRetour === 'en_cours')) return false;
    }

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.produitNom.toLowerCase().includes(term) ||
      m.produitReference.toLowerCase().includes(term) ||
      m.employeNom.toLowerCase().includes(term) ||
      m.employeMatricule.toLowerCase().includes(term) ||
      (m.notes && m.notes.toLowerCase().includes(term));

    const matchesType = selectedType === 'all' || m.type === selectedType;
    const matchesEmployee = selectedEmployeeId === 'all' || m.employeId === selectedEmployeeId;

    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(m.date) >= new Date(dateFrom);
    }
    if (dateTo) {
      // Include whole end day
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(m.date) <= end;
    }

    return matchesSearch && matchesType && matchesEmployee && matchesDate;
  });

  const activeLoansCount = movements.filter(
    (m) => m.type === 'sortie' && m.statutRetour === 'en_cours'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Historique & Traçabilité des Mouvements</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit complet des entrées, sorties, emprunts et restitutions avec horodatage et opérateur.
          </p>
        </div>

        <button
          onClick={() => storageService.exportMovementsCSV()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-md transition shrink-0"
        >
          <Download className="w-4 h-4" />
          Exporter l'Historique (CSV)
        </button>
      </div>

      {/* Tabs: Tous les mouvements vs Emprunts en cours */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Tous les Mouvements</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px]">
            {movements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'loans'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Emprunts Non Restitués</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] ${
              activeLoansCount > 0
                ? 'bg-amber-100 text-amber-800 font-bold'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {activeLoansCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filtres de recherche :</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Text search */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par matériel, réf, employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Type filter */}
          {activeTab === 'all' && (
            <div className="lg:col-span-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'entree' | 'sortie')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="all">Tous les types</option>
                <option value="sortie">Sorties / Emprunts</option>
                <option value="entree">Entrées / Retours</option>
              </select>
            </div>
          )}

          {/* Employee filter */}
          <div className={activeTab === 'all' ? 'lg:col-span-2' : 'lg:col-span-4'}>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Tous les employés</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.prenom} {emp.nom} ({emp.matricule})
                </option>
              ))}
            </select>
          </div>

          {/* Date range From */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Du..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Date range To */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Au..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date & Heure</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Employé (Badge QR)</th>
                <th className="py-3.5 px-4">Matériel & Réf</th>
                <th className="py-3.5 px-4 text-center">Quantité</th>
                <th className="py-3.5 px-4">Notes / Contexte</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Aucun mouvement trouvé</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeTab === 'loans'
                        ? 'Tous les emprunts ont été restitués.'
                        : 'Aucune donnée pour les critères sélectionnés.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isLoanActive = m.type === 'sortie' && m.statutRetour === 'en_cours';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {new Date(m.date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(m.date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            m.type === 'sortie'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {m.type === 'sortie' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          {m.type === 'sortie' ? 'SORTIE' : 'ENTRÉE'}
                        </span>
                        {m.sousType && (
                          <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                            {m.sousType}
                          </div>
                        )}
                      </td>

                      {/* Employé */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{m.employeNom}</div>
                        <div className="font-mono text-[11px] text-indigo-600 font-semibold">
                          {m.employeMatricule}
                        </div>
                      </td>

                      {/* Produit */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{m.produitNom}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {m.produitReference}
                        </div>
                      </td>

                      {/* Quantité */}
                      <td className="py-3.5 px-4 text-center font-bold text-sm">
                        <span
                          className={m.type === 'sortie' ? 'text-amber-700' : 'text-emerald-700'}
                        >
                          {m.type === 'sortie' ? '-' : '+'}
                          {m.quantite} un.
                        </span>
                      </td>

                      {/* Notes & Opérateur */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-700 text-xs truncate" title={m.notes}>
                          {m.notes || '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Par : {m.operateur}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isLoanActive ? (
                          <button
                            onClick={() => handleReturnLoan(m.id, m.produitNom)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm ml-auto transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Valider Retour
                          </button>
                        ) : m.statutRetour === 'restitue' ? (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Restitué
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
