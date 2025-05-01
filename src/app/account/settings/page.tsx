'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import { doc, getDoc, setDoc, DocumentReference, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NotificationPreferences {
    newCharacterApproved: boolean;
    characterRejected: boolean;
    newReviewReceived: boolean; // V2 feature
    // Add more preferences as needed
}

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        newCharacterApproved: true,
        characterRejected: true,
        newReviewReceived: true, // Default V2 preference
    });
    const [loading, setLoading] = useState(true); // Loading state for fetching/saving
    const [saving, setSaving] = useState(false); // Specific state for save button
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Reference to the user's settings document
    const settingsDocRef = user ? doc(db, 'userSettings', user.uid) : null;

    // Fetch preferences on mount
    useEffect(() => {
        const fetchPreferences = async () => {
            if (!settingsDocRef) return;
            setLoading(true);
            setError(null);
            try {
                const docSnap = await getDoc(settingsDocRef);
                if (docSnap.exists()) {
                    // Merge fetched data with defaults to handle potentially missing fields
                    const fetchedData = docSnap.data() as Partial<NotificationPreferences>;
                    setPreferences(prev => ({ ...prev, ...fetchedData }));
                } else {
                    // No settings found, use defaults (already set in state)
                    console.log("No notification settings found, using defaults.");
                }
            } catch (err) {
                console.error("Error fetching notification settings:", err);
                setError("Failed to load your notification settings.");
            } finally {
                setLoading(false);
                setHasChanges(false); // Reset changes state after loading
            }
        };

        if (user && !authLoading) {
            fetchPreferences();
        } else if (!authLoading) {
            setLoading(false); // Not logged in, stop loading
        }
    }, [user, authLoading, settingsDocRef]);

    const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSaveChanges = async () => {
        if (!settingsDocRef || !hasChanges) return;
        setSaving(true);
        setError(null);
        try {
            // Use setDoc with merge: true to create or update the document
            await setDoc(settingsDocRef, preferences, { merge: true });
            toast({
                title: "Settings Saved",
                description: "Your notification preferences have been updated.",
                action: <CheckCircle className="text-green-500"/>
            });
            setHasChanges(false); // Reset changes state
        } catch (err) {
            console.error("Error saving notification settings:", err);
            setError("Failed to save your notification settings.");
            toast({
                title: "Save Failed",
                description: "Could not save your settings. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };


     if (authLoading || loading) {
        return (
             <Card className="w-full max-w-lg mx-auto shadow-lg animate-pulse">
                <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-6 w-11 bg-muted rounded-full"></div>
                    </div>
                     <div className="flex items-center justify-between">
                        <div className="h-4 bg-muted rounded w-2/5"></div>
                         <div className="h-6 w-11 bg-muted rounded-full"></div>
                    </div>
                     <div className="flex items-center justify-between">
                         <div className="h-4 bg-muted rounded w-1/3"></div>
                         <div className="h-6 w-11 bg-muted rounded-full"></div>
                     </div>
                    <div className="h-10 bg-muted rounded w-full mt-4"></div>
                </CardContent>
            </Card>
        );
     }

     if (!user) {
         return <p>Please log in to manage your settings.</p>;
     }


    return (
        <Card className="w-full max-w-lg mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Bell className="h-6 w-6 text-primary"/> Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications from EchoVerse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                    <Label htmlFor="approve-notifications" className="font-medium">
                       Character Approved
                       <p className="text-sm text-muted-foreground font-normal">Notify me when my submitted character is approved.</p>
                    </Label>
                    <Switch
                        id="approve-notifications"
                        checked={preferences.newCharacterApproved}
                        onCheckedChange={(checked) => handlePreferenceChange('newCharacterApproved', checked)}
                        disabled={saving}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                     <Label htmlFor="reject-notifications" className="font-medium">
                       Character Rejected
                        <p className="text-sm text-muted-foreground font-normal">Notify me when my submitted character is rejected.</p>
                     </Label>
                    <Switch
                        id="reject-notifications"
                        checked={preferences.characterRejected}
                        onCheckedChange={(checked) => handlePreferenceChange('characterRejected', checked)}
                        disabled={saving}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                    <Label htmlFor="review-notifications" className="font-medium">
                       New Review Received (V2)
                       <p className="text-sm text-muted-foreground font-normal">Notify me when someone reviews my public character.</p>
                    </Label>
                    <Switch
                        id="review-notifications"
                        checked={preferences.newReviewReceived}
                        onCheckedChange={(checked) => handlePreferenceChange('newReviewReceived', checked)}
                        disabled={saving}
                    />
                </div>

                 {/* Add more settings here as needed */}

                <Button
                    onClick={handleSaveChanges}
                    disabled={saving || !hasChanges}
                    className="w-full"
                 >
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                </Button>
            </CardContent>
        </Card>
    );
}
