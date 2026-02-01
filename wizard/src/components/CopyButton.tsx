import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';

interface CopyButtonProps {
  onClick: () => void;
  copied: boolean;
  label?: string;
  'aria-label'?: string;
}

export function CopyButton({ onClick, copied, label, 'aria-label': ariaLabel }: CopyButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || (copied ? 'Copied to clipboard' : 'Copy to clipboard')}
      className="inline-flex items-center px-4 py-2 border border-white/20 text-xs font-medium rounded-lg text-white/70 bg-white/5 hover:bg-white/10 hover:text-white transition-all"
    >
      <ClipboardDocumentIcon className="w-4 h-4 mr-2" aria-hidden="true" />
      {label || (copied ? 'Copied!' : 'Copy')}
    </button>
  );
}
