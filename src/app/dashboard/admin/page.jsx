"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminPage() {
    const { auth } = useAuth();
    const api = useApi();
    const router = useRouter();

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hydrated, setHydrated] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ username: "", password: "" });

    useEffect(() => setHydrated(true), []);

    useEffect(() => {
        if (!hydrated) return;
        if (!auth?.token) {
            router.replace("/");
            return;
        }
        fetchAdmins();
    }, [auth?.token, hydrated]);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const res = await api({
                endpoint: "/api/superadmin/adminlist",
                method: "GET",
            });
            setAdmins(res.admins || []);
        } catch (err) {
            toast.error(err.message || "Failed to fetch admins");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (adminId, desiredStatus) => {
        try {
            setUpdatingId(adminId);
            const res = await api({
                endpoint: "/api/superadmin/update-admin-status",
                method: "PATCH",
                data: {
                    adminId,
                    isActive: desiredStatus,
                },
            });

            setAdmins((prev) =>
                prev.map((admin) =>
                    admin._id === adminId
                        ? { ...admin, isActive: desiredStatus }
                        : admin
                )
            );

            toast.success("Admin status updated");
        } catch (err) {
            toast.error(err.message || "Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdmin.username || !newAdmin.password) {
            toast.error("Please fill in both username and password");
            return;
        }

        try {
            setCreating(true);

            const res = await api({
                endpoint: "/api/superadmin/create-admin",
                method: "POST",
                data: {
                    username: newAdmin.username,
                    password: newAdmin.password,
                },
            });


            if (res?.success) {
                toast.success("Admin created successfully");
                setAdmins((prev) => [res.admin, ...prev]);
                setNewAdmin({ username: "", password: "" });
                setDialogOpen(false); // ✅ Close the dialog
            } else {
                toast.error(res.message || "Failed to create admin");
            }
        } catch (err) {
            toast.error(err.message || "Error creating admin");
        } finally {
            setCreating(false);
        }
    };


    if (!hydrated || !auth?.token) return null;

    return (
        <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Admin Management</h1>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-white">Create Admin</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Create New Admin</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                disabled={creating}
                                placeholder="Username"
                                value={newAdmin.username}
                                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                            />
                            <Input
                                disabled={creating}
                                placeholder="Password"
                                type="password"
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                            />
                        </div>
                        <DialogFooter className="mt-4">
                            <Button
                                onClick={handleCreateAdmin}
                                disabled={creating}
                            >
                                {creating ? (
                                    <div className="flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Creating...
                                    </div>
                                ) : (
                                    "Create"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>


            <Separator />

            {/* Admin List */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                </div>
            ) : admins.length === 0 ? (
                <p className="text-muted-foreground">No admins found.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {admins.map((admin) => (
                        <Card key={admin._id} className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="capitalize">{admin.username}</span>
                                    <Switch
                                        checked={admin.isActive}
                                        onCheckedChange={(checked) =>
                                            handleToggleStatus(admin._id, checked)
                                        }
                                        disabled={updatingId === admin._id}
                                    />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>ID: {admin._id}</p>
                                <p>
                                    Created:{" "}
                                    {new Date(admin.createdAt).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                                <p>Status: {admin.isActive ? "Active" : "Inactive"}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
