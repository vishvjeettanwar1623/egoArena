"use client";

import { useState, useEffect } from "react";
import { Share2, Check, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

interface ShareButtonProps {
  cardId: string;
  cardName: string;
  cardClass: string;
  cardAlignment: string;
}

export default function ShareButton({ cardId, cardName, cardClass, cardAlignment }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const localId = localStorage.getItem("egoarena_card_id");
    if (localId === cardId) {
      setIsOwner(true);
    }
  }, [cardId]);

  const handleShare = async () => {
    setIsGenerating(true);
    
    try {
      // 1. Generate PNG Image from the Card DOM Element
      const cardElement = document.getElementById("ego-card-element");
      if (!cardElement) throw new Error("Card element not found");

      const dataUrl = await toPng(cardElement, {
        cacheBust: true,
        backgroundColor: "#0f1018",
        pixelRatio: 2,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (!blob) throw new Error("Failed to create image blob");

      // Note: window.location.href automatically uses the real, live URL if deployed!
      const shareUrl = window.location.href; 
      
      const shareText = `Challenge my psyche 🔥💥\nI am the ${cardClass} (${cardAlignment}) of the EgoArena.\n\nStep into the Arena and challenge me:\n${shareUrl}`;

      const file = new File([blob], `EgoArena_${cardName.replace(/\s+/g, '_')}.png`, { type: "image/png" });
      const shareData = {
        title: 'EgoArena Character',
        text: shareText,
        files: [file], // Attach the PNG!
      };

      // 2. Check if Mobile Native Share is supported and CAN share files
      const isMobile = /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

      if (navigator.share && navigator.canShare && navigator.canShare(shareData) && isMobile) {
        try {
          await navigator.share(shareData);
        } catch (err: any) {
          if (err.name !== 'AbortError') console.error("Error sharing:", err);
        }
      } else {
        // 3. Fallback for Desktop: Download PNG directly AND copy text to clipboard
        
        // Trigger Download
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `EgoArena_${cardName.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        // Copy Text to Clipboard
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error("Failed to generate or share card:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOwner) return null;

  return (
    <button 
      onClick={handleShare}
      disabled={isGenerating}
      className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 border rounded-xl text-sm font-sans font-semibold transition-all ${
        copied 
          ? 'bg-green/10 border-green/30 text-green' 
          : isGenerating 
            ? 'bg-surface2/50 border-border-strong/50 text-white/50 cursor-not-allowed'
            : 'bg-surface2 border-border-strong hover:bg-white/5 text-white'
      }`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Forging Card...</span>
        </>
      ) : copied ? (
        <>
          <Check className="w-4 h-4" />
          <span>Downloaded & Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>Share Card</span>
        </>
      )}
    </button>
  );
}
