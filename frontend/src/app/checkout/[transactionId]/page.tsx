"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { apiRequest } from "../../../lib/api";
import Link from "next/link";
import { CreditCard, QrCode, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

interface Course {
  title: string;
  price: number;
}

interface Transaction {
  id: string;
  courseId: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  paymentMethod: string;
  createdAt: string;
  course: Course;
}

export default function Checkout() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.transactionId as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    async function loadTransaction() {
      try {
        const history = await apiRequest("/transactions");
        const found = history.find((t: Transaction) => t.id === transactionId);
        if (!found) {
          throw new Error("Transaction not found");
        }
        setTransaction(found);
        if (found.status === "SUCCESS") {
          setSuccess(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load transaction details");
      } finally {
        setLoading(false);
      }
    }
    loadTransaction();
  }, [transactionId]);

  // Countdown timer for QRIS
  useEffect(() => {
    if (success || !transaction || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, transaction, success]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const handleSimulatePayment = async () => {
    setPaying(true);
    setError(null);
    try {
      await apiRequest(`/transactions/${transactionId}/pay`, {
        method: "POST",
      });
      setSuccess(true);
      // Automatically redirect after 3 seconds
      setTimeout(() => {
        if (transaction) {
          router.push(`/courses/${transaction.courseId}/learn`);
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Payment simulation failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center py-40 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">Loading payment details...</p>
        </div>
      </>
    );
  }

  if (error || !transaction) {
    return (
      <>
        <Navbar />
        <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center py-40 text-center px-4">
          <div className="rounded-full bg-red-950/40 p-4 border border-red-900/50">
            <CreditCard size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold mt-4">Transaction Error</h2>
          <p className="text-zinc-550 text-sm mt-1">{error || "The transaction details could not be retrieved."}</p>
          <Link href="/" className="mt-6 text-sm text-violet-400 font-bold hover:underline">
            Back to Catalog
          </Link>
        </div>
      </>
    );
  }

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-zinc-950 text-white py-12 px-4">
        <div className="mx-auto max-w-4xl">
          {success ? (
            /* Payment Success Screen */
            <div className="glass-panel border-green-500/20 rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto border-glow relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
              <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-green-950/50 border border-green-500/30 text-green-400">
                <ShieldCheck size={48} className="animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-white mt-6">Payment Completed!</h2>
              <p className="text-zinc-400 mt-2 text-sm">
                Thank you! Your transaction has been processed successfully. Your access to the course is now unlocked.
              </p>
              
              <div className="mt-8 rounded-xl bg-zinc-900/50 p-4 text-left border border-zinc-850">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Course</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-300 mt-1">
                  <span className="truncate max-w-[200px]">{transaction.course?.title}</span>
                  <span>{formatPrice(transaction.amount)}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-550 mt-6 animate-pulse">
                Redirecting to course materials player in a few seconds...
              </p>

              <Link
                href={`/courses/${transaction.courseId}/learn`}
                className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all"
              >
                Go to Player
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            /* Checkout Simulator */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Transaction summary & Simulator */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-panel rounded-2xl p-6 border border-zinc-850">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-yellow-500">
                    <CreditCard className="text-yellow-500" size={20} />
                    Confirm Course Transaction
                  </h2>

                  {transaction.paymentMethod === "QRIS" ? (
                    /* QRIS Simulated Panel */
                    <div className="flex flex-col items-center py-6 text-center">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                        Pay Before Countdown Ends
                      </span>
                      <span className="text-3xl font-black text-violet-400 mt-2 tracking-wider">
                        {formatTime(timer)}
                      </span>

                      {/* Simulated QR Box */}
                      <div className="relative mt-8 rounded-2xl bg-white p-4 h-56 w-56 flex flex-col items-center justify-center shadow-lg border-glow border-violet-500/20">
                        <QrCode size={180} className="text-zinc-950" />
                        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                          <span className="bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1 rounded">
                            Scan QR Code
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-500 mt-6 max-w-sm">
                        Simulate the scan process by clicking the payment completion button below.
                      </p>
                    </div>
                  ) : (
                    /* Virtual Account Simulated Panel */
                    <div className="space-y-6 py-4">
                      <div>
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                          Virtual Account Bank
                        </span>
                        <span className="text-sm font-bold text-zinc-300 block mt-1">
                          Simulated Bank Transfer
                        </span>
                      </div>

                      <div>
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                          VA Account Number
                        </span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xl font-black tracking-widest text-violet-400 bg-zinc-900/80 px-4 py-2 rounded-lg border border-zinc-800">
                            8830 0812 3456 7890
                          </span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-zinc-900/30 p-4 border border-zinc-850">
                        <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                          <HelpCircle size={14} className="text-violet-500" />
                          Transfer Instructions:
                        </span>
                        <ol className="text-xs text-zinc-500 space-y-1.5 list-decimal pl-4 mt-2">
                          <li>Open your simulated banking app.</li>
                          <li>Navigate to VA Transfers and enter the VA number above.</li>
                          <li>Confirm transaction amount matches billing exactly.</li>
                          <li>Click "Complete Simulation" to confirm.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 border-t border-zinc-900 pt-6">
                    <button
                      onClick={handleSimulatePayment}
                      disabled={paying}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-yellow-650/20 hover:from-yellow-500 hover:to-orange-500 hover:shadow-yellow-650/30 transition-all border-glow border-yellow-500/20"
                    >
                      {paying ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <ShieldCheck size={18} />
                          <span>Confirm and Pay Rp {transaction.amount.toLocaleString('id-ID')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Billing summary */}
              <div className="lg:col-span-1">
                <div className="glass-panel rounded-2xl p-6 border border-zinc-850 space-y-6">
                  <h3 className="text-lg font-bold border-b border-zinc-900 pb-3">Billing Invoice</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider block">Course Title</span>
                      <span className="text-sm font-semibold text-zinc-300 block mt-1 truncate">
                        {transaction.course?.title}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider block">Payment Method</span>
                      <span className="text-sm font-semibold text-zinc-300 block mt-1">
                        {transaction.paymentMethod}
                      </span>
                    </div>

                    <div className="border-t border-zinc-900 pt-4 flex justify-between items-center">
                      <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">Total Charge</span>
                      <span className="text-xl font-extrabold text-yellow-400">
                        {formatPrice(transaction.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
