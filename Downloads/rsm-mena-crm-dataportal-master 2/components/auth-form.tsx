"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  type: "login" | "signup";
  isAdmin?: boolean;
  showSignup?: boolean;
  variant?: "default" | "admin";
}

export function AuthForm({
  type,
  isAdmin = false,
  showSignup = false,
  variant = "default",
}: AuthFormProps) {
  const router = useRouter();
  const [formType, setFormType] = useState<"login" | "signup">(type);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const colors = {
    default: {
      primary: "#1D9EE3",
      gradient: "from-[#1D9EE3] to-[#60a5fa]",
      ring: "ring-[#1D9EE3]/20",
      hover: "hover:bg-[#1D9EE3]/90",
    },
    admin: {
      primary: "#0D9488",
      gradient: "from-[#0D9488] to-[#2DD4BF]",
      ring: "ring-[#0D9488]/20",
      hover: "hover:bg-[#0D9488]/90",
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // For user login (not admin), implement OTP flow
    if (!isAdmin && formType === "login" && !otpSent) {
      // Step 1: Send OTP
      setSendingOtp(true);
      try {
        const response = await fetch("/api/user/send-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send OTP");
        }

        setOtpSent(true);
        setSendingOtp(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send OTP");
        setSendingOtp(false);
      }
      return;
    }

    // Step 2: Verify OTP and complete login (for user) OR direct login (for admin)
    setLoading(true);

    try {
      const endpoint = isAdmin
        ? formType === "login"
          ? "/api/admin/login"
          : "/api/admin/signup"
        : "/api/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, ...(otpSent && { otp }) }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        // If OTP is required but not provided, reset to OTP step
        if (data.requiresOTP && !otpSent) {
          setOtpSent(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Authentication failed");
      }

      // Redirect based on user role
      console.log("Redirecting to dashboard...");
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setSendingOtp(true);
    setOtpSent(false);
    setOtp("");

    try {
      const response = await fetch("/api/user/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setSendingOtp(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
      setSendingOtp(false);
    }
  };

  const toggleFormType = () => {
    setFormType(formType === "login" ? "signup" : "login");
    setError("");
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image covers the whole page */}
      <Image
        src="/Login_img.png"
        alt="Background visual"
        fill
        className="object-cover z-0"
        priority
      />

      {/* Main content containers */}
      <div className="relative z-20 flex w-full max-w-7xl min-h-[80vh] rounded-3xl overflow-hidden">
        {/* Left side - Transparent container with border */}
        <div className="w-3/5 hidden md:flex flex-col justify-between p-10 bg-transparent border-t-2 border-r-2 border-b-2 border-l-0 border-white rounded-l-3xl">
          {/* Left container is now empty as requested */}
        </div>
        {/* Right side - Form container */}
        <div className="w-full md:w-2/5 flex items-center justify-center px-12 py-10 bg-white rounded-r-3xl">
          <div className="w-full max-w-[360px] font-sans">
            {/* Heading Section */}
            <div className="flex flex-col items-center mb-10">
              <Image
                src="https://res.cloudinary.com/rsmglobal/image/fetch/t_default/f_auto/q_auto/https://www.rsm.global/profiles/rsm_global_platform/themes/rsm_global_platform_2022/images/logo@2x.png"
                alt="RSM Logo"
                width={140}
                height={45}
                className="object-contain mb-8"
                priority
              />
              
              <span className="text-2xl font-black text-black mb-1">
                {otpSent && !isAdmin ? "Enter OTP" : "Login"}
              </span>
              <span className="text-gray-500 text-base mb-2 text-center">
                {otpSent && !isAdmin
                  ? `We've sent a 6-digit OTP to ${email}. Please check your email.`
                  : "Welcome back! Please enter your details to sign in."}
              </span>
              <div className="w-16 h-1 bg-[#009CDE] rounded-full mb-2" />
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 animate-shake">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  className="block text-sm text-gray-600 font-semibold"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm0 0v1a4 4 0 01-8 0v-1" /></svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="workmateuser@nexuses.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={otpSent && !isAdmin}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009CDE]/20 focus:border-[#009CDE] text-gray-700 transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              
              {!otpSent || isAdmin ? (
                <>
                  <div className="space-y-2">
                    <label
                      className="block text-sm text-gray-600 font-semibold"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm0 0V7m0 4v4" /></svg>
                      </span>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={otpSent && !isAdmin}
                        className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009CDE]/20 focus:border-[#009CDE] text-gray-700 transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        disabled={otpSent && !isAdmin}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              {otpSent && !isAdmin && (
                <div className="space-y-2">
                  <label
                    className="block text-sm text-gray-600 font-semibold"
                    htmlFor="otp"
                  >
                    Enter OTP
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      id="otp"
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onPaste={(e) => {
                        e.preventDefault()
                        return false
                      }}
                      onCopy={(e) => {
                        e.preventDefault()
                        return false
                      }}
                      onCut={(e) => {
                        e.preventDefault()
                        return false
                      }}
                      required
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009CDE]/20 focus:border-[#009CDE] text-gray-700 transition-all duration-200 hover:bg-gray-100 text-center text-2xl tracking-widest font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Didn't receive the code?</span>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={sendingOtp}
                      className="text-[#009CDE] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingOtp ? "Sending..." : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg font-bold text-white uppercase bg-gradient-to-r from-[#009CDE] to-[#3F9C35] shadow-sm transition-all duration-300 hover:from-[#009CDE] hover:to-[#3F9C35] focus:outline-none focus:ring-2 focus:ring-[#009CDE]/50 hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || sendingOtp}
              >
                {loading || sendingOtp ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {sendingOtp ? "Sending OTP..." : "Processing..."}
                  </span>
                ) : (
                  otpSent && !isAdmin ? "VERIFY OTP" : (formType === "login" ? "LOGIN" : "SIGN UP")
                )}
              </button>
            </form>

            {showSignup && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {formType === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={toggleFormType}
                    className="font-medium text-[#009CDE] hover:underline"
                  >
                    {formType === "login" ? "Sign up" : "Login"}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
