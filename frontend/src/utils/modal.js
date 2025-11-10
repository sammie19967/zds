import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const SweetModal = withReactContent(Swal);

const base = SweetModal.mixin({
  confirmButtonColor: '#0066ff',
  cancelButtonColor: '#6b7280',
  reverseButtons: true,
  buttonsStyling: true,
  showClass: { popup: 'swal2-show' },
  hideClass: { popup: 'swal2-hide' },
});

// Normalize args to support:
//  - fire({ ...options })
//  - fire(title, text?, options?)
const normalizeArgs = (titleOrOptions, text, options) => {
  if (titleOrOptions && typeof titleOrOptions === 'object') {
    return { ...titleOrOptions };
  }
  return { title: titleOrOptions, ...(text ? { text } : {}), ...(options || {}) };
};

const make = (icon) => (titleOrOptions, text, options) => {
  const cfg = normalizeArgs(titleOrOptions, text, options);
  return base.fire({ icon, ...cfg });
};

const modal = {
  // Generic fire
  fire: (titleOrOptions, text, options) => base.fire(normalizeArgs(titleOrOptions, text, options)),

  // Icon helpers
  success: make('success'),
  error: make('error'),
  info: make('info'),
  warn: make('warning'),
  question: make('question'),

  // Confirm helper; supports object or positional params
  confirm: async (titleOrOptions, text, options) => {
    const cfg = normalizeArgs(titleOrOptions, text, options);
    const result = await base.fire({
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      ...cfg,
    });
    return result.isConfirmed;
  },

  // Toast helper (top-end by default)
  toast: (titleOrOptions, options) => {
    const cfg = normalizeArgs(titleOrOptions, undefined, options);
    return base.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      icon: cfg.icon || 'info',
      ...cfg,
    });
  },

  // Loading helper (blocks interaction, shows spinner)
  loading: (titleOrOptions, text) => {
    const cfg = normalizeArgs(titleOrOptions, text);
    return base.fire({
      title: cfg.title || 'Loading...',
      text: cfg.text || '',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      showCancelButton: false,
      didOpen: () => {
        SweetModal.showLoading();
      },
      ...cfg,
    });
  },
};

export default modal;
