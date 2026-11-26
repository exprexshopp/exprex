import { AlertTriangle, Home, RotateCcw, MessageCircle } from "lucide-react";
import { Component, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { logger } from "../lib/logger";


interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('🚨 ErrorBoundary a capturé:', error);
    logger.error('📍 Stack composant:', errorInfo.componentStack);
    this.setState({ errorInfo });

    logger.error('Pile React capturée', errorInfo.componentStack || '');
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Oups, une erreur est survenue
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              L'incident a été enregistré automatiquement. Notre équipe va l'examiner.
            </p>

            {/* Afficher la stack uniquement en dev */}
            {isDev && this.state.error && (
              <div className="mb-6 text-left bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800 max-h-40 overflow-auto">
                <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all whitespace-pre-wrap">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack?.substring(0, 800)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className={cn(
                  "w-full py-3 rounded-2xl font-bold transition-all active:scale-95",
                  "bg-indigo-600 hover:bg-indigo-700 text-white",
                  "flex items-center justify-center gap-2"
                )}
              >
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Recharger la page
              </button>

              <a
                href="mailto:support@exprex.com?subject=Erreur%20application"
                className="w-full py-3 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contacter le support
              </a>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              Réf. : {Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
