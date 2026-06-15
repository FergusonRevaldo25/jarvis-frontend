'use client';

import { useState } from 'react';

interface CodePreviewProps {
  generatedCode: any;
  previewUrl: string;
}

export default function CodePreview({ generatedCode, previewUrl }: CodePreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [selectedFile, setSelectedFile] = useState('');

  if (!generatedCode) {
    return (
      <div className="bg-black/60 border border-[#ff6a00]/20 rounded p-6 backdrop-blur h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-2 border-[#ff6a00]/10 mx-auto mb-6 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border border-[#ff6a00]/10 animate-spin"
              style={{ animationDuration: '8s' }}
            />
          </div>
          <p className="text-xs tracking-[0.3em] text-[#ff6a00]/30">AWAITING INPUT</p>
          <p className="text-[10px] text-[#ff6a00]/20 mt-2 tracking-[0.2em]">
            SPEAK A COMMAND TO BEGIN
          </p>
        </div>
      </div>
    );
  }

  const files = generatedCode.files || {};

  return (
    <div className="bg-black/60 border border-[#ff6a00]/20 rounded backdrop-blur h-full flex flex-col min-h-[400px]">
      {/* Toolbar */}
      <div className="border-b border-[#ff6a00]/20 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('preview')}
            className={`px-4 py-1 rounded text-[10px] tracking-[0.2em] transition-all ${
              viewMode === 'preview'
                ? 'bg-[#ff6a00]/10 border border-[#ff6a00]/40 text-[#ff6a00]'
                : 'text-[#ff6a00]/30 hover:text-[#ff6a00]/60'
            }`}
          >
            [ PREVIEW ]
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-4 py-1 rounded text-[10px] tracking-[0.2em] transition-all ${
              viewMode === 'code'
                ? 'bg-[#ff6a00]/10 border border-[#ff6a00]/40 text-[#ff6a00]'
                : 'text-[#ff6a00]/30 hover:text-[#ff6a00]/60'
            }`}
          >
            [ SOURCE ]
          </button>
        </div>
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] tracking-[0.2em] text-[#ff6a00]/40 hover:text-[#ff6a00]"
          >
            &gt; OPEN_
          </a>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'code' && (
          <div className="w-56 border-r border-[#ff6a00]/20 overflow-y-auto">
            {Object.keys(files).map((filename) => (
              <button
                key={filename}
                onClick={() => setSelectedFile(filename)}
                className={`w-full text-left px-3 py-2 text-[10px] tracking-[0.1em] font-mono truncate transition-all ${
                  selectedFile === filename
                    ? 'bg-[#ff6a00]/10 text-[#ff6a00] border-l-2 border-[#ff6a00]'
                    : 'text-[#ff6a00]/30 hover:text-[#ff6a00]/60 hover:bg-black/40'
                }`}
              >
                &gt; {filename}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {viewMode === 'preview' ? (
            <div className="p-4">
              <p className="text-[10px] tracking-[0.3em] text-[#ff6a00]/30 mb-4">RENDER OUTPUT</p>
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-96 border border-[#ff6a00]/20 rounded bg-black"
                  title="Preview"
                />
              ) : (
                <p className="text-[10px] text-[#ff6a00]/20 tracking-[0.2em]">
                  PREVIEW UNAVAILABLE — DEPLOY FIRST
                </p>
              )}
            </div>
          ) : (
            selectedFile && (
              <pre className="p-4 text-xs font-mono text-[#ff6a00]/70 overflow-auto h-full whitespace-pre-wrap"
                style={{ textShadow: '0 0 2px #ff6a00' }}
              >
                <code>{files[selectedFile]}</code>
              </pre>
            )
          )}
        </div>
      </div>
    </div>
  );
}