import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import DemoSamples from './components/DemoSamples.jsx';
import ScreeningInput from './components/ScreeningInput.jsx';
import ScreeningResult from './components/ScreeningResult.jsx';
import RecentCases from './components/RecentCases.jsx';
import ReportModal from './components/ReportModal.jsx';
import IntelligenceDashboard from './components/IntelligenceDashboard.jsx';

export default function App() {
  const [activeNav, setActiveNav] = useState('screening'); // 'screening' or 'intelligence'
  const [backendOnline, setBackendOnline] = useState(false);
  const [samples, setSamples] = useState([]);
  const [recentCases, setRecentCases] = useState([]);

  // Form states
  const [productName, setProductName] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSynthetic, setIsSynthetic] = useState(false);

  // Results & Modal
  const [screeningResult, setScreeningResult] = useState(null);
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Initial Health and Data Loading
  useEffect(() => {
    checkHealth();
    loadSamples();
    loadRecentCases();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  };

  const loadSamples = async () => {
    try {
      const res = await fetch('/api/samples');
      if (res.ok) {
        const data = await res.json();
        setSamples(data.samples || []);
      }
    } catch (err) {
      console.error('Failed to load samples:', err);
    }
  };

  const loadRecentCases = async () => {
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        setRecentCases(data.cases || []);
      }
    } catch (err) {
      console.error('Failed to load recent cases:', err);
    }
  };

  // 2. Select Sample Scenario
  const handleSelectSample = (sample) => {
    setProductName(sample.product_name);
    setInputText(sample.text);
    setSelectedImage(null);
    setImagePreview(null);
    setIsSynthetic(true);
    setScreeningResult(null);
    setErrorMsg('');
  };

  // 3. Trigger Screening Analysis
  const handleScreenClaim = async () => {
    if (!inputText.trim() && !selectedImage) {
      setErrorMsg('Please enter claim text or upload a packaging image.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      let res;

      if (selectedImage) {
        // Multipart Form-Data
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('text', inputText);
        formData.append('product_name', productName);
        formData.append('source_type', 'image_upload');
        formData.append('is_synthetic', isSynthetic ? 'true' : 'false');

        res = await fetch('/api/screen', {
          method: 'POST',
          body: formData,
        });
      } else {
        // JSON Payload
        res = await fetch('/api/screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_name: productName,
            text: inputText,
            source_type: isSynthetic ? 'synthetic_sample' : 'text_input',
            is_synthetic: isSynthetic,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setScreeningResult(data);
      setBackendOnline(true);
      // Reload recent cases table
      loadRecentCases();
    } catch (err) {
      console.error('Screening Error:', err);
      setErrorMsg(`Screening failed: ${err.message}. Please verify the Flask backend is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  };

  // 4. View a Case by ID from Recent Cases Table
  const handleSelectCaseById = async (caseId) => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveReportModal(data.case);
      }
    } catch (err) {
      console.error('Failed to load case:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        backendOnline={backendOnline}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg('')}
              className="font-bold underline ml-4 hover:text-red-950"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Switcher: Intelligence vs Screening */}
        {activeNav === 'intelligence' ? (
          <IntelligenceDashboard />
        ) : (
          <>
            {/* 1. Synthetic Demo Cases Carousel / Pills */}
            <DemoSamples
              samples={samples}
              onSelectSample={handleSelectSample}
              loading={loading}
            />

            {/* 2. Screening Input Component */}
            <ScreeningInput
              productName={productName}
              setProductName={setProductName}
              inputText={inputText}
              setInputText={setInputText}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              isSynthetic={isSynthetic}
              setIsSynthetic={setIsSynthetic}
              onScreen={handleScreenClaim}
              loading={loading}
            />

            {/* 3. Screening Results Card */}
            {screeningResult && (
              <ScreeningResult
                result={screeningResult}
                onOpenReport={(res) => setActiveReportModal(res)}
              />
            )}

            {/* 4. Recent Cases Table (SQLite History) */}
            <RecentCases
              cases={recentCases}
              onSelectCase={handleSelectCaseById}
              onRefresh={loadRecentCases}
              loading={loading}
            />
          </>
        )}
      </main>

      {/* 5. Printable Investigation Report Dossier Modal */}
      {activeReportModal && (
        <ReportModal
          caseData={activeReportModal}
          onClose={() => setActiveReportModal(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-700">
            BIS VerifyLens — Qubeathon PS01 Prototype
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Built with React, Vite, Python Flask, and SQLite. For demonstration and screening evaluation only.
          </p>
        </div>
      </footer>
    </div>
  );
}
