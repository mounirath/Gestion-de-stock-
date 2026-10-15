import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Plus, 
  Search, 
  QrCode, 
  Edit3, 
  Trash2, 
  Briefcase, 
  Mail, 
  Phone, 
  Building2,
  Users
} from 'lucide-react';
import { Employee } from '../../types';
import { storageService } from '../../services/storageService';
import { EmployeeBadgeModal } from './EmployeeBadgeModal';
import { EmployeeFormModal } from './EmployeeFormModal';

interface PersonnelModuleProps {
  employees: Employee[];
}

export const PersonnelModule: React.FC<PersonnelModuleProps> = ({ employees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedBadgeEmployee, setSelectedBadgeEmployee] = useState<Employee | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  // Departments list for filter
  const departments = Array.from(new Set(employees.map(e => e.departement))).filter(Boolean);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.poste.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDepartment === 'all' || emp.departement === selectedDepartment;
    return matchesSearch && matchesDept;
  });

  const handleOpenBadge = (emp: Employee) => {
    setSelectedBadgeEmployee(emp);
    setIsBadgeModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEmployeeToEdit(emp);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setEmployeeToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Confirmez-vous la suppression de la fiche employé de ${name} ?`)) {
      storageService.deleteEmployee(id);
    }
  };

  const handleSave = (emp: Employee) => {
    storageService.saveEmployee(emp);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Personnel & Badges QR</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos employés, générez leurs badges d'accès avec QR code infalsifiable pour les mouvements magasin.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ajouter un Employé
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, matricule, poste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition shadow-sm"
          />
        </div>

        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition shadow-sm"
        >
          <option value="all">Tous les départements ({employees.length})</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Employee Cards Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">Aucun employé trouvé</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Aucun membre du personnel ne correspond à vos critères de recherche.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDepartment('all');
            }}
            className="mt-4 px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Photo & Info */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {emp.photoUrl ? (
                      <img
                        src={emp.photoUrl}
                        alt={`${emp.prenom} ${emp.nom}`}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-base flex items-center justify-center shadow-sm">
                        {emp.prenom[0]}
                        {emp.nom[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition">
                        {emp.prenom} {emp.nom}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[150px]">{emp.poste}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Preview Thumbnail (Clickable to open full badge) */}
                  <button
                    onClick={() => handleOpenBadge(emp)}
                    title="Cliquer pour afficher le badge & imprimer"
                    className="p-1.5 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition shrink-0 group/qr"
                  >
                    <QRCodeSVG value={emp.matricule} size={44} level="M" />
                  </button>
                </div>

                {/* Details list */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Matricule :</span>
                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {emp.matricule}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 pt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.departement}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.telephone}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenBadge(emp)}
                  className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Badge Virtuel
                </button>

                <button
                  onClick={() => handleEdit(emp)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                  title="Modifier la fiche"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(emp.id, `${emp.prenom} ${emp.nom}`)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badge View Modal */}
      <EmployeeBadgeModal
        employee={selectedBadgeEmployee}
        isOpen={isBadgeModalOpen}
        onClose={() => {
          setIsBadgeModalOpen(false);
          setSelectedBadgeEmployee(null);
        }}
      />

      {/* Employee Add/Edit Form Modal */}
      <EmployeeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEmployeeToEdit(null);
        }}
        onSave={handleSave}
        employeeToEdit={employeeToEdit}
      />
    </div>
  );
};
