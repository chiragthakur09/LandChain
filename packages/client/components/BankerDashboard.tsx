"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Landmark, Lock, Unlock } from "lucide-react"

export function BankerDashboard() {
    const [ulpin, setUlpin] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleCreateMortgage = async () => {
        if (!ulpin || !amount) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/land/intimation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ulpin,
                    category: 'CHARGE',
                    type: 'MORTGAGE',
                    issuer: 'SBI_BANK_MOCK',
                    details: JSON.stringify({ amount, date: new Date().toISOString() })
                })
            });

            if (res.ok) {
                toast({ title: "Success", description: `Mortgage Created on ${ulpin}. Asset LOCKED.` });
            } else {
                throw new Error('Failed');
            }
        } catch (err) {
            toast({ title: "Error", description: "Operation failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleReleaseMortgage = async () => {
        if (!ulpin) return;
        setLoading(true);
        try {
            // NOTE: In real world, we would use unlockCharge. For demo simplicity using same flow.
            const res = await fetch('http://localhost:3001/land/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ulpin,
                    disputeId: 'CHG_MOCK_RELEASE', // Using dummy ID for mock
                    resolution: 'Loan Repaid'
                })
            });

            if (res.ok) {
                toast({ title: "Success", description: `Mortgage Released for ${ulpin}. Asset UNLOCKED.` });
            } else {
                throw new Error('Failed');
            }
        } catch (err) {
            toast({ title: "Error", description: "Operation failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Landmark className="h-6 w-6 text-blue-600" />
                        Banker Portal
                    </CardTitle>
                    <CardDescription>Manage Property Mortgages and Liens.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="ulpin">Target ULPIN</Label>
                        <Input id="ulpin" placeholder="Enter ULPIN (e.g. MH12PARCEL001)" value={ulpin} onChange={(e) => setUlpin(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Loan Amount (₹)</Label>
                        <Input id="amount" type="number" placeholder="5000000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleCreateMortgage} disabled={loading}>
                            <Lock className="mr-2 h-4 w-4" />
                            Create Mortgage (Lock)
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleReleaseMortgage} disabled={loading}>
                            <Unlock className="mr-2 h-4 w-4" />
                            Release Mortgage (Unlock)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
