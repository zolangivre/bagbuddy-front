import { Component, computed, inject, input } from '@angular/core';
import { I18nService, TranslationKey } from '../../core/i18n/i18n.service';
import { TRANSACTION_STATUS } from '../../core/transaction-status';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';
import { Badge } from './badge';
import { T } from './t';

interface BadgeStyle {
  labelKey: TranslationKey;
  icon: IconName;
  color: string;
  background: string;
  border: string;
}

/**
 * Portage de components/StatusBadge.js — les couleurs viennent des cles
 * *_badge_background / *_badge_border de theme/Colors.js.
 */
const STYLES: Record<string, BadgeStyle> = {
  [TRANSACTION_STATUS.BROWSE_LISTING]: {
    labelKey: 'browse_listings',
    icon: 'plane',
    color: 'var(--bb-secondary)',
    background: 'var(--bb-dark-grey-a10)',
    border: 'var(--bb-dark-grey-a20)',
  },
  [TRANSACTION_STATUS.WAITING_FOR_RESPONSE_BUYER]: {
    labelKey: 'waiting_for_response',
    icon: 'clock',
    color: 'var(--bb-primary)',
    background: 'var(--bb-cyan-a10)',
    border: 'var(--bb-cyan-a20)',
  },
  [TRANSACTION_STATUS.WAITING_FOR_RESPONSE_SELLER]: {
    labelKey: 'waiting_for_response',
    icon: 'circle-x',
    color: 'var(--bb-error)',
    background: 'var(--bb-red-a10)',
    border: 'var(--bb-red-a20)',
  },
  [TRANSACTION_STATUS.REQUEST_REJECTED]: {
    labelKey: 'request_rejected',
    icon: 'circle-x',
    color: 'var(--bb-error)',
    background: 'var(--bb-red-a10)',
    border: 'var(--bb-red-a20)',
  },
  [TRANSACTION_STATUS.PAYMENT_REQUIRED]: {
    labelKey: 'payment_required',
    icon: 'credit-card',
    color: 'var(--bb-primary)',
    background: 'var(--bb-cyan-a10)',
    border: 'var(--bb-cyan-a20)',
  },
  [TRANSACTION_STATUS.CONFIRMED]: {
    labelKey: 'confirmed',
    icon: 'circle-check',
    color: 'var(--bb-success)',
    background: 'var(--bb-green-a10)',
    border: 'var(--bb-green-a20)',
  },
  [TRANSACTION_STATUS.COMPLETED]: {
    labelKey: 'completed',
    icon: 'circle-check',
    color: 'var(--bb-white)',
    background: 'var(--bb-success-strong)',
    border: 'var(--bb-green-a20)',
  },
  [TRANSACTION_STATUS.CANCELLED]: {
    labelKey: 'cancelled',
    icon: 'circle-x',
    color: 'var(--bb-error)',
    background: 'var(--bb-red-a10)',
    border: 'var(--bb-red-a20)',
  },
  [TRANSACTION_STATUS.RESERVATION_RECEIVED]: {
    labelKey: 'reservation_received',
    icon: 'circle-alert',
    color: 'var(--bb-warning)',
    background: 'var(--bb-yellow-a10)',
    border: 'var(--bb-yellow-a20)',
  },
  [TRANSACTION_STATUS.AWAITING_PAYMENT]: {
    labelKey: 'awaiting_payment',
    icon: 'clock',
    color: 'var(--bb-primary)',
    background: 'var(--bb-cyan-a10)',
    border: 'var(--bb-cyan-a20)',
  },
};

@Component({
  selector: 'bb-status-badge',
  imports: [T, Badge, Icon],
  template: `
    @if (style(); as s) {
      <bb-badge [background]="s.background" [borderColor]="s.border" [color]="s.color">
        <bb-icon [name]="s.icon" [size]="16" />
        <bb-t [key]="s.labelKey" />
      </bb-badge>
    }
  `,
})
export class StatusBadge {
  protected readonly i18n = inject(I18nService);
  readonly status = input<string | null | undefined>(null);
  protected readonly style = computed(() => {
    const status = this.status();
    return status ? (STYLES[status] ?? null) : null;
  });
}
