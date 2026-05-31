import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, confirmLabel = 'Delete', confirmClass = 'btn-danger' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-outline text-sm px-3 py-1.5">Cancel</button>
          <button onClick={onConfirm} className={`${confirmClass} text-sm px-3 py-1.5`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
