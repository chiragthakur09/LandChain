"use client";

import { useState } from "react";
import { Search, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export function HeroSearch() {
    const [ulpin, setParcelId] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const handleVerify = async () => {
        if (!ulpin) return;
        setLoading(true);
        setResult(null);
        setError("");

        try {
            // Use 127.0.0.1 to avoid ambiguous localhost resolution (IPv4 vs IPv6)
            const res = await fetch(`http://127.0.0.1:3001/land/${ulpin}`);

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();

            // Simulate network delay for "Vibe"
            setTimeout(() => {
                if (data.status) {
                    setResult(data);
                } else {
                    setError("Parcel not found or invalid response structure");
                }
                setLoading(false);
            }, 1000);

        } catch (err: any) {
            console.error(err);
            // Display the actual error message to help debugging
            setError(err.message || "Could not connect to LandChain Node");
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Enter Survey Number / Parcel ID (e.g. PARCEL_001)"
                    className="w-full py-4 pl-12 pr-32 text-lg border-2 border-gray-200 rounded-2xl focus:border-indigo-600 focus:outline-none shadow-sm transition-all"
                    value={ulpin}
                    onChange={(e) => setParcelId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
                <button
                    onClick={handleVerify}
                    disabled={loading}
                    className="absolute right-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Title"}
                </button>
            </div>

            {result && (
                <div className={`p-6 rounded-2xl border-2 ${result.status === 'FREE' ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                    <div className="flex items-start gap-4">
                        {result.status === 'FREE' ? (
                            <div className="p-3 bg-green-100 rounded-full text-green-600">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                        ) : (
                            <div className="p-3 bg-red-100 rounded-full text-red-600">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                        )}

                        <div className="flex-1">
                            <h3 className={`text-xl font-bold ${result.status === 'FREE' ? 'text-green-900' : 'text-red-900'}`}>
                                {result.status === 'FREE' ? 'Conclusive Title Verified' : 'Encumbrance Detected'}
                            </h3>
                            <p className="mt-1 text-gray-600">
                                Parcel ID: <span className="font-mono font-medium">{result.ulpin}</span>
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="bg-white/60 p-3 rounded-lg">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</span>
                                    <p className="font-medium text-gray-900 truncate">{result.ownerId}</p>
                                </div>
                                <div className="bg-white/60 p-3 rounded-lg">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                                    <p className={`font-medium ${result.status === 'FREE' ? 'text-green-700' : 'text-red-700'}`}>
                                        {result.status}
                                    </p>
                                </div>
                            </div>

                            {result.encumbrances.length > 0 && (
                                <div className="mt-4 p-3 bg-red-100/50 rounded-lg text-sm text-red-800">
                                    <strong>Active Liens:</strong>
                                    <ul className="list-disc pl-4 mt-1">
                                        {result.encumbrances.map((e: any) => (
                                            <li key={e.id}>{e.type} issued by {e.issuer}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-gray-50 text-gray-500 rounded-xl text-center border">
                    {error}
                </div>
            )}
        </div>
    );
}
