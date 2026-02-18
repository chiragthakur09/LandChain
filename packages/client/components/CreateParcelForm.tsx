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

    // Core Parcel Data
    const [ulpin, setUlpin] = useState('');
    const [geoJson, setGeoJson] = useState('');
    const [docHash, setDocHash] = useState('Qm...');

    // Multi-Owner State
    const [owners, setOwners] = useState([
        { ownerId: '', sharePercentage: 100, type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'CORPORATE' | 'GOVERNMENT' }
    ]);

    const handleOwnerChange = (index: number, field: string, value: any) => {
        const newOwners = [...owners];
        (newOwners[index] as any)[field] = value;
        setOwners(newOwners);
    };

    const addOwner = () => {
        setOwners([...owners, { ownerId: '', sharePercentage: 0, type: 'INDIVIDUAL' }]);
    };

    const removeOwner = (index: number) => {
        if (owners.length > 1) {
            const newOwners = owners.filter((_, i) => i !== index);
            setOwners(newOwners);
        }
    };

    const totalShare = owners.reduce((sum, o) => sum + Number(o.sharePercentage || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Float precision check
        if (Math.abs(totalShare - 100) > 0.1) {
            toast({
                title: "Validation Error",
                description: `Total Share Percentage must be 100%. Current: ${totalShare}%`,
                variant: "destructive"
            });
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                ulpin,
                owners: owners as any, // Cast to satisfy strict enum check
                geoJson,
                docHash
            };
            await LandAPI.createParcel(payload);
            toast({
                title: "Success",
                description: `Parcel ${ulpin} created successfully.`,
            });
            // Optional: Reset form
            setUlpin('');
            setOwners([{ ownerId: '', sharePercentage: 100, type: 'INDIVIDUAL' }]);
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
                <CardDescription>Enter details to create a Bhu-Aadhaar record with Co-Ownership support.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ulpin">ULPIN (14-Char Alphanumeric)</Label>
                        <Input
                            id="ulpin"
                            value={ulpin}
                            onChange={(e) => setUlpin(e.target.value)}
                            placeholder="MH12PUNE010001"
                            required
                            minLength={14}
                            maxLength={14}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Owners (Total Share: {totalShare}%)</Label>
                        {owners.map((owner, index) => (
                            <div key={index} className="flex gap-2 items-start mb-2 border p-2 rounded relative">
                                <div className="flex-1 space-y-2">
                                    <Input
                                        placeholder="Owner ID (e.g. VLT-IND-...)"
                                        value={owner.ownerId}
                                        onChange={(e) => handleOwnerChange(index, 'ownerId', e.target.value)}
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                type="number"
                                                placeholder="Share %"
                                                value={owner.sharePercentage}
                                                onChange={(e) => handleOwnerChange(index, 'sharePercentage', Number(e.target.value))}
                                                required
                                                min="0"
                                                max="100"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={owner.type}
                                                onChange={(e) => handleOwnerChange(index, 'type', e.target.value)}
                                            >
                                                <option value="INDIVIDUAL">Individual</option>
                                                <option value="CORPORATE">Corporate</option>
                                                <option value="GOVERNMENT">Govt</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                {owners.length > 1 && (
                                    <Button type="button" variant="destructive" size="sm" onClick={() => removeOwner(index)} className="h-full px-2">X</Button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addOwner} className="w-full">+ Add Co-Owner</Button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="geoJson">GeoJSON Data</Label>
                        <Textarea
                            id="geoJson"
                            value={geoJson}
                            onChange={(e) => setGeoJson(e.target.value)}
                            placeholder='{"type": "Polygon", ...}'
                            required
                            className="font-mono text-sm"
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
