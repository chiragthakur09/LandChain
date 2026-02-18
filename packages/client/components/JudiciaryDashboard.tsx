"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Gavel, AlertOctagon, CheckCircle } from "lucide-react"

export function JudiciaryDashboard() {
    const [ulpin, setUlpin] = useState('');
    const [cnr, setCnr] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleIssueStayOrder = async () => {
        if (!ulpin || !cnr) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/land/intimation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ulpin,
                    category: 'DISPUTE',
                    type: 'LITIGATION',
                    issuer: 'HIGH_COURT_MOCK',
                    details: JSON.stringify({ cnr, reason, date: new Date().toISOString() })
                })
            });

            if (res.ok) {
                toast({ title: "Stay Order Issued", description: `Property ${ulpin} is now under LITIGATION.` });
            } else {
                throw new Error('Failed');
            }
        } catch (err) {
            toast({ title: "Error", description: "Operation failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleResolveDispute = async () => {
        if (!ulpin) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/land/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ulpin,
                    disputeId: 'DISPUTE_MOCK_REF',
                    resolution: 'Case Dismissed'
                })
            });

            if (res.ok) {
                toast({ title: "Dispute Resolved", description: `LITIGATION removed from ${ulpin}.` });
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
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gavel className="h-6 w-6 text-slate-800" />
                        Judiciary Portal
                    </CardTitle>
                    <CardDescription>Manage Legal Disputes and Stay Orders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="ulpin">Target ULPIN</Label>
                        <Input id="ulpin" placeholder="MH12..." value={ulpin} onChange={(e) => setUlpin(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cnr">CNR Number (Case ID)</Label>
                        <Input id="cnr" placeholder="MHA..." value={cnr} onChange={(e) => setCnr(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Reason / Order Details</Label>
                        <Textarea id="reason" placeholder="Injunction order details..." value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={handleIssueStayOrder} disabled={loading}>
                            <AlertOctagon className="mr-2 h-4 w-4" />
                            Issue Stay Order
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleResolveDispute} disabled={loading}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Resolve Dispute
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
