"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { LandAPI } from '@/lib/api';

export function TransferParcelForm() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        ulpin: '',
        fromOwner: '',
        toOwner: '',
        share: 100,
        price: 0,
        paymentId: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await LandAPI.transferParcel({
                ...formData,
                share: Number(formData.share),
                price: Number(formData.price)
            });
            toast({
                title: "Transfer Initiated",
                description: `Ownership transfer for ${formData.ulpin} submitted.`,
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Transfer Failed",
                description: error.response?.data?.message || "Could not transfer parcel.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-lg mx-auto mt-10">
            <CardHeader>
                <CardTitle>Transfer Land Ownership</CardTitle>
                <CardDescription>Executes a legal transfer on the Blockchain.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ulpin">ULPIN (Parcel ID)</Label>
                        <Input id="ulpin" name="ulpin" onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fromOwner">Seller ID</Label>
                            <Input id="fromOwner" name="fromOwner" onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="toOwner">Buyer ID</Label>
                            <Input id="toOwner" name="toOwner" onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="share">Share %</Label>
                            <Input type="number" id="share" name="share" value={formData.share} onChange={handleChange} required min={1} max={100} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (INR)</Label>
                            <Input type="number" id="price" name="price" onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentId">Payment Reference (UTR)</Label>
                        <Input id="paymentId" name="paymentId" onChange={handleChange} required />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                        {isLoading ? "Processing..." : "Transfer Ownership"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
