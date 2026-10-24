import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            🛍️ Vitrine Digital
          </h1>
          <p className="text-gray-400 text-lg">
            Catálogo digital com pedidos via WhatsApp para lojas de moda
          </p>
        </div>

        {/* Status */}
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-green-300 text-sm">
          ✅ Sistema operacional — MVA Estúdio Criativo
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/superadmin"
            className="bg-purple-700 hover:bg-purple-600 transition-colors rounded-xl p-6 text-left space-y-1"
          >
            <div className="text-lg font-semibold">⚙️ Painel Superadmin</div>
            <div className="text-purple-300 text-sm">Gerenciar lojas e clientes</div>
          </Link>

          <Link
            href="/login"
            className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-xl p-6 text-left space-y-1"
          >
            <div className="text-lg font-semibold">🔑 Login da Loja</div>
            <div className="text-gray-400 text-sm">Acesso ao painel do lojista</div>
          </Link>
        </div>

        {/* Info */}
        <div className="text-gray-600 text-xs space-y-1">
          <p>Para acessar uma vitrine: <code className="bg-gray-800 px-1 rounded">/loja/[slug-da-loja]</code></p>
          <p>Desenvolvido por <a href="https://mvaestudio.com.br" className="text-purple-400 hover:underline">MVA Estúdio Criativo</a></p>
        </div>
      </div>
    </main>
  );
}
