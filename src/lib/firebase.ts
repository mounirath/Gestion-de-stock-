import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Employee, Product, StockMovement } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_PRODUCTS, INITIAL_MOVEMENTS } from '../data/initialData';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId as required by AI Studio Firestore setup
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Error Handler Specification as instructed in Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Client offline ou configuration Firebase en cours.");
      return false;
    }
    return true;
  }
}

// Collections Names
export const COLLECTIONS = {
  PERSONNEL: 'personnel',
  PRODUITS: 'produits',
  MOUVEMENTS: 'mouvements_stock',
};

// Seed initial data to Firestore if collection is empty
export async function seedFirestoreIfEmpty() {
  try {
    // 1. Check personnel
    const empSnap = await getDocs(collection(db, COLLECTIONS.PERSONNEL));
    if (empSnap.empty) {
      for (const emp of INITIAL_EMPLOYEES) {
        await setDoc(doc(db, COLLECTIONS.PERSONNEL, emp.id), emp);
      }
    }

    // 2. Check products
    const prodSnap = await getDocs(collection(db, COLLECTIONS.PRODUITS));
    if (prodSnap.empty) {
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, COLLECTIONS.PRODUITS, prod.id), prod);
      }
    }

    // 3. Check movements
    const mvtSnap = await getDocs(collection(db, COLLECTIONS.MOUVEMENTS));
    if (mvtSnap.empty) {
      for (const mvt of INITIAL_MOVEMENTS) {
        await setDoc(doc(db, COLLECTIONS.MOUVEMENTS, mvt.id), mvt);
      }
    }
  } catch (error) {
    console.warn('Initial seeding error or offline:', error);
  }
}
