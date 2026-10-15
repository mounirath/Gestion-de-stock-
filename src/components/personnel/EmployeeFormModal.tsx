import React, { useState, useEffect } from 'react';
import { X, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import { Employee } from '../../types';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employeeToEdit,
}) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [matricule, setMatricule] = useState('');
  const [poste, setPoste] = useState('');
  const [departement, setDepartement] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeToEdit) {
      setNom(employeeToEdit.nom);
      setPrenom(employeeToEdit.prenom);
      setMatricule(employeeToEdit.matricule);
      setPoste(employeeToEdit.poste);
      setDepartement(employeeToEdit.departement);
      setEmail(employeeToEdit.email);
      setTelephone(employeeToEdit.telephone);
      setPhotoUrl(employeeToEdit.photoUrl || '');
    } else {
      // Reset & generate fresh matricule
      setNom('');
      setPrenom('');
      setMatricule(`EMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setPoste('');
      setDepartement('Atelier & Maintenance');
      setEmail('');
      setTelephone('');
      setPhotoUrl('');
    }
    setError(null);
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleGenerateMatricule = () => {
    const random = Math.floor(100 + Math.random() * 900);
    setMatricule(`EMP-${new Date().getFullYear()}-${random}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim() || !matricule.trim() || !poste.trim()) {
      setError('Veuillez renseigner au moins le Nom, Prénom, Matricule et Poste.');
      return;
    }

    const employeeData: Employee = {
      id: employeeToEdit ? employeeToEdit.id : `emp-${Date.now()}`,
      nom: nom.trim(),
      prenom: prenom.trim(),
      matricule: matricule.trim().toUpperCase(),
      poste: poste.trim(),
      departement: departement.trim() || 'Général',
      email: email.trim() || `${prenom.toLowerCase()}.${nom.toLowerCase()}@entreprise.fr`,
      telephone: telephone.trim() || '+33 6 00 00 00 00',
      photoUrl: photoUrl.trim() || undefined,
      createdAt: employeeToEdit ? employeeToEdit.createdAt : new Date().toISOString(),
    };

    onSave(employeeData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {employeeToEdit ? 'Modifier la fiche employé' : 'Ajouter un nouvel employé'}
              </h3>
              <p className="text-xs text-slate-500">
                Génération immédiate du QR Code et du badge d'identification
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

          {/* Nom & Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Alexandre"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Dupont"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
          </div>

          {/* Matricule avec auto-génération */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Matricule (Identifiant QR Code) *
              </label>
              <button
                type="button"
                onClick={handleGenerateMatricule}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Générer auto
              </button>
            </div>
            <input
              type="text"
              required
              value={matricule}
              onChange={(e) => setMatricule(e.target.value.toUpperCase())}
              placeholder="Ex: EMP-2024-001"
              className="w-full px-3.5 py-2 font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
            />
          </div>

          {/* Poste & Département */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Poste / Rôle *
              </label>
              <input
                type="text"
                required
                value={poste}
                onChange={(e) => setPoste(e.target.value)}
                placeholder="Ex: Électrotechnicien"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Département
              </label>
              <select
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              >
                <option value="Maintenance Industrielle">Maintenance Industrielle</option>
                <option value="Infrastructure IT">Infrastructure IT</option>
                <option value="Opérations & Travaux">Opérations & Travaux</option>
                <option value="Atelier de Production">Atelier de Production</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Direction & Encadrement">Direction & Encadrement</option>
              </select>
            </div>
          </div>

          {/* Email & Téléphone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Professionnel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@entreprise.fr"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+33 6 ..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL de la photo (facultatif)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
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
              {employeeToEdit ? 'Enregistrer les modifications' : 'Créer l’Employé & le Badge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
