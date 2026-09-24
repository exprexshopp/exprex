import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { useLocation } from "wouter";

export function ErrorPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Service temporairement indisponible
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Nous rencontrons des difficultés pour joindre nos serveurs. Veuillez réessayer dans quelques instants.
        </p>
        <div className="space-y-2">
          <button
            onClick={() => setLocation('/')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" /> Retour à l'accueil
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}
