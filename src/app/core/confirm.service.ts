import { Service, signal } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  tone: 'primary' | 'error';
}

interface PendingConfirm extends ConfirmRequest {
  resolve: (confirmed: boolean) => void;
}

/**
 * Remplace Alert.alert du mobile : les pages demandent une confirmation ou
 * affichent un message, le rendu est fait par <bb-dialog-host> dans le shell.
 */
@Service()
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);
  readonly notice = signal<{ title: string; message: string } | null>(null);

  ask(request: ConfirmRequest): Promise<boolean> {
    return new Promise((resolve) => {
      this.pending.set({
        ...request,
        resolve: (confirmed) => {
          this.pending.set(null);
          resolve(confirmed);
        },
      });
    });
  }

  /** Message informatif simple (equivalent d'un Alert.alert a un bouton). */
  inform(title: string, message: string): void {
    this.notice.set({ title, message });
  }

  dismissNotice(): void {
    this.notice.set(null);
  }
}
