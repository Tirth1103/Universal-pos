import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { usePOS } from '../context/POSContext';

const Toast = ({ toast }) => {
  const { theme } = usePOS();
  const isLight = theme === 'light';

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className={`w-5 h-5 ${isLight ? 'text-[#072618]' : 'text-amber-400'}`} />
  };

  const bgStyles = isLight ? {
    success: 'bg-[#f8eed1]/95 border-emerald-600 text-[#051f14] shadow-xl',
    warning: 'bg-[#f8eed1]/95 border-amber-600 text-[#051f14] shadow-xl',
    error: 'bg-[#f8eed1]/95 border-rose-600 text-[#051f14] shadow-xl',
    info: 'bg-[#f8eed1]/95 border-[#c8a74e] text-[#051f14] shadow-xl'
  } : {
    success: 'bg-[#09251a]/95 border-emerald-500/40 text-[#fef3c7] shadow-2xl',
    warning: 'bg-[#09251a]/95 border-amber-500/40 text-[#fef3c7] shadow-2xl',
    error: 'bg-[#09251a]/95 border-rose-500/40 text-[#fef3c7] shadow-2xl',
    info: 'bg-[#09251a]/95 border-[#144833] text-[#fde047] shadow-2xl'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg ${bgStyles[toast.type] || bgStyles.info}`}>
        {icons[toast.type] || icons.info}
        <span className="text-sm font-semibold">{toast.message}</span>
      </div>
    </div>
  );
};

export default Toast;
