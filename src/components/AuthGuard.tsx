"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Allow access to home and login/auth routes without authentication
      if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/auth")) {
        setLoading(false);
        return;
      }
      
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login?returnTo=" + encodeURIComponent(pathname));
      } else {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [pathname, router]);

  if (loading && pathname !== "/" && !pathname.startsWith("/login") && !pathname.startsWith("/auth")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return <>{children}</>;
}
