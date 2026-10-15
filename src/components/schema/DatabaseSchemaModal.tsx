import React, { useState } from 'react';
import { Database, Copy, Check, X, FileCode, Layers, ShieldCheck, Terminal, Flame } from 'lucide-react';
import { SQL_SCHEMA, SUPABASE_CLIENT_SNIPPET } from '../../data/sqlSchema';
import firebaseConfig from '../../../firebase-applet-config.json';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIREBASE_INFO = `// Configuration Firebase Cloud Firestore (Projet Actif)
// Projet ID : ${firebaseConfig.projectId}
// Base de données : ${firebaseConfig.firestoreDatabaseId}

Collections Actives & Schéma NoSQL :
1. "personnel"
   - ID: string (ex: "emp-001")
   - matricule: string (unique, encodé dans le QR code)
   - nom, prenom, poste, departement, email, telephone, photoUrl

2. "produits"
   - ID: string (ex: "prod-001")
   - reference: string (unique)
   - codeBarre: string (unique, EAN-13 ou CODE-128 scanné)
   - nom, categorie, quantite, seuilAlerte, emplacement, prixUnitaire

3. "mouvements_stock"
   - ID: string (ex: "mvt-101")
   - date: ISO timestamp
   - type: "entree" | "sortie"
   - sousType: "emprunt" | "restitution" | "reapprovisionnement" | ...
   - employeId, employeNom, employeMatricule
   - produitId, produitNom, produitReference
   - quantite, notes, operateur, dateRetourPrevue, statutRetour

// Règles de sécurité déployées : firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /personnel/{personnelId} {
      allow read, write: if true;
    }
    match /produits/{produitId} {
      allow read, write: if true;
    }
    match /mouvements_stock/{mouvementId} {
      allow read, create, update: if true;
      allow delete: if false;
    }
  }
}
`;

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'sql' | 'supabase'>('firebase');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const contentToCopy =
    activeTab === 'firebase'
      ? FIREBASE_INFO
      : activeTab === 'sql'
      ? SQL_SCHEMA
      : SUPABASE_CLIENT_SNIPPET;

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 text-slate-100 rounded-3xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 text-white rounded-xl">
              <Flame className="w-5 h-5 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Bases de Données & Intégrations Cloud
              </h3>
              <p className="text-xs text-slate-400">
                Firebase Firestore (Connecté & Actif) • Schéma SQL PostgreSQL & Supabase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-6 py-2.5 bg-slate-950 flex gap-2 border-b border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('firebase')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'firebase'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
            1. Firebase Firestore (Projet Actif)
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'sql'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            2. Schéma SQL DDL (PostgreSQL)
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition shrink-0 ${
              activeTab === 'supabase'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            3. Client Supabase JS
          </button>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto font-mono text-xs leading-relaxed bg-slate-900/95 text-slate-200">
          <pre className="whitespace-pre-wrap select-all">
            {activeTab === 'firebase'
              ? FIREBASE_INFO
              : activeTab === 'sql'
              ? SQL_SCHEMA
              : SUPABASE_CLIENT_SNIPPET}
          </pre>
        </div>

        {/* Highlights footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Flame className="w-4 h-4 fill-amber-400" /> Firestore temps réel actif ({firebaseConfig.projectId})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Layers className="w-4 h-4" /> Persistance multi-appareils
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
