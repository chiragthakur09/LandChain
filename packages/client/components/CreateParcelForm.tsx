"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { LandAPI } from '@/lib/api';

export function CreateParcelForm() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        ulpin: '',
        ownerId: '',
        geoJson: '',
        docHash: 'Qm...' // Default placeholder
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await LandAPI.createParcel(formData);
            toast({
                title: "Success",
                description: `Parcel ${formData.ulpin} created successfully.`,
            });
            // Reset form or redirect
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create parcel.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Register New Land Parcel</CardTitle>
                <CardDescription>Enter the details to create a Bhu-Aadhaar record.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ulpin">ULPIN (14-Char Alphanumeric)</Label>
                        <Input
                            id="ulpin"
                            name="ulpin"
                            placeholder="MH12PUNE010001"
                            value={formData.ulpin}
                            onChange={handleChange}
                            required
                            minLength={14}
                            maxLength={14}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ownerId">Owner ID</Label>
                        <Input
                            id="ownerId"
                            name="ownerId"
                            placeholder="Aadhaar / User ID"
                            value={formData.ownerId}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="geoJson">GeoJSON Data</Label>
                        <Textarea
                            id="geoJson"
                            name="geoJson"
                            placeholder='{"type": "Polygon", ...}'
                            value={formData.geoJson}
                            onChange={handleChange}
                            required
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="docHash">IPFS Document Hash</Label>
                        <Input
                            id="docHash"
                            name="docHash"
                            placeholder="Qm..."
                            value={formData.docHash}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Register Parcel"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
