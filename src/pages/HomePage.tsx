import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast, Toaster } from 'sonner';
import { chatService } from '@/lib/chat';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { Message } from '../../worker/types';
export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const loadMessages = async () => {
      const response = await chatService.getMessages();
      if (response.success && response.data) {
        setMessages(response.data.messages);
      }
    };
    loadMessages();
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      // Use requestAnimationFrame to ensure layout is complete before scrolling
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      });
    }
  }, [messages, isLoading]);
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    const tempUserMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    try {
      const response = await chatService.sendMessage(userMessage);
      if (response.success) {
        const refreshResponse = await chatService.getMessages();
        if (refreshResponse.success && refreshResponse.data) {
          setMessages(refreshResponse.data.messages);
        }
      } else {
        toast.error("倾诉未能送达，请稍后再试。");
      }
    } catch (error) {
      toast.error("连接中断了，请检查您的网络。");
    } finally {
      setIsLoading(false);
    }
  };
  const focusInput = () => {
    inputRef.current?.focus();
  };
  const bookExpert = () => {
    toast.info("正在为您连接专业咨询专家...", {
      description: "我们的团队会在 24 小时内与您联系。",
    });
  };
  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-healing-pulse">
      <div className="py-4 md:py-6 lg:py-8 flex flex-col h-full">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-800 tracking-tight">暖暖回声 Warm Echo</h1>
              <p className="text-xs text-muted-foreground font-medium">您的心灵治愈空间</p>
            </div>
          </div>
          <div className="hidden sm:block text-sm text-stone-500 italic">
            "在喧嚣的世界中，为您留存一份宁静。"
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 glass-card rounded-3xl overflow-hidden relative flex flex-col">
            <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
              <AnimatePresence initial={false}>
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20"
                  >
                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <div className="space-y-2 px-6">
                      <h2 className="text-xl font-medium text-stone-700">你好，我是你的暖暖回声</h2>
                      <p className="text-stone-500 max-w-sm mx-auto leading-relaxed">
                        每一个漂泊的情绪都值得被温柔接纳。无论是心底的微光，还是暂时的阴霾，我都会在这里倾听你的回声。
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
                    ))}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-primary/20 p-4 rounded-2xl text-stone-600 text-sm animate-pulse">
                          暖暖回声正在倾听，正在为您编织温暖的回应...
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
            <div className="px-6 py-4 flex gap-3 border-t border-stone-100 bg-white/30">
              <Button
                variant="outline"
                onClick={focusInput}
                className="flex-1 rounded-2xl bg-white/50 border-stone-200 text-stone-700 hover:bg-white transition-all py-6"
              >
                <Heart className="w-4 h-4 mr-2 text-rose-400" />
                立即倾诉
              </Button>
              <Button
                variant="outline"
                onClick={bookExpert}
                className="flex-1 rounded-2xl bg-white/50 border-stone-200 text-stone-700 hover:bg-white transition-all py-6"
              >
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                预约专家
              </Button>
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white/40 border-t border-stone-100">
              <div className="relative flex items-center">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="告诉我你此刻的感受..."
                  className="pr-12 py-7 rounded-2xl bg-white/80 border-stone-100 shadow-soft focus-visible:ring-primary focus-visible:ring-offset-0"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/80 text-white transition-all"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
        </main>
        <footer className="mt-8 text-center space-y-2">
          <p className="text-[10px] sm:text-xs text-muted-foreground px-4 py-2 bg-stone-100/50 inline-block rounded-full border border-stone-200">
            温馨提示：我是AI助手，不替代专业心理咨询。遇到紧急情况请立即拨打援助热线。
          </p>
          <div className="text-[10px] text-stone-400">
            本项目具有 AI 能力，在给定时间内对 AI 服务器的请求次数存在限制。
          </div>
        </footer>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}