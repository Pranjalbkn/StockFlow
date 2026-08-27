import { useEffect, useRef, useState } from "react";
import { AlertCircle, Mic, MicOff, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { getProducts } from "../services/inventoryApi";
import { createMultiItemPurchase, getSuppliers } from "../services/purchaseApi";
import { createSale } from "../services/saleApi";
import { interpretAudioCommand } from "../services/voiceCommandApi";
import type { Product } from "../types/Inventory";
import type { Supplier } from "../types/Purchase";
import type { User } from "../types/User";
import type { VoiceAction, VoiceCommand } from "../types/VoiceCommand";

type VoiceEntryPageProps = { user: User; onLogout: () => void };

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function VoiceEntryPage({ user, onLogout }: VoiceEntryPageProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [command, setCommand] = useState<VoiceCommand | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [transactionDate, setTransactionDate] = useState(getToday());
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    Promise.all([getProducts(), getSuppliers()])
      .then(([productList, supplierList]) => {
        setProducts(productList);
        setSuppliers(supplierList);
      })
      .catch((requestError) => setError((requestError as Error).message));

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    };
  }, []);

  function showCommand(result: VoiceCommand) {
    setCommand(result);
    setError("");
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Audio recording is not supported in this browser. Use the text command instead.");
      return;
    }

    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setListening(false);
        setProcessing(true);
        try {
          const mimeType = recorder.mimeType.split(";")[0] || "audio/webm";
          showCommand(await interpretAudioCommand(new Blob(chunksRef.current, { type: mimeType })));
        } catch (requestError) {
          setError((requestError as Error).message);
        } finally {
          setProcessing(false);
        }
      };
      recorder.start();
      setListening(true);
      stopTimerRef.current = window.setTimeout(() => recorder.stop(), 20_000);
    } catch {
      setError("Microphone access was not allowed. You can still type the command.");
    }
  }

  function stopRecording() {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function changeAction(action: VoiceAction) {
    if (!command) return;
    setCommand({ ...command, action });
  }

  function changeItem(index: number, changes: Partial<VoiceCommand["items"][number]>) {
    if (!command) return;
    const items = command.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item);
    setCommand({ ...command, items });
  }

  function selectProduct(index: number, productId: number) {
    if (!command) return;
    const product = products.find((item) => item.id === productId);
    const currentItem = command.items[index];
    changeItem(index, {
      productId,
      productName: product?.name ?? currentItem.productName,
      unitAmount: currentItem.unitAmount ?? Number(command.action === "PURCHASE" ? product?.cost_price : product?.selling_price),
    });
  }

  function removeItem(index: number) {
    if (!command) return;
    setCommand({ ...command, items: command.items.filter((_, itemIndex) => itemIndex !== index) });
  }

  function discardCommand() {
    setCommand(null);
    setCustomerPhone("");
    setInvoiceNumber("");
    setTransactionDate(getToday());
    setError("");
  }

  async function confirmCommand() {
    if (!command || command.action === "UNKNOWN") {
      setError("Choose whether this is a sale or purchase.");
      return;
    }
    if (command.items.length === 0 || command.items.some((item) => !item.productId || item.quantity < 1 || item.unitAmount === null || item.unitAmount < 0)) {
      setError("Select every product and provide a valid quantity and price.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (command.action === "SALE") {
        await createSale({
          customerName: command.customerName ?? "",
          customerPhone,
          invoiceNumber,
          saleDate: transactionDate,
          items: command.items.map((item) => ({ productId: item.productId!, quantity: item.quantity, unitPrice: item.unitAmount! })),
        });
        navigate("/sales");
      } else {
        await createMultiItemPurchase({
          supplierId: command.supplierId,
          invoiceNumber,
          purchaseDate: transactionDate,
          items: command.items.map((item) => ({ productId: item.productId!, quantity: item.quantity, unitCost: item.unitAmount! })),
        });
        navigate("/purchases");
      }
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50/40 px-3 py-2.5 text-sm shadow-sm outline-none hover:border-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15";
  const total = command?.items.reduce((sum, item) => sum + item.quantity * (item.unitAmount ?? 0), 0) ?? 0;

  return <AppShell user={user} onLogout={onLogout}>
    <p className="text-sm font-medium text-emerald-700">AI-assisted entry</p>
    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Voice stock entry</h1>
    <p className="mt-2 text-slate-600">Speak a sale or purchase, review what StockFlow understood, then confirm it.</p>

    {error && <p className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="mt-0.5 shrink-0" size={16} />{error}</p>}

    <div className="mt-6 grid min-w-0 gap-5 sm:mt-8 xl:grid-cols-[390px_minmax(0,1fr)] xl:gap-6">
      <section className="min-w-0 self-start rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
        <div className="flex items-center gap-2"><Sparkles size={18} className="text-emerald-700" /><h2 className="font-semibold text-slate-900">Give a command</h2></div>
        <p className="mt-2 text-sm leading-6 text-slate-500">Example: “Sold 3 blue shirts to Rahul for 800 each.”</p>

        <button type="button" onClick={listening ? stopRecording : startRecording} disabled={processing} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-semibold ${listening ? "bg-red-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"} disabled:opacity-60`}>
          {listening ? <><MicOff size={19} /> Stop recording</> : <><Mic size={19} /> Start voice command</>}
        </button>
        {listening && <p className="mt-3 text-center text-sm font-medium text-red-600">Listening… speak naturally</p>}
        {processing && <p className="mt-3 text-center text-sm text-emerald-700">Gemini is interpreting your command…</p>}

      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5"><h2 className="font-semibold text-slate-900">Review before confirming</h2><p className="mt-1 break-words text-sm text-slate-500">AI suggestions remain editable and do not change stock automatically.</p></div>
        {!command ? <div className="px-4 py-14 text-center sm:px-6 sm:py-20"><Mic size={30} className="mx-auto text-slate-300" /><p className="mt-3 font-medium text-slate-900">No command interpreted yet</p><p className="mt-1 text-sm text-slate-500">Your sale or purchase preview will appear here.</p></div> : <div className="min-w-0 space-y-5 p-4 sm:p-5">
          {command.missingFields.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><p className="font-medium">Please review:</p><ul className="mt-1 list-inside list-disc">{command.missingFields.map((message) => <li key={message}>{message}</li>)}</ul></div>}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Action<select value={command.action} onChange={(event) => changeAction(event.target.value as VoiceAction)} className={inputClass}><option value="UNKNOWN">Select action</option><option value="SALE">Sale</option>{user.role !== "SALESPERSON" && <option value="PURCHASE">Purchase</option>}</select></label>
            {command.action === "SALE" ? <label className="text-sm font-medium text-slate-700">Customer<input value={command.customerName ?? ""} onChange={(event) => setCommand({ ...command, customerName: event.target.value })} className={inputClass} /></label> : <label className="text-sm font-medium text-slate-700">Supplier<select value={command.supplierId ?? ""} onChange={(event) => setCommand({ ...command, supplierId: event.target.value ? Number(event.target.value) : null })} className={inputClass}><option value="">No supplier selected</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>}
            <label className="text-sm font-medium text-slate-700">Date<input type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} className={inputClass} /></label>
            {command.action === "SALE" && <label className="text-sm font-medium text-slate-700">WhatsApp <span className="font-normal text-slate-400">(optional)</span><input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className={inputClass} /></label>}
            <label className="text-sm font-medium text-slate-700">Invoice no. <span className="font-normal text-slate-400">(optional)</span><input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className={inputClass} /></label>
          </div>

          <div className="space-y-3 md:hidden">
            {command.items.map((item, index) => <article key={`${item.productName}-${index}`} className="min-w-0 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-900">Item {index + 1}</p><button type="button" onClick={() => removeItem(index)} aria-label={`Remove item ${index + 1}`} className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button></div>
              <label className="mt-3 block text-sm font-medium text-slate-700">Product<select value={item.productId ?? ""} onChange={(event) => selectProduct(index, Number(event.target.value))} className={inputClass}><option value="">Choose product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}</select></label>
              {!item.productId && <p className="mt-1 break-words text-xs text-amber-700">Heard: {item.productName}</p>}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="min-w-0 text-sm font-medium text-slate-700">Quantity<input type="number" min="1" value={item.quantity} onChange={(event) => changeItem(index, { quantity: Number(event.target.value) })} className={inputClass} /></label>
                <label className="min-w-0 text-sm font-medium text-slate-700">{command.action === "PURCHASE" ? "Unit cost" : "Unit price"}<input type="number" min="0" step="0.01" value={item.unitAmount ?? ""} onChange={(event) => changeItem(index, { unitAmount: event.target.value === "" ? null : Number(event.target.value) })} className={inputClass} /></label>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm"><span className="text-slate-500">Line total</span><strong className="text-slate-900">₹{(item.quantity * (item.unitAmount ?? 0)).toLocaleString("en-IN")}</strong></div>
            </article>)}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Product</th><th className="px-3 py-3">Quantity</th><th className="px-3 py-3">{command.action === "PURCHASE" ? "Unit cost" : "Unit price"}</th><th className="px-3 py-3">Total</th><th className="w-12"></th></tr></thead><tbody className="divide-y divide-slate-100">{command.items.map((item, index) => <tr key={`${item.productName}-${index}`}><td className="px-3 py-3"><select value={item.productId ?? ""} onChange={(event) => selectProduct(index, Number(event.target.value))} className="w-full rounded-md border border-slate-300 px-2 py-2"><option value="">Choose product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}</select>{!item.productId && <p className="mt-1 text-xs text-amber-700">Heard: {item.productName}</p>}</td><td className="px-3 py-3"><input type="number" min="1" value={item.quantity} onChange={(event) => changeItem(index, { quantity: Number(event.target.value) })} className="w-24 rounded-md border border-slate-300 px-2 py-2" /></td><td className="px-3 py-3"><input type="number" min="0" step="0.01" value={item.unitAmount ?? ""} onChange={(event) => changeItem(index, { unitAmount: event.target.value === "" ? null : Number(event.target.value) })} className="w-28 rounded-md border border-slate-300 px-2 py-2" /></td><td className="px-3 py-3 font-medium text-slate-900">₹{(item.quantity * (item.unitAmount ?? 0)).toLocaleString("en-IN")}</td><td className="px-3 py-3"><button type="button" onClick={() => removeItem(index)} className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>

          <div className="flex min-w-0 flex-col gap-4 rounded-xl bg-slate-900 px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="min-w-0"><p className="text-xs uppercase tracking-wide text-slate-400">Transaction total</p><p className="mt-1 break-words text-xl font-semibold">₹{total.toLocaleString("en-IN")}</p></div><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><button type="button" onClick={discardCommand} disabled={saving} className="w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50 sm:w-auto sm:py-2.5"><span className="flex items-center justify-center gap-2"><Trash2 size={16} />Discard entry</span></button><button type="button" onClick={confirmCommand} disabled={saving || command.items.length === 0} className="w-full rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50 sm:w-auto sm:py-2.5">{saving ? "Saving…" : `Confirm ${command.action === "PURCHASE" ? "purchase" : "sale"}`}</button></div></div>
        </div>}
      </section>
    </div>
  </AppShell>;
}

export default VoiceEntryPage;
