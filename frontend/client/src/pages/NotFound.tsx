import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-lg shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-slate-800/90">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-100 dark:bg-amber-900/30 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-amber-500" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2">404</h1>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Page introuvable
          </h2>

          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            La page que vous cherchez n'existe pas ou a été déplacée.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => setLocation("/")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="px-6 py-2.5 rounded-lg"
            >
              <Search className="w-4 h-4 mr-2" />
              Parcourir le catalogue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
