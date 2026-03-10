import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] p-4 shadow-sm relative",
          isUser
            ? "bg-accent/40 text-stone-800 rounded-2xl rounded-tr-none ml-12"
            : "bg-primary/20 text-stone-800 rounded-2xl rounded-tl-none mr-12"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
        <div
          className={cn(
            "absolute top-0 w-3 h-3",
            isUser
              ? "-right-1 bg-accent/40 [clip-path:polygon(0%_0%,100%_0%,0%_100%)]"
              : "-left-1 bg-primary/20 [clip-path:polygon(0%_0%,100%_0%,100%_100%)]"
          )}
        />
        <div className={cn(
          "mt-2 text-[10px] opacity-40 uppercase tracking-tighter font-medium",
          isUser ? "text-right" : "text-left"
        )}>
          {isUser ? "我" : "暖暖回声"}
        </div>
      </div>
    </motion.div>
  );
}