import { Employee, Product, StockMovement, DashboardStats, MovementType, MovementSubtype } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_PRODUCTS, INITIAL_MOVEMENTS } from '../data/initialData';
import { 
  db, 
  COLLECTIONS, 
  handleFirestoreError, 
  OperationType, 
  seedFirestoreIfEmpty,
  testFirebaseConnection 
} from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot 
} from 'firebase/firestore';

const STORAGE_KEYS = {
  EMPLOYEES: 'scanstock_employees_v1',
  PRODUCTS: 'scanstock_products_v1',
  MOVEMENTS: 'scanstock_movements_v1',
};

class StorageService {
  private listeners: (() => void)[] = [];
  private employeesCache: Employee[] = INITIAL_EMPLOYEES;
  private productsCache: Product[] = INITIAL_PRODUCTS;
  private movementsCache: StockMovement[] = INITIAL_MOVEMENTS;
  public isConnectedToFirebase: boolean = false;

  constructor() {
    this.initLocalCache();
    this.initFirebaseSync();
  }

  private initLocalCache() {
    try {
      const emp = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (emp) this.employeesCache = JSON.parse(emp);
      else localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));

      const prod = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (prod) this.productsCache = JSON.parse(prod);
      else localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));

      const mvt = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (mvt) this.movementsCache = JSON.parse(mvt);
      else localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    } catch {
      // Fallback
    }
  }

  private async initFirebaseSync() {
    testFirebaseConnection().then(async (connected) => {
      this.isConnectedToFirebase = connected;
      if (connected) {
        await seedFirestoreIfEmpty();
        this.setupRealtimeListeners();
      }
    });
  }

  private setupRealtimeListeners() {
    // 1. Listen to Personnel
    try {
      onSnapshot(
        collection(db, COLLECTIONS.PERSONNEL),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Employee[] = [];
            snapshot.forEach((d) => list.push(d.data() as Employee));
            this.employeesCache = list;
            localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
            this.notify();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PERSONNEL);
        }
      );
    } catch (e) {
      console.warn('Realtime listener error:', e);
    }

    // 2. Listen to Products
    try {
      onSnapshot(
        collection(db, COLLECTIONS.PRODUITS),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Product[] = [];
            snapshot.forEach((d) => list.push(d.data() as Product));
            this.productsCache = list;
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
            this.notify();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, COLLECTIONS.PRODUITS);
        }
      );
    } catch (e) {
      console.warn('Realtime listener error:', e);
    }

    // 3. Listen to Movements
    try {
      onSnapshot(
        collection(db, COLLECTIONS.MOUVEMENTS),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: StockMovement[] = [];
            snapshot.forEach((d) => list.push(d.data() as StockMovement));
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            this.movementsCache = list;
            localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(list));
            this.notify();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, COLLECTIONS.MOUVEMENTS);
        }
      );
    } catch (e) {
      console.warn('Realtime listener error:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  // --- EMPLOYEES ---
  public getEmployees(): Employee[] {
    return this.employeesCache;
  }

  public async saveEmployee(employee: Employee): Promise<Employee> {
    const list = [...this.employeesCache];
    const index = list.findIndex((e) => e.id === employee.id);
    if (index >= 0) {
      list[index] = employee;
    } else {
      list.unshift(employee);
    }
    this.employeesCache = list;
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
    this.notify();

    // Sync to Firestore
    try {
      await setDoc(doc(db, COLLECTIONS.PERSONNEL, employee.id), employee);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.PERSONNEL}/${employee.id}`);
    }

    return employee;
  }

  public async deleteEmployee(id: string): Promise<void> {
    this.employeesCache = this.employeesCache.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(this.employeesCache));
    this.notify();

    // Sync to Firestore
    try {
      await deleteDoc(doc(db, COLLECTIONS.PERSONNEL, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.PERSONNEL}/${id}`);
    }
  }

  public getEmployeeByMatricule(matricule: string): Employee | undefined {
    const clean = matricule.trim().toUpperCase();
    return this.employeesCache.find((e) => e.matricule.trim().toUpperCase() === clean);
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.productsCache;
  }

  public async saveProduct(product: Product): Promise<Product> {
    const list = [...this.productsCache];
    const index = list.findIndex((p) => p.id === product.id);
    const updatedProduct = {
      ...product,
      updatedAt: new Date().toISOString(),
    };
    if (index >= 0) {
      list[index] = updatedProduct;
    } else {
      list.unshift(updatedProduct);
    }
    this.productsCache = list;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
    this.notify();

    // Sync to Firestore
    try {
      await setDoc(doc(db, COLLECTIONS.PRODUITS, updatedProduct.id), updatedProduct);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.PRODUITS}/${updatedProduct.id}`);
    }

    return updatedProduct;
  }

  public async deleteProduct(id: string): Promise<void> {
    this.productsCache = this.productsCache.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.productsCache));
    this.notify();

    // Sync to Firestore
    try {
      await deleteDoc(doc(db, COLLECTIONS.PRODUITS, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.PRODUITS}/${id}`);
    }
  }

  public getProductByBarcode(codeBarre: string): Product | undefined {
    const clean = codeBarre.trim();
    return this.productsCache.find(
      (p) => p.codeBarre.trim() === clean || p.reference.toLowerCase() === clean.toLowerCase()
    );
  }

  // --- MOVEMENTS ---
  public getMovements(): StockMovement[] {
    return this.movementsCache;
  }

  public async recordMovement(params: {
    type: MovementType;
    sousType?: MovementSubtype;
    employeId: string;
    produitId: string;
    quantite: number;
    notes: string;
    operateur: string;
    dateRetourPrevue?: string;
  }): Promise<{ success: boolean; movement?: StockMovement; error?: string }> {
    const product = this.productsCache.find((p) => p.id === params.produitId);
    if (!product) {
      return { success: false, error: 'Matériel introuvable.' };
    }

    const employee = this.employeesCache.find((e) => e.id === params.employeId);
    if (!employee) {
      return { success: false, error: 'Employé introuvable.' };
    }

    if (params.quantite <= 0) {
      return { success: false, error: 'La quantité doit être supérieure à 0.' };
    }

    // Check stock for SORTIE
    if (params.type === 'sortie' && product.quantite < params.quantite) {
      return {
        success: false,
        error: `Stock insuffisant pour "${product.nom}". Disponible : ${product.quantite}, demandé : ${params.quantite}`,
      };
    }

    // Update Product Stock
    const newQuantity =
      params.type === 'sortie'
        ? product.quantite - params.quantite
        : product.quantite + params.quantite;

    const updatedProduct: Product = {
      ...product,
      quantite: newQuantity,
      updatedAt: new Date().toISOString(),
    };
    await this.saveProduct(updatedProduct);

    // Create Movement Record
    const newMovement: StockMovement = {
      id: `mvt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString(),
      type: params.type,
      sousType: params.sousType || (params.type === 'sortie' ? 'emprunt' : 'restitution'),
      employeId: employee.id,
      employeNom: `${employee.prenom} ${employee.nom}`,
      employeMatricule: employee.matricule,
      produitId: product.id,
      produitNom: product.nom,
      produitReference: product.reference,
      quantite: params.quantite,
      notes: params.notes,
      operateur: params.operateur || 'Agent Magasin',
      dateRetourPrevue: params.dateRetourPrevue,
      statutRetour: params.type === 'sortie' ? 'en_cours' : 'non_applicable',
    };

    const movements = [newMovement, ...this.movementsCache];
    this.movementsCache = movements;
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    this.notify();

    // Sync Movement to Firestore
    try {
      await setDoc(doc(db, COLLECTIONS.MOUVEMENTS, newMovement.id), newMovement);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.MOUVEMENTS}/${newMovement.id}`);
    }

    return { success: true, movement: newMovement };
  }

  public async markLoanReturned(
    loanMovementId: string,
    notes: string = 'Restitution validée'
  ): Promise<{ success: boolean; error?: string }> {
    const loan = this.movementsCache.find((m) => m.id === loanMovementId);
    if (!loan) return { success: false, error: 'Mouvement d’emprunt introuvable.' };

    // Update loan status
    loan.statutRetour = 'restitue';
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(this.movementsCache));
    this.notify();

    try {
      await setDoc(doc(db, COLLECTIONS.MOUVEMENTS, loan.id), loan);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.MOUVEMENTS}/${loan.id}`);
    }

    // Record return movement (ENTREE)
    const res = await this.recordMovement({
      type: 'entree',
      sousType: 'restitution',
      employeId: loan.employeId,
      produitId: loan.produitId,
      quantite: loan.quantite,
      notes: `${notes} (Lié à l'emprunt du ${new Date(loan.date).toLocaleDateString('fr-FR')})`,
      operateur: 'Magasinier',
    });

    return res;
  }

  // --- STATS ---
  public getDashboardStats(): DashboardStats {
    const todayStr = new Date().toISOString().split('T')[0];
    const movementsToday = this.movementsCache.filter((m) => m.date.startsWith(todayStr)).length;
    const lowStockCount = this.productsCache.filter((p) => p.quantite <= p.seuilAlerte).length;
    const totalQuantity = this.productsCache.reduce((acc, p) => acc + p.quantite, 0);
    const activeLoansCount = this.movementsCache.filter(
      (m) => m.type === 'sortie' && m.statutRetour === 'en_cours'
    ).length;

    return {
      totalProducts: this.productsCache.length,
      totalQuantity,
      lowStockCount,
      movementsToday,
      activeLoansCount,
    };
  }

  // --- EXPORT TO CSV ---
  public exportMovementsCSV(): void {
    const headers = [
      'ID',
      'Date/Heure',
      'Type',
      'Sous-type',
      'Matricule',
      'Employé',
      'Référence',
      'Produit',
      'Quantité',
      'Statut Retour',
      'Opérateur',
      'Notes',
    ];

    const rows = this.movementsCache.map((m) => [
      m.id,
      new Date(m.date).toLocaleString('fr-FR'),
      m.type.toUpperCase(),
      m.sousType || '',
      m.employeMatricule,
      `"${m.employeNom.replace(/"/g, '""')}"`,
      m.produitReference,
      `"${m.produitNom.replace(/"/g, '""')}"`,
      m.quantite,
      m.statutRetour || 'N/A',
      `"${m.operateur.replace(/"/g, '""')}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `historique_mouvements_stock_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public exportProductsCSV(): void {
    const headers = [
      'Référence',
      'Nom',
      'Catégorie',
      'Code-barres',
      'Stock Actuel',
      'Seuil Alerte',
      'Emplacement',
      'Prix Unitaire (€)',
      'Description',
    ];

    const rows = this.productsCache.map((p) => [
      p.reference,
      `"${p.nom.replace(/"/g, '""')}"`,
      `"${p.categorie.replace(/"/g, '""')}"`,
      p.codeBarre,
      p.quantite,
      p.seuilAlerte,
      `"${p.emplacement.replace(/"/g, '""')}"`,
      (p.prixUnitaire || 0).toFixed(2),
      `"${(p.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `catalogue_produits_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public async resetAllData(): Promise<void> {
    this.employeesCache = INITIAL_EMPLOYEES;
    this.productsCache = INITIAL_PRODUCTS;
    this.movementsCache = INITIAL_MOVEMENTS;

    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    this.notify();

    // Reset in Firestore
    try {
      for (const emp of INITIAL_EMPLOYEES) {
        await setDoc(doc(db, COLLECTIONS.PERSONNEL, emp.id), emp);
      }
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, COLLECTIONS.PRODUITS, prod.id), prod);
      }
      for (const mvt of INITIAL_MOVEMENTS) {
        await setDoc(doc(db, COLLECTIONS.MOUVEMENTS, mvt.id), mvt);
      }
    } catch {
      // Ignore
    }
  }
}

export const storageService = new StorageService();
