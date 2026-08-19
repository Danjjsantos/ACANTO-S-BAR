import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Camera, FileImage } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Foto do Produto (Dispositivo)',
  helperText = 'Selecione uma foto salva no seu computador ou tire uma foto pelo celular.',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (.jpg, .png, .webp, .heic)');
      return;
    }

    // Limit size check (10MB for base64 storage safety)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('A imagem selecionada é maior que 10MB. Tente uma menor.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <FileImage className="w-4 h-4 text-purple-600" />
          {label}
        </label>
        <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md uppercase">
          Apenas fotos do dispositivo
        </span>
      </div>

      {/* Hidden File Input for Device Files */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
            // Reset value so re-selecting same file triggers onChange
            e.target.value = '';
          }
        }}
      />

      {/* Image Preview Box if image exists */}
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-16/9 flex items-center justify-center">
          <img src={value} alt="Preview do Produto" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-white text-slate-900 text-xs font-extrabold rounded-xl shadow-md hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-purple-600" />
              Trocar Foto
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition cursor-pointer"
              title="Remover Foto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-extrabold px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
            <ImageIcon className="w-3 h-3 text-emerald-400" /> Foto Selecionada
          </span>
        </div>
      ) : (
        /* Dropzone / Upload area for device photo selection */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-purple-500 bg-purple-50 scale-[0.99]'
              : 'border-slate-300 hover:border-purple-400 bg-slate-50/80 hover:bg-purple-50/30'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
            <Upload className="w-5 h-5" />
          </div>
          <p className="font-extrabold text-xs text-slate-900">
            Adicionar Foto do Seu Dispositivo
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto font-medium">
            {helperText}
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-extrabold shadow-2xs">
            <Camera className="w-3.5 h-3.5" />
            <span>Escolher Foto (Celular / PC)</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] font-bold text-rose-600 mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

