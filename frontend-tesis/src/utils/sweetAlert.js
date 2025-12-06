import Swal from 'sweetalert2';

const colors = {
  primary: '#E53935',
  secondary: '#757575',
  success: '#2e7d32',
  error: '#c62828',
  warning: '#f57c00',
  info: '#0288d1',
  confirm: '#E53935',
  cancel: '#757575'
};

// Configuración base
const MySwal = Swal.mixin({
  customClass: {
    confirmButton: 'btn-confirm-swal',
    cancelButton: 'btn-cancel-swal',
    popup: 'popup-swal'
  },
  buttonsStyling: true,
  confirmButtonColor: colors.confirm,
  cancelButtonColor: colors.cancel,
});

export const showAlert = ({ title, text, icon = 'info', timer = null }) => {
  return MySwal.fire({
    title,
    text,
    icon,
    timer,
    timerProgressBar: !!timer,
    showConfirmButton: !timer,
    confirmButtonText: 'Entendido'
  });
};

export const showSuccess = (title, text = '') => {
  return MySwal.fire({
    title,
    text,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    timerProgressBar: true
  });
};

export const showError = (title, text = '') => {
  return MySwal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'Cerrar'
  });
};

export const showConfirm = async ({ title, text, confirmText = 'Sí, continuar', cancelText = 'Cancelar' }) => {
  const result = await MySwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true
  });
  return result.isConfirmed;
};

export const showToast = ({ title, icon = 'success' }) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  return Toast.fire({
    icon,
    title
  });
};

export default MySwal;
