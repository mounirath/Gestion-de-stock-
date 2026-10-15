export type MovementType = 'entree' | 'sortie';

export type MovementSubtype = 
  | 'emprunt' 
  | 'restitution' 
  | 'reapprovisionnement' 
  | 'ajustement' 
  | 'perte_casse';

export interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  poste: string;
  departement: string;
  email: string;
  telephone: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  nom: string;
  reference: string;
  categorie: string;
  codeBarre: string;
  quantite: number;
  seuilAlerte: number;
  emplacement: string;
  description?: string;
  prixUnitaire?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  date: string;
  type: MovementType;
  sousType?: MovementSubtype;
  employeId: string;
  employeNom: string;
  employeMatricule: string;
  produitId: string;
  produitNom: string;
  produitReference: string;
  quantite: number;
  notes: string;
  operateur: string;
  dateRetourPrevue?: string;
  statutRetour?: 'en_cours' | 'restitue' | 'non_applicable';
}

export interface DashboardStats {
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  movementsToday: number;
  activeLoansCount: number;
}
