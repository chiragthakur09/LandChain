import { HeroSearch } from "@/components/hero-search";

export default function Home() {
    return (
        <main className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
                        <span className="font-bold text-xl text-gray-900">LandChain</span>
                    </div>
                    <nav className="flex gap-6 text-sm font-medium text-gray-600">
                        <a href="#" className="hover:text-indigo-600">Registry</a>
                        <a href="#" className="hover:text-indigo-600">Validator Nodes</a>
                        <a href="#" className="hover:text-indigo-600">Docs</a>
                        <a href="#" className="text-indigo-600">Login (Aadhaar)</a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <div className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-medium animate-in fade-in zoom-in duration-500">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                        Gov-Tech 3.0 Live on Hyperledger
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
                        Conclusive Titling.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                            Code is Law.
                        </span>
                    </h1>

                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        The national standard for immutable land records. Instant mutation,
                        fraud-proof ownership, and atomic settlements via Smart Contracts.
                    </p>

                    <div className="pt-8">
                        <HeroSearch />
                    </div>
                </div>
            </div>

            {/* Stats / Footer Mock */}
            <div className="border-t border-gray-200 bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="text-3xl font-bold text-gray-900">100%</div>
                        <div className="text-sm text-gray-500 mt-1">Tamper Proof Records</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-gray-900">&lt; 2s</div>
                        <div className="text-sm text-gray-500 mt-1">Mutation & Settlement</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-gray-900">Zero</div>
                        <div className="text-sm text-gray-500 mt-1">Litigation on New Titles</div>
                    </div>
                </div>
            </div>
        </main>
    );
}
