"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { RotateCcw, CheckCircle, Clock } from "lucide-react"

interface PendingMutation {
    ulpin: string;
    surveyNo: string;
    status: string;
    mutationRequestTimestamp: number;
    title: {
        owners: { ownerId: string; sharePercentage: number }[];
    };
    metadata?: {
        stampDuty?: { amount: number; paidBy: string; date: number };
    };
}

export function RegistrarDashboard() {
    const [mutations, setMutations] = useState<PendingMutation[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchMutations = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/land/pending');
            const data = await res.json();
            setMutations(data);
        } catch (err) {
            console.error(err);
            toast({
                title: "Error",
                description: "Failed to fetch pending mutations",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMutations();
    }, []);

    const handleApprove = async (ulpin: string) => {
        try {
            const res = await fetch('http://localhost:3001/land/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ulpin })
            });

            if (res.ok) {
                toast({
                    title: "Success",
                    description: `Mutation approved for ${ulpin}`,
                });
                fetchMutations(); // Refresh
            } else {
                throw new Error('Failed to approve');
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "Approval failed. Check console.",
                variant: "destructive"
            });
        }
    };

    const calculateTimeRemaining = (timestamp: number) => {
        const SCRUTINY_PERIOD = 30 * 24 * 60 * 60 * 1000;
        const elapsed = Date.now() - timestamp;
        const remaining = SCRUTINY_PERIOD - elapsed;

        if (remaining <= 0) return "Ready for Approval";

        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        return `${days} Days Remaining`;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Registrar Dashboard</CardTitle>
                            <CardDescription>Review pending mutations and verify stamp duty.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchMutations} disabled={loading}>
                            <RotateCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ULPIN</TableHead>
                                <TableHead>New Owner</TableHead>
                                <TableHead>Stamp Duty</TableHead>
                                <TableHead>Scrutiny Timer</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mutations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No pending mutations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                mutations.map((m) => {
                                    const timeLabel = calculateTimeRemaining(m.mutationRequestTimestamp);
                                    const isReady = timeLabel === "Ready for Approval";

                                    return (
                                        <TableRow key={m.ulpin}>
                                            <TableCell className="font-mono">{m.ulpin}</TableCell>
                                            <TableCell>{m.title.owners[0].ownerId}</TableCell>
                                            <TableCell>
                                                {m.metadata?.stampDuty ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-green-600">₹{m.metadata.stampDuty.amount.toLocaleString()}</span>
                                                        <span className="text-xs text-muted-foreground">Paid by {m.metadata.stampDuty.paidBy}</span>
                                                    </div>
                                                ) : (
                                                    <Badge variant="destructive">Missing</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-orange-500" />
                                                    <span className={isReady ? "text-green-600 font-bold" : "text-amber-600"}>
                                                        {timeLabel}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(m.ulpin)}
                                                    disabled={!isReady && !m.metadata?.stampDuty} // Force wait or override? Let's obey rules.
                                                    title={!isReady ? "Scrutiny Period Active" : "Approve Mutation"}
                                                >
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Approve
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
