/**
 * login-page.js
 * Game Hub — Login & Registration Page Controller
 */

import {
  loginWithEmail,
  registerWithEmail,
  sendResetEmail,
  subscribeToAuth,
} from './auth.js';

// DOM elements
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const bannerError = document.getElementById('banner-error');
const bannerSuccess = document.getElementById('banner-success');

// Forgot password modal
const linkForgotPassword = document.getElementById('link-forgot-password');
const modalForgotPassword = document.getElementById('modal-forgot-password');
const btnCloseModal = document.getElementById('btn-close-modal');
const formForgotPassword = document.getElementById('form-forgot-password');
const modalBanner = document.getElementById('modal-banner');

// Redirect helper
function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || 'dashboard.html';
}

// Banner feedback helpers
function showError(message) {
  if (!bannerError) return;
  bannerError.textContent = message;
  bannerError.classList.add('show', 'error');
  bannerError.classList.remove('success');
  if (bannerSuccess) bannerSuccess.classList.remove('show');
}

function showSuccess(message) {
  if (!bannerSuccess) return;
  bannerSuccess.textContent = message;
  bannerSuccess.classList.add('show', 'success');
  bannerSuccess.classList.remove('error');
  if (bannerError) bannerError.classList.remove('show');
}

function clearBanners() {
  if (bannerError) {
    bannerError.textContent = '';
    bannerError.classList.remove('show', 'error');
  }
  if (bannerSuccess) {
    bannerSuccess.textContent = '';
    bannerSuccess.classList.remove('show', 'success');
  }
}

// User-friendly Firebase error mapping
function mapAuthError(err) {
  const code = err.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Некорректный формат адреса электронной почты.';
    case 'auth/user-disabled':
      return 'Этот аккаунт отключен администратором.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Неверный email или пароль.';
    case 'auth/email-already-in-use':
      return 'Пользователь с таким email уже зарегистрирован.';
    case 'auth/weak-password':
      return 'Слишком простой пароль. Используйте не менее 6 символов.';
    case 'auth/popup-closed-by-user':
      return 'Окно входа Google было закрыто до завершения.';
    case 'auth/popup-blocked':
      return 'Всплывающее окно заблокировано браузером. Разрешите всплывающие окна.';
    case 'auth/too-many-requests':
      return 'Слишком много попыток входа. Пожалуйста, подождите немного.';
    default:
      return err.message || 'Произошла ошибка при аутентификации. Попробуйте снова.';
  }
}

// Set button loading state
function setButtonLoading(btn, isLoading, defaultText) {
  if (!btn) return;
  btn.disabled = isLoading;
  btn.textContent = isLoading ? 'Подождите...' : defaultText;
}

// Tab Switching
function switchTab(mode) {
  clearBanners();
  if (mode === 'register') {
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    formLogin.style.display = 'none';
    formRegister.style.display = 'block';
  } else {
    tabRegister.classList.remove('active');
    tabLogin.classList.add('active');
    formRegister.style.display = 'none';
    formLogin.style.display = 'block';
  }
}

tabLogin?.addEventListener('click', () => switchTab('login'));
tabRegister?.addEventListener('click', () => switchTab('register'));

// Login with Email/Password
formLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearBanners();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const submitBtn = formLogin.querySelector('button[type="submit"]');

  if (!email || !password) {
    showError('Заполните все поля для входа.');
    return;
  }

  setButtonLoading(submitBtn, true, 'Войти');
  try {
    await loginWithEmail(email, password);
    showSuccess('Вход выполнен успешно. Перенаправление...');
    setTimeout(() => {
      window.location.href = getRedirectUrl();
    }, 600);
  } catch (err) {
    showError(mapAuthError(err));
    setButtonLoading(submitBtn, false, 'Войти');
  }
});

// Register with Email/Password
formRegister?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearBanners();

  const displayName = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const passwordConfirm = document.getElementById('register-password-confirm').value;
  const submitBtn = formRegister.querySelector('button[type="submit"]');

  if (!displayName || !email || !password || !passwordConfirm) {
    showError('Заполните все обязательные поля.');
    return;
  }

  if (password.length < 6) {
    showError('Пароль должен содержать минимум 6 символов.');
    return;
  }

  if (password !== passwordConfirm) {
    showError('Введенные пароли не совпадают.');
    return;
  }

  setButtonLoading(submitBtn, true, 'Зарегистрироваться');
  try {
    await registerWithEmail(email, password, displayName);
    showSuccess('Регистрация завершена! Создаем ваш профиль...');
    setTimeout(() => {
      window.location.href = getRedirectUrl();
    }, 800);
  } catch (err) {
    showError(mapAuthError(err));
    setButtonLoading(submitBtn, false, 'Зарегистрироваться');
  }
});

// Forgot Password Flow
linkForgotPassword?.addEventListener('click', (e) => {
  e.preventDefault();
  if (modalForgotPassword) {
    modalForgotPassword.classList.add('open');
    if (modalBanner) modalBanner.classList.remove('show');
    // Pre-fill email from login form if already entered
    const currentEmail = document.getElementById('login-email')?.value;
    const resetInput = document.getElementById('reset-email');
    if (currentEmail && resetInput) {
      resetInput.value = currentEmail;
    }
  }
});

btnCloseModal?.addEventListener('click', () => {
  modalForgotPassword?.classList.remove('open');
});

modalForgotPassword?.addEventListener('click', (e) => {
  if (e.target === modalForgotPassword) {
    modalForgotPassword.classList.remove('open');
  }
});

formForgotPassword?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const emailInput = document.getElementById('reset-email');
  const email = emailInput?.value.trim();
  const submitBtn = formForgotPassword.querySelector('button[type="submit"]');

  if (!email) {
    if (modalBanner) {
      modalBanner.textContent = 'Пожалуйста, укажите email адрес.';
      modalBanner.classList.add('show', 'error');
      modalBanner.classList.remove('success');
    }
    return;
  }

  setButtonLoading(submitBtn, true, 'Отправка...');
  try {
    await sendResetEmail(email);
    if (modalBanner) {
      modalBanner.textContent = `Письмо для сброса пароля отправлено на адрес ${email}. Проверьте почту.`;
      modalBanner.classList.add('show', 'success');
      modalBanner.classList.remove('error');
    }
    setButtonLoading(submitBtn, false, 'Отправить ссылку');
  } catch (err) {
    if (modalBanner) {
      modalBanner.textContent = mapAuthError(err);
      modalBanner.classList.add('show', 'error');
      modalBanner.classList.remove('success');
    }
    setButtonLoading(submitBtn, false, 'Отправить ссылку');
  }
});

// Check if already authenticated — if so, auto-redirect to dashboard
subscribeToAuth(({ user }) => {
  if (user) {
    // Already logged in, no need to show login page
    window.location.replace(getRedirectUrl());
  }
});
