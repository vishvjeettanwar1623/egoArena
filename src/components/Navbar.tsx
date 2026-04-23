"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, PlusCircle, User, Trophy } from "lucide-react";
import { motion } from "framer-motion";

import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const [hasCard, setHasCard] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser) {
        const { data: card } = await supabase.from("cards").select("id").eq("user_id", authUser.id).single();
        setHasCard(!!card);
        if (card) {
          localStorage.setItem("egoarena_card_id", card.id);
        }
      } else {
        setHasCard(false);
      }
    };
    checkStatus();
  }, [pathname]);

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Arena", href: "/arena", icon: Swords },
    { 
      name: hasCard ? "Evolve" : "Create", 
      href: user ? (hasCard ? "/reassess" : "/create") : "/login?returnTo=/create", 
      icon: PlusCircle 
    },
    { name: "Ranks", href: "/leaderboard", icon: Trophy },
    { name: "Me", href: user ? "/me" : "/login?returnTo=/me", icon: User },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-1 px-3 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 ${
                isActive
                  ? "text-bg"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="navbar-pill"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest relative z-10 hidden sm:block">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
