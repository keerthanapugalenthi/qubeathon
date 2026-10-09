import React, { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, Sparkles, RefreshCw, X, ScanText, CheckCircle2 } from 'lucide-react';
import { createWorker } from 'tesseract.js';

export default function ScreeningInput({
  productName,
  setProductName,
  inputText,
  setInputText,
  selectedImage,
  setSelectedImage,
  imagePreview,
  setImagePreview,
  isSynthetic,
  setIsSynthetic,
  onScreen,
  loading
}) {
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'image'
  const [ocrStatus, setOcrStatus] = useState(null); // null, 'processing', 'completed', 'failed'
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrMessage, setOcrMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setOcrStatus(null);
      setOcrProgress(0);
      setOcrMessage('');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setOcrStatus(null);
    setOcrProgress(0);
    setOcrMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runOcrOnImage = async () => {
    if (!selectedImage && !imagePreview) return;
    try {
      setOcrStatus('processing');
      setOcrMessage('Initializing client-side OCR engine...');
      setOcrProgress(15);

      const worker = await createWorker('eng');
      setOcrMessage('Processing label image...');
      setOcrProgress(50);

      const ret = await worker.recognize(selectedImage || imagePreview);
      await worker.terminate();

      const extractedText = ret.data.text.trim();
      setOcrProgress(100);
      setOcrStatus('completed');
      setOcrMessage(`Successfully extracted ${extractedText.length} characters.`);

      if (extractedText) {
        setInputText((prev) => {
          if (!prev) return extractedText;
          return `${prev}\n\n[OCR Extracted Text]:\n${extractedText}`;
        });
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setOcrStatus('failed');
      setOcrMessage('OCR extraction encountered an issue. You can still paste or type text directly.');
    }
  };

  const handleClear = () => {
    setProductName('');
    setInputText('');
    handleRemoveImage();
    setIsSynthetic(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'text'
                ? 'bg-govblue-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Claim Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'image'
                ? 'bg-govblue-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Upload Label / Image (with OCR)
          </button>
        </div>

        {isSynthetic && (
          <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-300">
            Synthetic Sample Mode Active
          </span>
        )}
      </div>

      {/* Form Content */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onScreen();
        }}
        className="space-y-4"
      >
        {/* Product Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Product or Listing Name <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. PureDrop 1L Packaged Drinking Water or UltraSafe Helmet"
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-govblue-600 focus:border-govblue-600 bg-slate-50/50"
          />
        </div>

        {/* Tab 1: Image Upload & OCR */}
        {activeTab === 'image' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Product Packaging / Label Image
            </label>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-govblue-600 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50/60 transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-sky-50 text-govblue-700 mx-auto flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700 mb-0.5">
                  Click to upload packaging photo or label
                </p>
                <p className="text-[11px] text-slate-400">
                  PNG, JPG, JPEG, WEBP up to 16MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <div className="relative rounded-xl overflow-hidden max-h-56 flex items-center justify-center bg-slate-900/5 border border-slate-200">
                  <img
                    src={imagePreview}
                    alt="Uploaded Product Label"
                    className="max-h-56 object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition shadow-sm"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* OCR Trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="text-xs">
                    {ocrStatus === 'processing' && (
                      <span className="text-govblue-700 font-medium flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {ocrMessage} ({ocrProgress}%)
                      </span>
                    )}
                    {ocrStatus === 'completed' && (
                      <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {ocrMessage}
                      </span>
                    )}
                    {ocrStatus === 'failed' && (
                      <span className="text-red-600 font-medium">{ocrMessage}</span>
                    )}
                    {!ocrStatus && (
                      <span className="text-slate-500 text-[11px]">
                        Extract text automatically using in-browser OCR (Tesseract.js).
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={ocrStatus === 'processing'}
                    onClick={runOcrOnImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-govblue-800 hover:bg-sky-100 text-xs font-semibold border border-sky-200 transition disabled:opacity-50 self-start sm:self-auto"
                  >
                    <ScanText className="w-3.5 h-3.5" />
                    Extract Text with OCR
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Product Claims & Description Text
            </label>
            <span className="text-[11px] text-slate-400">
              {inputText.length} characters
            </span>
          </div>

          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste product specifications, advertisement copy, or packaging text here... (e.g. 'Conforms to IS 14543, ISI mark CM/L-1234567' or '100% BIS Approved product')"
            className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-govblue-600 focus:border-govblue-600 bg-slate-50/50 font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={loading || (!inputText.trim() && !selectedImage)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-govblue-800 hover:bg-govblue-900 text-white text-xs sm:text-sm font-semibold shadow-md shadow-govblue-900/10 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing Claims...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-sky-300" />
                Run Explainable Screening
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
