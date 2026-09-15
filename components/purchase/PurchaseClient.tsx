'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Upload,
  Loader2,
  CheckCircle2,
  ImageIcon,
  X,
  Building2,
  Smartphone,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/lib/compressImage';
import { CourseThumbnail } from '@/components/admin/CourseThumbnail';

const PAYMENT_ACCOUNTS = {
  cbe: {
    accountName: 'Awraq Skills PLC',
    accountNumber: '1000123456789',
  },
  telebirr: {
    accountName: 'Awraq Skills',
    phoneNumber: '0911234567',
  },
};

interface Props {
  item: any;
  itemType: 'course' | 'digital_product';
}

export const PurchaseClient: React.FC<Props> = ({ item, itemType }) => {
  const router = useRouter();
  const [method, setMethod] = useState<'cbe' | 'telebirr'>('cbe');
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileSizeInfo, setFileSizeInfo] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith('image/')) {
      toast.error('Please select an image (JPG or PNG)');
      return;
    }

    setRawFile(f);
    setPreview(URL.createObjectURL(f));
    setFileSizeInfo(null);
  };

  const handleSubmit = async () => {
    if (!rawFile) {
      toast.error('Please upload your payment receipt');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // 1. Compress Image
      const compressedBlob = await compressImage(rawFile, 1200, 0.7);
      const originalMB = (rawFile.size / (1024 * 1024)).toFixed(1);
      const compressedKB = Math.round(compressedBlob.size / 1024);
      setFileSizeInfo(`Compressed ${originalMB}MB → ${compressedKB}KB`);

      setUploadProgress(30);

      // 2. Get signed upload URL
      const urlRes = await fetch('/api/payment/upload-url');
      const { uploadUrl, fileKey } = await urlRes.json();

      setUploadProgress(50);

      // 3. Fast Upload
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', 'image/jpeg');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = 50 + Math.round((e.loaded / e.total) * 40);
            setUploadProgress(pct);
          }
        };

        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error('Upload failed'));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(compressedBlob);
      });

      setUploadProgress(95);

      // 4. Submit Request
      const submitRes = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType,
          itemId: item.id,
          amount: item.price,
          paymentMethod: method,
          receiptImageKey: fileKey,
        }),
      });

      const data = await submitRes.json();
      if (!submitRes.ok) {
        toast.error(data.error || 'Failed to submit payment');
        setUploading(false);
        return;
      }

      setUploadProgress(100);
      toast.success('Receipt uploaded instantly!');
      router.push(`/purchase/waiting/${data.payment.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload receipt. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] pt-24 sm:pt-28 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={itemType === 'course' ? `/courses/${item.id}` : `/products/${item.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-4 sm:p-5 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
            <CourseThumbnail
              thumbnailKey={item.thumbnail_url}
              alt={item.title}
              className="w-full h-full object-cover"
              fallbackClassName="w-full h-full flex items-center justify-center bg-slate-100"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-0.5">
              {itemType === 'course' ? 'Course' : 'Digital Product'}
            </div>
            <div className="text-sm font-black text-slate-900 truncate">{item.title}</div>
          </div>
          <div className="text-xl font-black text-slate-900">
            ETB {Number(item.price || 0).toLocaleString()}
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-5 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
              1
            </div>
            <h2 className="text-base font-black text-slate-900">Choose payment method</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('cbe')}
              className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                method === 'cbe'
                  ? 'border-[#ddb049] bg-amber-50'
                  : 'border-[#e8e0d2] bg-white hover:border-slate-300'
              }`}
            >
              <Building2
                className={`w-6 h-6 mb-2 ${method === 'cbe' ? 'text-[#ddb049]' : 'text-slate-400'}`}
              />
              <div className="text-sm font-black text-slate-900">CBE</div>
              <div className="text-[10px] text-slate-500 font-medium">Bank Transfer</div>
            </button>
            <button
              type="button"
              onClick={() => setMethod('telebirr')}
              className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                method === 'telebirr'
                  ? 'border-[#ddb049] bg-amber-50'
                  : 'border-[#e8e0d2] bg-white hover:border-slate-300'
              }`}
            >
              <Smartphone
                className={`w-6 h-6 mb-2 ${
                  method === 'telebirr' ? 'text-[#ddb049]' : 'text-slate-400'
                }`}
              />
              <div className="text-sm font-black text-slate-900">Telebirr</div>
              <div className="text-[10px] text-slate-500 font-medium">Mobile Money</div>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-5 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
              2
            </div>
            <h2 className="text-base font-black text-slate-900">
              Send ETB {Number(item.price).toLocaleString()} to:
            </h2>
          </div>

          <div className="space-y-3">
            {method === 'cbe' ? (
              <>
                <PaymentField
                  label="Account Name"
                  value={PAYMENT_ACCOUNTS.cbe.accountName}
                  onCopy={() => copy(PAYMENT_ACCOUNTS.cbe.accountName, 'Name')}
                />
                <PaymentField
                  label="Account Number"
                  value={PAYMENT_ACCOUNTS.cbe.accountNumber}
                  mono
                  onCopy={() => copy(PAYMENT_ACCOUNTS.cbe.accountNumber, 'Account number')}
                />
              </>
            ) : (
              <>
                <PaymentField
                  label="Account Name"
                  value={PAYMENT_ACCOUNTS.telebirr.accountName}
                  onCopy={() => copy(PAYMENT_ACCOUNTS.telebirr.accountName, 'Name')}
                />
                <PaymentField
                  label="Phone Number"
                  value={PAYMENT_ACCOUNTS.telebirr.phoneNumber}
                  mono
                  onCopy={() => copy(PAYMENT_ACCOUNTS.telebirr.phoneNumber, 'Phone')}
                />
              </>
            )}
            <PaymentField
              label="Amount"
              value={`ETB ${Number(item.price).toLocaleString()}`}
              onCopy={() => copy(String(item.price), 'Amount')}
            />
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-900 font-bold">
              ⚠️ After sending, take a screenshot of the payment confirmation and upload it below.
            </p>
          </div>
        </div>

        {/* Upload */}
        <div className="bg-white rounded-2xl border border-[#e8e0d2] shadow-sm p-5 sm:p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                3
              </div>
              <h2 className="text-base font-black text-slate-900">Upload payment receipt</h2>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-100 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-600" /> Auto-compressed
            </span>
          </div>

          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Receipt preview"
                className="w-full max-h-[350px] object-contain rounded-xl border border-[#e8e0d2] bg-[#fbfaf7]"
              />
              <button
                type="button"
                onClick={() => {
                  setRawFile(null);
                  setPreview(null);
                  setFileSizeInfo(null);
                }}
                disabled={uploading}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 border border-[#e8e0d2] flex items-center justify-center cursor-pointer hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-[#ddb049] hover:bg-amber-50/30 transition-all">
                <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <div className="text-sm font-bold text-slate-700 mb-1">
                  Click to upload receipt image
                </div>
                <div className="text-xs text-slate-500 font-medium">PNG or JPG screenshot</div>
              </div>
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          )}

          {uploading && (
            <div className="mt-3 space-y-1.5 bg-[#fbfaf7] p-3 rounded-xl border border-[#e8e0d2]">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>{fileSizeInfo || 'Optimizing & Uploading...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ddb049] transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!rawFile || uploading}
          className="w-full min-h-[52px] py-4 rounded-xl bg-[#ddb049] hover:bg-[#c99a3a] border-b-[4px] border-[#b8862f] hover:border-b-[2px] hover:translate-y-[2px] text-[#0a0704] text-sm font-bold shadow-[0_8px_20px_rgba(221,176,73,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Payment for Review</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const PaymentField = ({ label, value, mono, onCopy }: any) => (
  <div className="flex items-center justify-between bg-[#fbfaf7] rounded-xl px-4 py-3">
    <div className="min-w-0 flex-1">
      <div className="text-[10px] uppercase font-black text-slate-500 tracking-wider mb-0.5">
        {label}
      </div>
      <div className={`text-sm font-bold text-slate-900 truncate ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
    <button
      type="button"
      onClick={onCopy}
      className="ml-2 p-2 rounded-lg hover:bg-white text-slate-500 hover:text-[#ddb049] cursor-pointer"
    >
      <Copy className="w-4 h-4" />
    </button>
  </div>
);