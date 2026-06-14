let container: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!container) {
    container = document.createElement('div');
    container.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:99999',
      'display:flex', 'flex-direction:column-reverse', 'gap:10px', 'pointer-events:none',
      'max-width:380px', 'width:calc(100% - 48px)'
    ].join(';');
    document.body.appendChild(container);
  }
  return container;
}

type ToastType = 'success' | 'error' | 'info' | 'warning';

const STYLES: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', icon: '✓', iconColor: '#10b981' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  icon: '✕', iconColor: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', icon: '⚠', iconColor: '#f59e0b' },
  info:    { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)', icon: 'ℹ', iconColor: '#38bdf8' },
};

export function toast(message: string, type: ToastType = 'info', duration = 3500) {
  const s = STYLES[type];
  const el = document.createElement('div');
  el.style.cssText = [
    'pointer-events:auto', 'display:flex', 'align-items:flex-start', 'gap:12px',
    `background:${s.bg}`, `border:1px solid ${s.border}`,
    'backdrop-filter:blur(20px)', '-webkit-backdrop-filter:blur(20px)',
    'border-radius:14px', 'padding:14px 16px',
    "font-family:Outfit,system-ui,sans-serif", 'font-size:14px', 'color:#f8fafc',
    'box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.05) inset',
    'opacity:0', 'transform:translateX(24px) scale(0.96)',
    'transition:all 0.35s cubic-bezier(0.16,1,0.3,1)', 'cursor:pointer', 'user-select:none'
  ].join(';');

  const icon = document.createElement('div');
  icon.style.cssText = `font-size:16px;font-weight:800;color:${s.iconColor};flex-shrink:0;line-height:1.4;width:20px;text-align:center`;
  icon.textContent = s.icon;

  const text = document.createElement('span');
  text.style.cssText = 'flex:1;line-height:1.5;padding-top:1px';
  text.textContent = message;

  el.appendChild(icon);
  el.appendChild(text);
  getContainer().appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(0) scale(1)';
  });

  const dismiss = () => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(24px) scale(0.96)';
    setTimeout(() => el.remove(), 350);
  };

  const timer = setTimeout(dismiss, duration);
  el.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
}
