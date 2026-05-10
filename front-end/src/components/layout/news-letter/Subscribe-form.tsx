import React, { FormEvent, useState } from "react";
import Swal from "sweetalert2";
import { siteConfig } from "@/config/site";
import { subscribeNewsletterEmail } from "@/lib/api/public-api";
import { Loader2, Mail, AlertCircle, Info, Timer, X } from "lucide-react";

type MessageState = {
  text: string;
  type: 'error' | 'info' | 'warning';
} | null;

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const { subscribe } = siteConfig;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);

    try {
      await subscribeNewsletterEmail(email);
      setEmail("");

      Swal.fire({
        title: 'Welcome Aboard!',
        text: 'You have successfully subscribed to our newsletter.',
        icon: 'success',
        background: '#FFFFFF',
        iconColor: '#DC2626',
        confirmButtonColor: '#DC2626',
        color: '#0F172A',
        customClass: {
          popup: 'rounded-2xl border border-gray-100',
          confirmButton: 'rounded-xl px-7 py-4'
        }
      });
    } catch (err: any) {
      const status = err.status || err.response?.status;
      if (status === 409) {
        setMessage({ text: "You are already on our list!", type: 'info' });
      } else if (status === 429) {
        setMessage({ text: "Too many attempts. Try again later.", type: 'warning' });
      } else {
        setMessage({ text: "You are already on our list!", type: 'error' });
      }
    } finally {
      setBusy(false);
    }
  }

  const getMessageStyles = () => {
    switch (message?.type) {
      case 'info': return "border-blue-200 bg-blue-50 text-blue-700";
      case 'warning': return "border-amber-200 bg-amber-50 text-amber-700";
      default: return "border-red-200 bg-red-50 text-red-700";
    }
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-2xl">
      {/* Message Area - Space only appears when message exists */}
      <div className={`transition-all duration-300 ${message ? "mb-4 opacity-100" : "mb-0 opacity-0 h-0 overflow-hidden"}`}>
        {message && (
          <div
            className={`w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm animate-in fade-in slide-in-from-top-2 ${getMessageStyles()}`}
            role="alert"
          >
            <div className="flex items-center gap-2">
              {message.type === 'info' && <Info className="h-4 w-4 shrink-0" />}
              {message.type === 'warning' && <Timer className="h-4 w-4 shrink-0" />}
              {message.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0" />}
              <p className="font-medium">{message.text}</p>
            </div>
            <button 
              type="button" 
              onClick={() => setMessage(null)} 
              className="hover:bg-black/5 rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex w-full flex-col divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition-all focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10 sm:h-[54px] sm:flex-row sm:divide-x sm:divide-y-0 sm:items-stretch"
      >
        <div className="relative min-h-[54px] min-w-0 flex-1 group sm:min-h-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
          </div>
          <input
            id="footer-email"
            type="email"
            required
            placeholder={subscribe.placeholder}
            value={email}
            onChange={(e) => {
                setEmail(e.target.value);
                if(message) setMessage(null);
            }}
            disabled={busy}
            className="h-[54px] w-full border-0 bg-transparent pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-gray-400 focus:ring-0 disabled:bg-gray-50 sm:h-full"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex h-[54px] w-full items-center justify-center bg-red-600 px-8 text-sm font-bold text-white transition-all hover:bg-red-700 active:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 sm:h-auto sm:w-auto sm:min-w-[10.5rem] sm:shrink-0"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            subscribe.button
          )}
        </button>
      </form>
    </div>
  );
}