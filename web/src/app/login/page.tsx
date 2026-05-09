"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import MotivationCard from "@/components/MotivationCard";
import FloatingSurahs from "@/components/FloatingSurahs";

export default function LoginPage() {
  const t = useTranslations("Login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("errorWrongCredentials"));
        setIsLoading(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setError(t("errorGeneric"));
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0c0f1a] dark:to-slate-900 px-4 overflow-hidden">
      <FloatingSurahs />
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TahfidzFlow</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t("subtitle")}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Login Field */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
              >
                {t("labelLogin")}
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-400 dark:focus:border-emerald-400 transition-colors outline-none text-gray-900 dark:text-white dark:placeholder-slate-500"
                placeholder={t("placeholderUsername")}
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
              >
                {t("labelPassword")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-400 dark:focus:border-emerald-400 transition-colors outline-none text-gray-900 dark:text-white dark:placeholder-slate-500"
                  placeholder={t("placeholderPassword")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                   <span>{t("buttonLoggingIn")}</span>
                </>
              ) : (
                <span>{t("buttonLogin")}</span>
              )}
            </button>
          </form>
        </div>

        {/* Daily Quran Motivation */}
        <div className="mt-6">
          <MotivationCard />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 dark:text-slate-500 mt-6">
          &copy; {new Date().getFullYear()} TahfidzFlow
        </p>
      </div>
    </div>
  );
}
