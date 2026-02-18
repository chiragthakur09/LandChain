"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, ShieldCheck, Landmark, Gavel, FileText } from "lucide-react"
import Link from "next/link"

export function SwitchboardHub() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
            <Link href="/create-parcel" className="block">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-purple-600" /> Admin</CardTitle>
                        <CardDescription>Genesis & Land Creation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        Mint new land parcels into the system.
                    </CardContent>
                </Card>
            </Link>

            <Link href="/transfer-parcel" className="block">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" /> Citizen</CardTitle>
                        <CardDescription>Buy, Sell & Transfer</CardDescription>
                    </CardHeader>
                    <CardContent>
                        Initiate property transfers and view owned assets.
                    </CardContent>
                </Card>
            </Link>

            <Link href="/registrar" className="block">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-600" /> Registrar</CardTitle>
                        <CardDescription>Scrutiny & Approvals</CardDescription>
                    </CardHeader>
                    <CardContent>
                        Verify Stamp Duty and approve mutations.
                    </CardContent>
                </Card>
            </Link>

            <Link href="/banker" className="block">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-orange-600" /> Banker</CardTitle>
                        <CardDescription>Lending & CERSAI</CardDescription>
                    </CardHeader>
                    <CardContent>
                        Manage mortgages and liens (Charges).
                    </CardContent>
                </Card>
            </Link>

            <Link href="/judiciary" className="block">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Gavel className="h-5 w-5 text-red-800" /> Judiciary</CardTitle>
                        <CardDescription>Courts & Disputes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        Issue Stay Orders and manage litigation.
                    </CardContent>
                </Card>
            </Link>
        </div>
    );
}
