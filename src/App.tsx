/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  QrCode, 
  Boxes, 
  Users, 
  History, 
  Database, 
  RotateCcw, 
  AlertTriangle,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { storageService } from './services/storageService';
import { Employee, Product, StockMovement, DashboardStats } from './types';
import { DashboardModule } from './components/dashboard/DashboardModule';
import { TransactionScanner } from './components/scanner/TransactionScanner';
import { PersonnelModule } from './components/personnel/PersonnelModule';
import { ProductsModule } from './components/products/ProductsModule';
import { HistoryModule } from './components/history/HistoryModule';
import { DatabaseSchemaModal } from './components/schema/DatabaseSchemaModal';

type ActiveTab = 'dashboard' | 'scanner' | 'personnel' | 'products' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalQuantity: 0,
    lowStockCount: 0,
    movementsToday: 0,
    activeLoansCount: 0,
  });

  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync state from storageService
  const refreshData = () => {
    setEmployees(storageService.getEmployees());
    setProducts(storageService.getProducts());
    setMovements(storageService.getMovements());
    setStats(storageService.getDashboardStats());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = storageService.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  const handleResetData = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données aux valeurs de démonstration d’usine ?')) {
      storageService.resetAllData();
      setActiveTab('dashboard');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'scanner', label: 'Scanner Entrée / Sortie', icon: QrCode, highlight: true },
    { id: 'products', label: 'Catalogue & Matériel', icon: Boxes },
    { id: 'personnel', label: 'Personnel & Badges QR', icon: Users },
    { id: 'history', label: 'Historique & Traçabilité', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* ========================================================================= */}
      {/* TOP HEADER / APP BAR */}
      {/* ========================================================================= */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-600/20 group-hover:scale-105 transition">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    ScanStock
                  </span>
                  <span className="text-[10px] uppercase font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 -mt-0.5 hidden sm:block">
                  Gestion de Stock & Matériel QR/Barre
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? item.highlight
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-900'
                      : item.highlight
                      ? 'text-indigo-600 hover:bg-indigo-50 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.id === 'products' && stats.lowStockCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Firebase Live Status Pill */}
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition"
              title="Firebase Firestore Cloud Connecté en temps réel"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline font-bold">Firebase Cloud</span>
            </button>

            {/* SQL & DB Modal Button */}
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-xl border border-slate-200 transition"
              title="Voir les détails Firebase Firestore & Schéma SQL"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Base & Schémas</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={handleResetData}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              title="Réinitialiser les données démo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg animate-fade-in">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'products' && stats.lowStockCount > 0 && (
                    <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {stats.lowStockCount} alertes
                    </span>
                  )}
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsSchemaModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Schéma SQL & Intégration Supabase</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* LOW STOCK BANNER ALERT (IF APPLICABLE) */}
      {/* ========================================================================= */}
      {stats.lowStockCount > 0 && activeTab === 'dashboard' && (
        <div className="no-print bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold border-b border-amber-600/30 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-950 shrink-0" />
              <span>
                Attention : <strong>{stats.lowStockCount} article(s)</strong> ont atteint ou dépassé leur seuil d'alerte de stock bas.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-[11px] underline font-bold hover:text-white"
            >
              Voir les articles en alerte &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT VIEWPORT */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardModule
            stats={stats}
            products={products}
            employees={employees}
            movements={movements}
            onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
            onOpenQuickScan={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'scanner' && (
          <TransactionScanner
            employees={employees}
            products={products}
            onMovementCreated={() => refreshData()}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'products' && (
          <ProductsModule
            products={products}
            employees={employees}
          />
        )}

        {activeTab === 'personnel' && (
          <PersonnelModule
            employees={employees}
          />
        )}

        {activeTab === 'history' && (
          <HistoryModule
            movements={movements}
            employees={employees}
            products={products}
          />
        )}
      </main>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="no-print border-t border-slate-200 bg-white mt-auto py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ScanStock • Système de Traçabilité Magasin & Matériel</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>QR Code Personnel</span>
            <span>•</span>
            <span>Code-Barres EAN-13 / Code128</span>
            <span>•</span>
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="hover:text-indigo-600 text-slate-500 font-semibold"
            >
              Schéma PostgreSQL / Supabase
            </button>
          </div>
        </div>
      </footer>

      {/* Database Schema & Supabase Modal */}
      <DatabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
}
