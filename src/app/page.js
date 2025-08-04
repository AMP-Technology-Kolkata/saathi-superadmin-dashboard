import { LoginForm } from "@/components/login-form";
import ParticlesBackground from "@/components/ParticlesBackground"; // 👈 import it
import React from "react";

const page = () => {
  return (
    <div className="relative min-h-svh overflow-hidden">

      {/* Login Content Layer */}
      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-3xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default page;
