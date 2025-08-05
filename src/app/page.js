"use client";

import React from "react";
import { LoginForm } from "@/components/login-form";
import ParticleBackground from "@/components/ParticleBackground";

const Page = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Page;
