export class ModalManager {
  constructor() {
    this.modals = {};
  }

  registerModal(modalId, openBtnId, closeBtnId) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);

    if (modal && openBtn && closeBtn) {
      this.modals[modalId] = { modal, openBtn, closeBtn };
      openBtn.addEventListener('click', () => this.showModal(modalId));
      closeBtn.addEventListener('click', () => this.hideModal(modalId));
      modal.addEventListener('click', (e) => {
        if (e.target.id === modalId) {
          this.hideModal(modalId);
        }
      });
    }
  }

  showModal(modalId) {
    const modalData = this.modals[modalId];
    if (modalData) {
      modalData.modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  hideModal(modalId) {
    const modalData = this.modals[modalId];
    if (modalData) {
      modalData.modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  toggleModal(modalId) {
    const modalData = this.modals[modalId];
    if (modalData) {
      if (modalData.modal.classList.contains('hidden')) {
        this.showModal(modalId);
      } else {
        this.hideModal(modalId);
      }
    }
  }
}
