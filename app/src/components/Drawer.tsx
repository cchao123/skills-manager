import { useEffect, ReactNode } from 'react';
import { Icon } from '@/components/Icon';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  width?: string;
  showCloseButton?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  title,
  width = '90vw',
  showCloseButton = true,
}) => {
  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm flex items-center justify-end"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-dark-bg-card shadow-2xl h-screen overflow-hidden flex flex-col animate-slide-in-right`}
        style={{ width: width === '100vw' ? '100vw' : width, maxWidth: width === '100vw' ? undefined : '1400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
              >
                <Icon name="close" className="text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};
