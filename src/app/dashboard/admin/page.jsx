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
    CardDescription,
    CardFooter,
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
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, UserPlus, Loader2, Search, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";


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
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [showPassword, setShowPassword] = useState(false);
    const [otpResendCooldown, setOtpResendCooldown] = useState(0);
    const [renewDialogOpen, setRenewDialogOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [newExpiryDate, setNewExpiryDate] = useState(null);
    const [renewing, setRenewing] = useState(false);

    const [newAdmin, setNewAdmin] = useState({
        otp: "",
        password: "",
        confirmPassword: "",
        officerName: "",
        contactNumber: "",
        officeName: "",
        district: "",
        block: "",
        expiryDate: null,
        otpSent: false
    });

    useEffect(() => setHydrated(true), []);

    useEffect(() => {
        const firstSlot = document.querySelector('[inputmode="numeric"]');
        if (firstSlot) firstSlot.focus();
    }, []);


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
            console.log(res)
            setAdmins(res.admins || []);
        } catch (err) {
            toast.error(err.message || "Failed to fetch admins");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        // Validate required fields before sending OTP
        if (!newAdmin.officerName || !newAdmin.password || !newAdmin.confirmPassword ||
            !newAdmin.contactNumber || !newAdmin.district || !newAdmin.block) {
            toast.error("Please fill in all required fields.");
            return;
        }

        if (newAdmin.password !== newAdmin.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            setCreating(true);
            const user = JSON.parse(localStorage.getItem("user"));
            const mobile = user?.mobile;

            if (!mobile) {
                toast.error("Superadmin mobile number not found.");
                return;
            }

            const res = await api({
                endpoint: "/api/superadmin/create-admin-step-one",
                method: "POST",
                data: {
                    mobile,
                    officerName: newAdmin.officerName,
                    contactNumber: newAdmin.contactNumber,
                    district: newAdmin.district,
                    block: newAdmin.block,
                    officeName: newAdmin.officeName,
                    expiryDate: newAdmin.expiryDate
                },
            });

            if (res?.success) {
                toast.success("OTP sent to your registered mobile.");
                setNewAdmin(prev => ({ ...prev, otpSent: true }));
                // Start cooldown timer
                setOtpResendCooldown(60);
                const timer = setInterval(() => {
                    setOtpResendCooldown((prev) => {
                        if (prev <= 1) clearInterval(timer);
                        return prev - 1;
                    });
                }, 1000);
            } else {
                toast.error(res.message || "Failed to send OTP.");
            }
        } catch (err) {
            toast.error(err.message || "Error sending OTP.");
        } finally {
            setCreating(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setCreating(true);
            const user = JSON.parse(localStorage.getItem("user"));
            const mobile = user?.mobile;

            if (!mobile) {
                toast.error("Superadmin mobile number not found.");
                return;
            }

            const res = await api({
                endpoint: "/api/superadmin/create-admin-step-one",
                method: "POST",
                data: { mobile },
            });

            if (res?.success) {
                toast.success("OTP resent successfully.");
                setOtpResendCooldown(60);
                const timer = setInterval(() => {
                    setOtpResendCooldown((prev) => {
                        if (prev <= 1) clearInterval(timer);
                        return prev - 1;
                    });
                }, 1000);
            } else {
                toast.error(res.message || "Failed to resend OTP.");
            }
        } catch (err) {
            toast.error(err.message || "Error resending OTP.");
        } finally {
            setCreating(false);
        }
    };

    const handleOtpChange = () => {
        const value = e.target.value;

        // Only allow digits
        if (value && !/^\d+$/.test(value)) return;

        // Update OTP value
        const otp = newAdmin.otp.split('');
        otp[index] = value;
        setNewAdmin({ ...newAdmin, otp: otp.join('') });

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleCreateAdminWithOtp = async () => {
        const {
            otp,
            password,
            confirmPassword,
            officerName,
            officeName,
            contactNumber,
            district,
            block,
            expiryDate,
        } = newAdmin;

        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            setCreating(true);
            const user = JSON.parse(localStorage.getItem("user"));
            const mobile = user?.mobile;

            const res = await api({
                endpoint: "/api/superadmin/create-admin-step-two",
                method: "POST",
                data: {
                    mobile,
                    otp,
                    password,
                    officerName,
                    officeName,
                    contactNumber,
                    district,
                    block,
                    expiryDate,
                },
            });

            if (res?.success) {
                toast.success("Admin created successfully.");
                setDialogOpen(false);
                setNewAdmin({
                    otp: "",
                    password: "",
                    confirmPassword: "",
                    officerName: "",
                    officeName: "",
                    contactNumber: "",
                    district: "",
                    block: "",
                    expiryDate: null,
                    otpSent: false,
                });
                fetchAdmins();
            } else {
                toast.error(res.message || "Failed to create admin.");
            }
        } catch (err) {
            toast.error(err.message || "Error creating admin.");
        } finally {
            setCreating(false);
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

            toast.success(
                desiredStatus
                    ? "Admin account activated successfully"
                    : "Admin account deactivated"
            );
        } catch (err) {
            toast.error(err.message || "Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleOpenRenewDialog = (admin) => {
        setSelectedAdmin(admin);
        setNewExpiryDate(null);
        setRenewDialogOpen(true);
    };

    const handleRenewExpiry = async () => {
        if (!selectedAdmin || !newExpiryDate) {
            toast.error("Please select a valid future date.");
            return;
        }

        if (newExpiryDate <= new Date()) {
            toast.error("Expiry date must be in the future.");
            return;
        }

        try {
            setRenewing(true);
            const res = await api({
                endpoint: "/api/superadmin/update-admin-expiry",
                method: "PATCH",
                data: {
                    adminId: selectedAdmin._id,
                    expiryDate: newExpiryDate
                }
            });

            if (res?.success) {
                toast.success("Expiry date updated successfully.");
                setAdmins((prev) =>
                    prev.map((admin) =>
                        admin._id === selectedAdmin._id
                            ? { ...admin, expiryDate: newExpiryDate }
                            : admin
                    )
                );
                setRenewDialogOpen(false);
            } else {
                toast.error(res?.message || "Failed to update expiry date.");
            }
        } catch (err) {
            toast.error(err.message || "Error updating expiry date.");
        } finally {
            setRenewing(false);
        }
    };

    const filteredAdmins = admins.filter((admin) =>
        admin.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.contactNumber.includes(searchTerm) ||
        admin.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.block.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!hydrated || !auth?.token) return null;

    const getStatusBadge = (admin) => {
        const now = new Date();
        const isExpired = admin.expiryDate && new Date(admin.expiryDate) < now;

        if (isExpired) {
            return {
                label: "Expired",
                color: "bg-red-100 text-red-800",
                dot: "bg-red-500",
            };
        }

        return admin.isActive
            ? { label: "Active", color: "bg-green-100 text-green-800", dot: "bg-green-500" }
            : { label: "Inactive", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    };


    return (
        <div className="p-6 space-y-6 w-full mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage all administrator accounts and permissions
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search admins..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
                    >
                        {viewMode === "table" ? "Grid View" : "Table View"}
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                <span>New Admin</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            {!newAdmin.otpSent ? (
                                // Admin Details Form
                                <>
                                    <DialogHeader>
                                        <DialogTitle>Create New Admin</DialogTitle>
                                        <DialogDescription>
                                            Fill in the details to create a new administrator account.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="officerName" className="text-right">
                                                Name
                                            </Label>
                                            <Input
                                                id="officerName"
                                                disabled={creating}
                                                placeholder="Name"
                                                value={newAdmin.officerName}
                                                onChange={(e) =>
                                                    setNewAdmin({ ...newAdmin, officerName: e.target.value })
                                                }
                                                className="col-span-3"
                                            />
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="password" className="text-right">
                                                Password
                                            </Label>
                                            <div className="relative col-span-3">
                                                <Input
                                                    id="password"
                                                    disabled={creating}
                                                    placeholder="Password"
                                                    type={showPassword ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    value={newAdmin.password}
                                                    onChange={(e) =>
                                                        setNewAdmin({ ...newAdmin, password: e.target.value })
                                                    }
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="confirmPassword" className="text-right">
                                                Confirm Password
                                            </Label>
                                            <div className="relative col-span-3">
                                                <Input
                                                    id="confirmPassword"
                                                    disabled={creating}
                                                    placeholder="Confirm Password"
                                                    type={showPassword ? "text" : "password"}
                                                    autoComplete="new-password"
                                                    value={newAdmin.confirmPassword}
                                                    onChange={(e) =>
                                                        setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })
                                                    }
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="contactNumber" className="text-right">
                                                Contact Number
                                            </Label>
                                            <Input
                                                id="contactNumber"
                                                disabled={creating}
                                                placeholder="Contact Number"
                                                value={newAdmin.contactNumber}
                                                onChange={(e) =>
                                                    setNewAdmin({ ...newAdmin, contactNumber: e.target.value })
                                                }
                                                className="col-span-3"
                                            />
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="district" className="text-right">
                                                District
                                            </Label>
                                            <Input
                                                id="district"
                                                disabled={creating}
                                                placeholder="District"
                                                value={newAdmin.district}
                                                onChange={(e) =>
                                                    setNewAdmin({ ...newAdmin, district: e.target.value })
                                                }
                                                className="col-span-3"
                                            />
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="block" className="text-right">
                                                Block
                                            </Label>
                                            <Input
                                                id="block"
                                                disabled={creating}
                                                placeholder="Block"
                                                value={newAdmin.block}
                                                onChange={(e) =>
                                                    setNewAdmin({ ...newAdmin, block: e.target.value })
                                                }
                                                className="col-span-3"
                                            />
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="officeName" className="text-right">
                                                Office Name
                                            </Label>
                                            <Input
                                                id="officeName"
                                                disabled={creating}
                                                placeholder="Office Name"
                                                value={newAdmin.officeName}
                                                onChange={(e) =>
                                                    setNewAdmin({ ...newAdmin, officeName: e.target.value })
                                                }
                                                className="col-span-3"
                                            />
                                        </div>

                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="expiryDate" className="text-right">
                                                Expiry Date
                                            </Label>
                                            <div className="col-span-3">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={`w-full justify-start text-left font-normal ${!newAdmin.expiryDate ? "text-muted-foreground" : ""
                                                                }`}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {newAdmin.expiryDate ? format(newAdmin.expiryDate, "PPP") : "Pick a date"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={newAdmin.expiryDate}
                                                            onSelect={(date) => setNewAdmin({ ...newAdmin, expiryDate: date })}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>


                                    <DialogFooter>
                                        <Button onClick={handleSendOtp} disabled={creating}>
                                            Continue to Verification
                                        </Button>
                                    </DialogFooter>
                                </>
                            ) : (
                                // OTP Verification Section
                                <>
                                    <DialogHeader>
                                        <DialogTitle>Verify Admin Creation</DialogTitle>
                                        <DialogDescription>
                                            We've sent a 6-digit OTP to your registered mobile number. Please enter it below to verify.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4 py-4">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <InputOTP
                                                maxLength={6}
                                                value={newAdmin.otp}
                                                onChange={(value) => setNewAdmin({ ...newAdmin, otp: value })}
                                            >
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />

                                                    <InputOTPSeparator />

                                                    <InputOTPSlot index={3} />
                                                    <InputOTPSlot index={4} />
                                                    <InputOTPSlot index={5} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                            <div className="text-sm text-muted-foreground mt-4 text-center">
                                                Didn't receive OTP?{' '}
                                                <button
                                                    type="button"
                                                    onClick={handleResendOtp}
                                                    className="text-primary hover:underline"
                                                    disabled={otpResendCooldown > 0}
                                                >
                                                    Resend {otpResendCooldown > 0 ? `(${otpResendCooldown}s)` : ''}
                                                </button>
                                            </div>

                                        </div>
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setNewAdmin({ ...newAdmin, otpSent: false, otp: "" })}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleCreateAdminWithOtp}
                                            disabled={creating || newAdmin.otp.length !== 6}
                                        >
                                            {creating ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Verify & Create Admin'
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                    <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Renew Admin Expiry</DialogTitle>
                                <DialogDescription>
                                    Select a new expiry date for{" "}
                                    <strong>{selectedAdmin?.officerName}</strong>.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`w-full justify-start text-left font-normal ${!newExpiryDate ? "text-muted-foreground" : ""
                                                }`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newExpiryDate
                                                ? format(newExpiryDate, "PPP")
                                                : "Pick a new expiry date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={newExpiryDate}
                                            onSelect={setNewExpiryDate}
                                            disabled={(date) => date <= new Date()}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleRenewExpiry} disabled={renewing || !newExpiryDate}>
                                    {renewing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                                        </>
                                    ) : (
                                        "Update Expiry"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>

            <Separator className="my-4" />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Admins
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{admins.length}</div>
                        <p className="text-xs text-muted-foreground">
                            All administrator accounts
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Admins
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {admins.filter((a) => a.isActive).length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Currently active accounts
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Inactive Admins
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {admins.filter((a) => !a.isActive).length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Currently disabled accounts
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Recent Activity
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {admins.length > 0
                                ? format(new Date(admins[0].createdAt), "MMM d")
                                : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Last admin {admins.length > 0 ? "created" : "activity"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Admin List */}
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : admins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <UserPlus className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium text-muted-foreground">
                        No admin accounts found
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Create your first admin account to get started
                    </p>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Admin
                    </Button>
                </div>
            ) : viewMode === "table" ? (
                <Card className=" p-0 overflow-hidden">
                    <Table className={" "}>
                        <TableHeader className="bg-gray-50/50 sticky top-0">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[220px] pl-6">Admin</TableHead>
                                <TableHead className="w-[140px]">Contact</TableHead>
                                <TableHead className="w-[200px]">Location</TableHead>
                                <TableHead className="w-[160px]">Registration Code</TableHead>
                                <TableHead className="w-[120px]">Expiry Date</TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                                <TableHead className="w-[160px] pr-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100">
                            {filteredAdmins.map((admin) => (
                                <TableRow key={admin._id} className="hover:bg-gray-50/50">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border">
                                                <AvatarFallback className="bg-blue-50 text-blue-600 font-medium">
                                                    {admin.officerName.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-gray-900 capitalize">
                                                    {admin.officerName}
                                                </p>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {admin.officeName}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-4 w-4 text-gray-400"
                                            >
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                            </svg>
                                            <span className="font-medium">{admin.contactNumber}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{admin.district}</span>
                                            <span className="text-sm text-gray-500">
                                                Block: {admin.block}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="font-mono text-sm px-2 py-1 border-gray-200"
                                        >
                                            {admin.registrationCode}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {admin.expiryDate ? (
                                            <div className="flex flex-col justify-center items-center">
                                                <span className="text-sm font-medium">
                                                    {format(new Date(admin.expiryDate), "MMM d, yyyy")}
                                                </span>
                                                {/* <span className="text-xs text-gray-500">
                                                    {format(new Date(admin.expiryDate), "h:mm a")}
                                                </span> */}
                                                <Button
                                                    size="sm"
                                                    className={`w-full mt-1 rounded-md text-white transition-colors ${new Date(admin.expiryDate) < new Date()
                                                        ? "bg-red-500 hover:bg-red-600"
                                                        : "bg-primary hover:bg-primary/80"
                                                        }`}
                                                    onClick={() => handleOpenRenewDialog(admin)}
                                                >
                                                    Renew
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500 italic">No Expiry</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {(() => {
                                            const status = getStatusBadge(admin);
                                            return (
                                                <Badge variant="outline" className={`flex items-center gap-1.5 ${status.color}`}>
                                                    <span className={`h-2 w-2 rounded-full ${status.dot}`}></span>
                                                    {status.label}
                                                </Badge>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell className="pr-6">
                                        <div className="flex justify-end items-center gap-2">
                                            <Switch
                                                checked={admin.isActive}
                                                onCheckedChange={(checked) =>
                                                    handleToggleStatus(admin._id, checked)
                                                }
                                                disabled={updatingId === admin._id}
                                                className={`${admin.isActive ? "bg-green-500" : "bg-gray-300"
                                                    } ${updatingId === admin._id ? "opacity-50" : ""}`}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAdmins.map((admin) => (
                        <Card key={admin._id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <div className="flex items-center space-x-3">
                                    <Avatar>
                                        <AvatarFallback>
                                            {admin.officerName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{admin.officerName}</CardTitle>
                                        <CardDescription className="text-sm">{admin.contactNumber}</CardDescription>
                                        <p className="text-sm text-muted-foreground capitalize">{admin.officeName}</p>
                                    </div>
                                </div>

                                <Switch
                                    checked={admin.isActive}
                                    onCheckedChange={(checked) => handleToggleStatus(admin._id, checked)}
                                    disabled={updatingId === admin._id}
                                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                                />
                            </CardHeader>

                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">District</p>
                                        <p className="font-medium">{admin.district}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Block</p>
                                        <p className="font-medium">{admin.block}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Expiry Date</p>
                                        <p
                                            className={`font-medium ${admin.expiryDate && new Date(admin.expiryDate) < new Date()
                                                ? "text-red-600"
                                                : ""
                                                }`}
                                        >
                                            {admin.expiryDate
                                                ? format(new Date(admin.expiryDate), "MMM d, yyyy")
                                                : "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        {(() => {
                                            const status = getStatusBadge(admin);
                                            return (
                                                <Badge variant="outline" className={`${status.color}`}>
                                                    {status.label}
                                                </Badge>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col items-start space-y-2">
                                <div className="text-sm text-muted-foreground">Registration Code

                                    <Badge variant="outline" className={" ml-3"}>{admin.registrationCode}</Badge>
                                </div>

                                <div className="flex items-center justify-between w-full">
                                    <Button
                                        size="sm"
                                        className={`px-3 py-1 w-full text-white rounded-md transition-colors ${new Date(admin.expiryDate) < new Date()
                                            ? "bg-red-500 hover:bg-red-600"
                                            : "bg-primary hover:bg-primary/80"
                                            }`}
                                        onClick={() => handleOpenRenewDialog(admin)}
                                    >
                                        Renew
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>

                    ))}

                </div>
            )}
        </div>
    );
}