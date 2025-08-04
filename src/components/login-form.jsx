"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "./ui/input-otp";

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [maskedMobile, setMaskedMobile] = useState("");
  const [resendTimer, setResendTimer] = useState(60); // 1 minute countdown
  const [otpError, setOtpError] = useState("");
  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);

  const { loginStepOne, loginStepTwo, resendOtp } = useAuth();

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleStepOne = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginStepOne(username, password);
      setMaskedMobile(data.mobile);
      setStep(2);
      setResendTimer(60); // Reset to 1 minute
      setResendAttempts(0); // Reset attempts when starting new login
      setResendDisabled(false);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStepTwo = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    setOtpLoading(true);
    try {
      const data = await loginStepTwo(username, otp);
      toast.success(data.message);
    } catch (error) {
      setOtpError(error.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || resendDisabled) return;

    setOtpLoading(true);
    try {
      const data = await resendOtp(username);
      if (data.success) {
        setResendAttempts(prev => prev + 1);
        setResendTimer(60); // Reset to 1 minute
        toast.success("New OTP sent successfully");

        // Disable resend if reached max attempts (3)
        if (resendAttempts >= 2) {
          setResendDisabled(true);
          toast.warning("You've reached the maximum OTP resend attempts. Please wait 10 minutes.");
        }
      } else {
        toast.error(data.message);
        if (data.message.includes("3 times every 10 minutes")) {
          setResendDisabled(true);
        }
      }
    } catch (error) {
      toast.error(error.message || "Failed to resend OTP");
      if (error.message.includes("3 times every 10 minutes")) {
        setResendDisabled(true);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleBackToStepOne = () => {
    setStep(1);
    setOtp("");
    setOtpError("");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            onSubmit={step === 1 ? handleStepOne : handleStepTwo}
            className="p-6 md:p-8 w-full"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">
                  {step === 1 ? "Welcome back" : "Verify OTP"}
                </h1>
                <p className="text-muted-foreground text-balance">
                  {step === 1
                    ? "Login to your Super Admin account"
                    : `Enter the OTP sent to ${maskedMobile}`}
                </p>
              </div>

              {step === 1 ? (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="superadmin"
                      required
                      autoComplete="username"
                    />
                  </div>

                  <div className="grid gap-3 relative">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="otp">Enter 6-digit OTP</Label>

                    <InputOTP
                      id="otp"
                      maxLength={6}
                      value={otp}
                      onChange={(value) => {
                        setOtp(value);
                        if (value.length === 6) setOtpError("");
                      }}
                      autoFocus
                      autoComplete="one-time-code"
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

                    {otpError && (
                      <p className="text-sm text-destructive">{otpError}</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm mt-3">
                    <button
                      type="button"
                      onClick={handleBackToStepOne}
                      className="flex items-center text-muted-foreground hover:text-primary"
                    >
                      <ArrowLeft size={16} className="mr-1" />
                      Back to login
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || resendDisabled || otpLoading}
                      className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                    >
                      {resendDisabled
                        ? "Try again later"
                        : resendTimer > 0
                          ? `Resend OTP in ${resendTimer}s`
                          : "Resend OTP"}
                    </button>
                  </div>
                </>

              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otpLoading}
              >
                {loading
                  ? "Verifying..."
                  : otpLoading
                    ? "Verifying OTP..."
                    : step === 1
                      ? "Continue"
                      : "Verify OTP"}
              </Button>
            </div>
          </form>

          <div className="bg-muted relative hidden md:block">
            <img
              src="https://www.sahlapp.com/resizeImg.php?w=600&src=https://www.sahlapp.com/admin305/img/dashboard.png"
              alt="Login illustration"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}