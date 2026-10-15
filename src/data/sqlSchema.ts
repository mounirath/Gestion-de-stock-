export const SQL_SCHEMA = `-- ==============================================================================
-- SCHÉMA DE BASE DE DONNÉES : GESTION DE STOCK ET MATÉRIEL (SCANSTOCK)
-- Compatible PostgreSQL / Supabase
-- Inclut : Tables, Clés Étrangères, Index de recherche, Trigger de mise à jour de stock
-- ==============================================================================

-- 1. Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE DU PERSONNEL (Employés & Badges QR Code)
CREATE TABLE personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricule VARCHAR(50) UNIQUE NOT NULL,      -- Encodé dans le QR Code (ex: EMP-2024-001)
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    poste VARCHAR(120) NOT NULL,
    departement VARCHAR(100) DEFAULT 'Général',
    email VARCHAR(150) UNIQUE,
    telephone VARCHAR(30),
    photo_url TEXT,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par matricule lors du scan QR
CREATE INDEX idx_personnel_matricule ON personnel(matricule);
CREATE INDEX idx_personnel_nom ON personnel(nom, prenom);

-- 3. TABLE DES CATÉGORIES DE MATÉRIEL
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE DU CATALOGUE MATÉRIEL & PRODUITS (Codes-Barres)
CREATE TABLE produits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(50) UNIQUE NOT NULL,       -- Réf interne (ex: OUT-PERC-01)
    nom VARCHAR(200) NOT NULL,
    categorie_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    code_barres VARCHAR(100) UNIQUE NOT NULL,    -- EAN-13 ou CODE-128 scanné par caméra
    quantite_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantite_stock >= 0),
    seuil_alerte INTEGER NOT NULL DEFAULT 3 CHECK (seuil_alerte >= 0),
    emplacement VARCHAR(100) NOT NULL,           -- Ex: Atelier B - Armoire 02
    description TEXT,
    prix_unitaire NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche instantanée par code-barres lors du scan caméra
CREATE INDEX idx_produits_code_barres ON produits(code_barres);
CREATE INDEX idx_produits_reference ON produits(reference);

-- 5. TABLE DES MOUVEMENTS DE STOCK & ENTRÉES / SORTIES
CREATE TYPE type_mouvement_enum AS ENUM ('ENTREE', 'SORTIE');
CREATE TYPE sous_type_enum AS ENUM ('emprunt', 'restitution', 'reapprovisionnement', 'ajustement', 'perte_casse');
CREATE TYPE statut_retour_enum AS ENUM ('en_cours', 'restitue', 'non_applicable');

CREATE TABLE mouvements_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produit_id UUID NOT NULL REFERENCES produits(id) ON DELETE RESTRICT,
    personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE RESTRICT,
    type_mouvement type_mouvement_enum NOT NULL,
    sous_type sous_type_enum DEFAULT 'emprunt',
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    notes TEXT,
    operateur VARCHAR(100) NOT NULL DEFAULT 'Magasinier',
    date_mouvement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_retour_prevue TIMESTAMP WITH TIME ZONE,
    statut_retour statut_retour_enum DEFAULT 'non_applicable'
);

-- Index pour filtrage chronologique et suivi des emprunts
CREATE INDEX idx_mouvements_date ON mouvements_stock(date_mouvement DESC);
CREATE INDEX idx_mouvements_produit ON mouvements_stock(produit_id);
CREATE INDEX idx_mouvements_personnel ON mouvements_stock(personnel_id);
CREATE INDEX idx_mouvements_statut_retour ON mouvements_stock(statut_retour);

-- ==============================================================================
-- 6. TRIGGER AUTOMATIQUE : Mise à jour du stock en temps réel
-- ==============================================================================
CREATE OR REPLACE FUNCTION fn_update_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type_mouvement = 'SORTIE' THEN
        -- Vérification stock suffisant
        IF (SELECT quantite_stock FROM produits WHERE id = NEW.produit_id) < NEW.quantite THEN
            RAISE EXCEPTION 'Stock insuffisant pour le produit ID %', NEW.produit_id;
        END IF;

        -- Décrémentation
        UPDATE produits
        SET quantite_stock = quantite_stock - NEW.quantite,
            updated_at = NOW()
        WHERE id = NEW.produit_id;

    ELSIF NEW.type_mouvement = 'ENTREE' THEN
        -- Incrémentation
        UPDATE produits
        SET quantite_stock = quantite_stock + NEW.quantite,
            updated_at = NOW()
        WHERE id = NEW.produit_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apply_stock_movement
AFTER INSERT ON mouvements_stock
FOR EACH ROW
EXECUTE FUNCTION fn_update_stock_on_movement();
`;

export const SUPABASE_CLIENT_SNIPPET = `// lib/supabase.ts
// Exemple d'initialisation et requêtes avec @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'votre-cle-anon-publique';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 1. Rechercher un employé par son QR Code (Matricule)
 */
export async function getEmployeeByMatricule(matricule: string) {
  const { data, error } = await supabase
    .from('personnel')
    .select('*')
    .eq('matricule', matricule.trim())
    .single();

  if (error) throw error;
  return data;
}

/**
 * 2. Rechercher un produit par son Code-Barres
 */
export async function getProductByBarcode(codeBarres: string) {
  const { data, error } = await supabase
    .from('produits')
    .select('*')
    .eq('code_barres', codeBarres.trim())
    .single();

  if (error) throw error;
  return data;
}

/**
 * 3. Enregistrer un mouvement (le trigger Postgres met à jour le stock automatiquement)
 */
export async function recordStockMovement(movement: {
  produit_id: string;
  personnel_id: string;
  type_mouvement: 'ENTREE' | 'SORTIE';
  quantite: number;
  notes?: string;
  operateur: string;
}) {
  const { data, error } = await supabase
    .from('mouvements_stock')
    .insert([movement])
    .select()
    .single();

  if (error) throw error;
  return data;
}
`;
