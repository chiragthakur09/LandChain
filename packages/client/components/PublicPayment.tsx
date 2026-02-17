"use client";

import { useState } from 'react';
import { Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PublicPayment() {
    const [utr, setUtr] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [paymentData, setPaymentData] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleCheck = async () => {
        if (!utr) return;
        setStatus('LOADING');
        setErrorMsg('');
        setPaymentData(null);

        try {
            // In a real app, use environment variable for API URL
            const res = await fetch(`http://localhost:3001/land/payment/${utr}`);
            if (!res.ok) {
                if (res.status === 404 || res.status === 400) {
                    throw new Error('Payment Record Not Found');
                }
                throw new Error('Failed to fetch payment details');
            }
            const data = await res.json();
            setPaymentData(data);
            setStatus('SUCCESS');
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || 'Verification Failed');
            setStatus('ERROR');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-8 border-2 border-indigo-100 dark:border-indigo-900 shadow-xl rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 border-b border-indigo-100 dark:border-indigo-900">
                <h3 className="flex items-center gap-2 text-xl font-bold text-indigo-700 dark:text-indigo-400">
                    <Search className="w-5 h-5" />
                    Public Payment Tracker
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Verify if your Stamp Duty or Sale Price payment is recorded on the Blockchain.
                </p>
            </div>

            <div className="p-6 space-y-4">
                <div className="flex space-x-2">
                    <input
                        placeholder="Enter UTR / Transaction Ref No."
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <button
                        onClick={handleCheck}
                        disabled={status === 'LOADING'}
                        className="h-10 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        {status === 'LOADING' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                    </button>
                </div>

                {status === 'SUCCESS' && paymentData && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-2 mb-3 text-green-700 dark:text-green-400 font-semibold">
                            <CheckCircle className="w-5 h-5" />
                            Payment Verified
                        </div>
                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground text-slate-500">Amount:</span>
                                <span className="font-mono font-bold">₹{paymentData.amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-slate-500">Type:</span>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-indigo-600 text-white shadow hover:bg-indigo-700">
                                    {paymentData.type}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground text-slate-500">Date:</span>
                                <span>{new Date(paymentData.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground text-slate-500">Payer:</span>
                                <span className="font-mono text-xs">{paymentData.payerId}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                <span className="text-muted-foreground text-slate-500">Parcel:</span>
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{paymentData.ulpin}</span>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400 animate-in fade-in slide-in-from-top-4">
                        <XCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">{errorMsg}</span>
                    </div>
                )}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs text-slate-500">
                Blockchain Record is Immutable & Publicly Verifiable
            </div>
        </div>
    );
}
