import { Trash2 } from 'lucide-react';

interface Props {
  message: string;
  detail?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({ message, detail, confirmLabel = 'Delete', onConfirm, onCancel }: Props) => (
  <div className="confirm-overlay" onClick={onCancel}>
    <div className="confirm-box" onClick={e => e.stopPropagation()}>
      <h4>{message}</h4>
      <p>{detail ?? 'This action cannot be undone.'}</p>
      <div className="confirm-box-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button
          className="btn btn-danger"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
          onClick={() => { onConfirm(); onCancel(); }}
        >
          <Trash2 size={15} /> {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;
