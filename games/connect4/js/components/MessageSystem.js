export class MessageSystem {
  constructor() {
    this.messageContainer = document.createElement('div');
    this.messageContainer.className = 'message-system';
    document.body.appendChild(this.messageContainer);
  }

  showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    this.messageContainer.appendChild(messageElement);

    setTimeout(() => {
      messageElement.remove();
    }, 3000);
  }
}
