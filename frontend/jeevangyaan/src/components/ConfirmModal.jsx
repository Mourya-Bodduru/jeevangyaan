import { useTranslation } from 'react-i18next';
import '../styles/ConfirmModal.css';
 
/**
 * ConfirmModal – reusable confirmation dialog.
 *
 * Props:
 *  isOpen      – boolean, controls visibility
 *  title       – string, modal heading
 *  message     – string | node, body text
 *  confirmText – string (default "Confirm")
 *  cancelText  – string (default "Cancel")
 *  variant     – 'danger' | 'warning' (default 'danger')
 *  icon        – emoji/string shown above the title
 *  onConfirm   – function called when user clicks the confirm button
 *  onCancel    – function called when user cancels or closes
 */
const ConfirmModal = ({
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    variant = 'danger',
    icon,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();
    
    if (!isOpen) return null;
 
    const modalTitle = title || t("Are you sure?");
    const modalConfirmText = confirmText || t("Confirm Default");
    const modalCancelText = cancelText || t("Cancel Default");

    return (
        <div className="cm-overlay" onClick={onCancel} role="dialog" aria-modal="true">
            <div
                className={`cm-dialog cm-${variant}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                {icon && <div className="cm-icon">{icon}</div>}

                {/* Content */}
                <h3 className="cm-title">{modalTitle}</h3>
                {message && <p className="cm-message">{message}</p>}
 
                {/* Actions */}
                <div className="cm-actions">
                    <button className="cm-btn cm-btn-cancel" onClick={onCancel}>
                        {modalCancelText}
                    </button>
                    <button className={`cm-btn cm-btn-confirm cm-btn-${variant}`} onClick={onConfirm}>
                        {modalConfirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
