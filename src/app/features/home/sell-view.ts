import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { Button } from '../../shared/ui/button';
import { HowStep } from '../../shared/ui/how-step';
import { RoundIcon } from '../../shared/ui/round-icon';

/** Portage de components/HomeSellView.js : onglet « vendre » de l'accueil. */
@Component({
  selector: 'bb-sell-view',
  imports: [Button, HowStep, RoundIcon, Icon],
  template: `
    <div class="stack">
      <section class="pitch">
        <bb-round-icon
          icon="dollar-sign"
          [size]="80"
          background="var(--bb-green-a10)"
          color="var(--bb-success)"
        />
        <h2 class="bb-card-status-title">{{ i18n.t('sell_weight_title') }}</h2>
        <p class="bb-body centered">{{ i18n.t('sell_weight_description') }}</p>
        <bb-button [text]="i18n.t('create_new_listing')" tone="success" (pressed)="createListing()">
          <bb-icon slot="left" name="plus" [size]="24" />
        </bb-button>
      </section>

      <section class="bb-card">
        <h2 class="bb-card-title centered">{{ i18n.t('how_selling_works') }}</h2>
        <div class="steps">
          <bb-how-step
            [number]="1"
            titleKey="list_your_flight"
            subtitleKey="add_your_flight_details"
          />
          <bb-how-step [number]="2" titleKey="get_requests" subtitleKey="travelers_will_send_you" />
          <bb-how-step
            [number]="3"
            titleKey="meet_and_earn"
            subtitleKey="meet_at_the_airport"
            color="var(--bb-success)"
            background="var(--bb-green-a10)"
          />
        </div>
      </section>
    </div>
  `,
  styles: `
    .stack {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .pitch {
      background: var(--bb-green-a10);
      border-radius: var(--bb-radius);
      padding: var(--bb-card-padding);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }

    h2 {
      margin: 0;
      color: var(--bb-success);
    }

    .centered {
      text-align: center;
    }

    .bb-card h2 {
      color: var(--bb-title);
      margin-bottom: 16px;
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `,
})
export class SellView {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  protected createListing(): void {
    void this.router.navigate(['/listings/new']);
  }
}
