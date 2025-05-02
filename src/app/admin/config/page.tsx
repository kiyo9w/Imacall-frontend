'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle, Cpu, Settings } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';

export default function AdminConfigPage() {
    const { toast } = useToast();
    const [availableProviders, setAvailableProviders] = useState<string[]>([]);
    const [activeProvider, setActiveProvider] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);

    // Fetch AI Provider Config
    const fetchConfig = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [availableRes, activeRes] = await Promise.all([
                apiClient.get<string[]>('/config/ai/providers/available'),
                apiClient.get<string>('/config/ai/providers/active'),
            ]);
            setAvailableProviders(availableRes.data);
            // The active provider response might be just the string name directly
            setActiveProvider(activeRes.data);
        } catch (err) {
            console.error("Error fetching AI provider config:", err);
            let errorMsg = "Failed to load AI provider settings.";
            if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
                errorMsg = "Unauthorized access. You may not have permission.";
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // Handle Provider Change
    const handleProviderChange = async (newProvider: string) => {
        if (newProvider === activeProvider) return;
        setUpdating(true);
        setError(null);
        try {
            const response = await apiClient.put<{ message: string }>(`/config/ai/providers/active?provider_name=${encodeURIComponent(newProvider)}`);
            setActiveProvider(newProvider); // Update local state on success
            toast({
                title: "AI Provider Updated",
                description: response.data.message || `Active AI provider set to '${newProvider}'.`,
                action: <CheckCircle className="text-green-500"/>
            });
        } catch (err) {
            console.error("Error setting active AI provider:", err);
            let errorMsg = "Failed to update AI provider.";
             if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 400) {
                     errorMsg = err.response.data?.detail || `Provider '${newProvider}' is not available or failed to activate. Ensure API keys are set.`;
                 } else if (err.response.status === 401 || err.response.status === 403) {
                    errorMsg = "Unauthorized to change AI provider.";
                }
             }
            setError(errorMsg);
            toast({ title: "Update Failed", description: errorMsg, variant: "destructive" });
        } finally {
            setUpdating(false);
        }
    };

    const renderSkeleton = () => (
         <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-muted" />
                <Skeleton className="h-10 w-full md:w-[250px] bg-muted" />
            </div>
             <Skeleton className="h-4 w-48 bg-muted" />
        </div>
    );

    return (
        <Card className="shadow-lg border border-border/40 rounded-xl overflow-hidden animate-in fade-in duration-500">
            <CardHeader className="bg-muted/30 border-b border-border/40">
                <CardTitle className="text-2xl flex items-center gap-3">
                    <Cpu className="h-6 w-6 text-primary" /> AI Configuration
                </CardTitle>
                <CardDescription>Manage the active AI model provider for the application.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                         <Button onClick={fetchConfig} variant="secondary" size="sm" className="mt-4">Retry</Button>
                    </Alert>
                )}

                {loading ? (
                    renderSkeleton()
                 ) : (
                     <div className="space-y-4 max-w-md">
                         <div className="space-y-2">
                             <Label htmlFor="aiProvider" className="text-base">Active AI Provider</Label>
                             <Select
                                 value={activeProvider || ''}
                                 onValueChange={handleProviderChange}
                                 disabled={loading || updating || availableProviders.length === 0}
                             >
                                 <SelectTrigger id="aiProvider" className="w-full md:w-[300px] text-base py-2.5">
                                     <SelectValue placeholder="Select Provider" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     {availableProviders.length > 0 ? (
                                         availableProviders.map(provider => (
                                             <SelectItem key={provider} value={provider} className="text-base">
                                                 {/* Capitalize provider name */}
                                                 {provider.charAt(0).toUpperCase() + provider.slice(1)}
                                             </SelectItem>
                                         ))
                                     ) : (
                                         <SelectItem value="none" disabled>No providers available</SelectItem>
                                     )}
                                 </SelectContent>
                             </Select>
                              {updating && <Loader2 className="inline-block ml-3 h-5 w-5 animate-spin text-muted-foreground" />}
                         </div>
                         <p className="text-sm text-muted-foreground pt-1">
                             Available providers: {availableProviders.length > 0 ? availableProviders.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ') : 'None'}
                         </p>
                         <p className="text-xs text-muted-foreground">
                              Ensure the corresponding API keys are set in the backend environment for providers to be available. Changes take effect immediately.
                         </p>
                     </div>
                 )}
            </CardContent>
             {/* Optional Footer for save button if using a form approach */}
             {/* <CardFooter>
                 <Button disabled={loading || updating}>Save Changes</Button>
             </CardFooter> */}
        </Card>
    );
}

    