import { Component, computed, inject, signal } from '@angular/core';
import { FieldTree, FormField, form, min, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { TripsService } from '../../core/api/trips.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { CurrencyService } from '../../core/currency.service';
import { toDateTimeLocalValue } from '../../core/format';
import { I18nService } from '../../core/i18n/i18n.service';
import { Icon } from '../../shared/icon/icon';
import { AirportInput } from '../../shared/ui/airport-input';
import { Button } from '../../shared/ui/button';
import { IconButton } from '../../shared/ui/icon-button';
import { Loader } from '../../shared/ui/loader';
import { SubHeader } from '../../shared/ui/sub-header';
import { TextField } from '../../shared/ui/text-field';

interface ListingForm {
  departure: string;
  arrival: string;
  departureDate: string;
  arrivalDate: string;
  availableKilos: number;
  pricePerKg: number;
  conditions: string;
}

/** Portage de app/edit-listing.js : creation et edition d'une annonce. */
@Component({
  selector: 'bb-edit-listing-page',
  imports: [SubHeader, IconButton, TextField, AirportInput, Button, Loader, Icon, FormField],
  template: `
    <bb-sub-header
      [title]="listingId() ? i18n.t('edit_listing') : i18n.t('create_new_listing')"
      (back)="goBack()"
    >
      @if (listingId()) {
        <bb-icon-button
          icon="trash-2"
          data-variant="danger"
          [iconSize]="24"
          [label]="i18n.t('delete_listing_action')"
          (pressed)="remove()"
        />
      }
    </bb-sub-header>

    @if (loading()) {
      <bb-loader [label]="i18n.t('loading')" />
    } @else {
      <form class="bb-page content" (submit)="save($event)">
        <section class="bb-card">
          <h2 class="bb-card-title">
            <bb-icon name="plane" [size]="20" />
            {{ i18n.t('flight_information') }}
          </h2>

          <div class="fields">
            <div class="row">
              <bb-airport-input
                [formField]="listingForm.departure"
                [label]="i18n.t('departure')"
                placeholder="JFK"
                [error]="errorOf(listingForm.departure)"
              />
              <bb-airport-input
                [formField]="listingForm.arrival"
                [label]="i18n.t('arrival')"
                placeholder="CDG"
                [error]="errorOf(listingForm.arrival)"
              />
            </div>

            <bb-text-field
              [formField]="listingForm.departureDate"
              type="datetime-local"
              [label]="i18n.t('flight_date_departure')"
              [error]="errorOf(listingForm.departureDate)"
            />
            <bb-text-field
              [formField]="listingForm.arrivalDate"
              type="datetime-local"
              [label]="i18n.t('flight_date_arrival')"
              [error]="arrivalDateError()"
            />
          </div>
        </section>

        <section class="bb-card">
          <h2 class="bb-card-title">
            <bb-icon name="weight" [size]="20" />
            {{ i18n.t('weight_and_pricing') }}
          </h2>

          <div class="fields">
            <div class="row">
              <bb-text-field
                [formField]="listingForm.availableKilos"
                type="number"
                [label]="i18n.t('available_kilos')"
                placeholder="0"
                [error]="errorOf(listingForm.availableKilos)"
              />
              <bb-text-field
                [formField]="listingForm.pricePerKg"
                type="number"
                [label]="i18n.t('price_per_kg')"
                placeholder="0"
                [error]="errorOf(listingForm.pricePerKg)"
              />
            </div>

            <div class="total">
              <div class="line">
                <span class="bb-body">{{ i18n.t('total_value') }}</span>
                <strong class="bb-number">{{ currency.format(totals().total) }}</strong>
              </div>
              <div class="line">
                <span class="bb-body-2">
                  {{ model().availableKilos }}kg × {{ currency.format(model().pricePerKg) }}/kg
                </span>
                <span class="bb-body-2">
                  {{ i18n.t('fee') }} : {{ currency.format(totals().fee) }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="bb-card">
          <h2 class="bb-card-title">
            <bb-icon name="file-text" [size]="20" />
            {{ i18n.t('conditions_and_notes') }}
          </h2>
          <bb-text-field
            [formField]="listingForm.conditions"
            [label]="i18n.t('special_conditions_optional')"
            [placeholder]="i18n.t('special_conditions_optional_placeholder')"
            [multiline]="true"
            [rows]="6"
          />
        </section>

        <section class="tips">
          <h2 class="bb-card-title tips-title">
            <bb-icon name="luggage" [size]="20" />
            {{ i18n.t('listing_tips') }}
          </h2>
          <ul>
            <li><bb-icon name="clock" [size]="20" />{{ i18n.t('listing_tips_1') }}</li>
            <li><bb-icon name="users" [size]="20" />{{ i18n.t('listing_tips_2') }}</li>
            <li><bb-icon name="dollar-sign" [size]="20" />{{ i18n.t('listing_tips_3') }}</li>
          </ul>
        </section>

        <bb-button
          type="submit"
          [text]="listingId() ? i18n.t('update_listing') : i18n.t('create_listing')"
          [disabled]="saving()"
        />
      </form>
    }
  `,
  styles: `
    .content {
      padding-top: 16px;
      padding-bottom: 40px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 720px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 15px;
    }

    h2 bb-icon {
      color: var(--bb-primary);
    }

    .fields {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .row {
      display: flex;
      gap: 12px;
    }

    .total {
      border-radius: var(--bb-radius);
      background: var(--bb-subtle);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .tips {
      background: var(--bb-cyan-a10);
      border-radius: var(--bb-radius);
      padding: var(--bb-card-padding);
    }

    .tips-title {
      color: var(--bb-primary);
    }

    .tips ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .tips li {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: var(--bb-fs-body-2);
    }

    .tips li bb-icon {
      color: var(--bb-primary);
      flex: none;
    }
  `,
})
export class EditListingPage {
  protected readonly i18n = inject(I18nService);
  protected readonly currency = inject(CurrencyService);
  private readonly trips = inject(TripsService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly listingId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  /** Poids deja vendu, conserve pour recalculer le total comme le mobile. */
  private readonly totalWeightAvailable = signal(0);
  private readonly remainingWeight = signal(0);

  protected readonly model = signal<ListingForm>({
    departure: '',
    arrival: '',
    departureDate: '',
    arrivalDate: '',
    availableKilos: 0,
    pricePerKg: 0,
    conditions: '',
  });

  protected readonly listingForm = form(this.model, (path) => {
    required(path.departure, { message: this.i18n.t('error_departure_required') });
    required(path.arrival, { message: this.i18n.t('error_arrival_required') });
    required(path.departureDate, { message: this.i18n.t('error_departure_date_required') });
    required(path.arrivalDate, { message: this.i18n.t('error_arrival_date_required') });
    min(path.availableKilos, 0.1, { message: this.i18n.t('error_weight_required') });
    min(path.pricePerKg, 0.1, { message: this.i18n.t('error_price_required') });
  });

  /** Frais BagBuddy de 5 %, comme calculateTotal() du mobile. */
  protected readonly totals = computed(() => {
    const { availableKilos, pricePerKg } = this.model();
    const subtotal = (Number(availableKilos) || 0) * (Number(pricePerKg) || 0);
    const fee = subtotal * 0.05;
    return { subtotal, fee, total: subtotal + fee };
  });

  /** L'arrivee ne peut pas preceder le depart (regle du mobile). */
  protected readonly arrivalDateError = computed(() => {
    const { departureDate, arrivalDate } = this.model();
    if (departureDate && arrivalDate && new Date(arrivalDate) < new Date(departureDate)) {
      return this.i18n.t('error_arrival_before_departure');
    }
    return this.errorOf(this.listingForm.arrivalDate);
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.listingId.set(id);
    this.loading.set(true);
    this.trips.byId(id).subscribe({
      next: (listing) => {
        this.totalWeightAvailable.set(listing.totalWeightAvailable);
        this.remainingWeight.set(listing.remainingWeight);
        this.model.set({
          departure: listing.departureAirport,
          arrival: listing.arrivalAirport,
          departureDate: toDateTimeLocalValue(listing.departureDate),
          arrivalDate: toDateTimeLocalValue(listing.arrivalDate),
          availableKilos: listing.remainingWeight,
          pricePerKg: listing.pricePerKg,
          conditions: listing.conditions ?? '',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected errorOf(field: FieldTree<unknown>): string | null {
    const state = field();
    if (!state.touched()) return null;
    return state.errors()[0]?.message ?? null;
  }

  protected save(event: Event): void {
    event.preventDefault();
    const state = this.listingForm();
    state.markAsTouched();

    const values = this.model();
    const datesInvalid =
      !!values.departureDate &&
      !!values.arrivalDate &&
      new Date(values.arrivalDate) < new Date(values.departureDate);

    if (!state.valid() || datesInvalid) {
      this.confirm.inform(this.i18n.t('error'), this.i18n.t('error_fields_required'));
      return;
    }

    const id = this.listingId();
    this.saving.set(true);
    if (id) {
      this.trips.update(id, this.updatePayload(values)).subscribe({
        next: () => this.done('listing_updated_successfully'),
        error: () => this.fail('error_updating_trip'),
      });
    } else {
      this.trips.create(this.createPayload(values)).subscribe({
        next: () => this.done('listing_created_successfully'),
        error: () => this.fail('error_creating_trip'),
      });
    }
  }

  private createPayload(values: ListingForm) {
    const user = this.auth.userInfo();
    return {
      userInfo: user ?? undefined,
      departureAirport: values.departure,
      arrivalAirport: values.arrival,
      departureDate: new Date(values.departureDate).toISOString(),
      arrivalDate: new Date(values.arrivalDate).toISOString(),
      totalWeightAvailable: Number(values.availableKilos),
      remainingWeight: Number(values.availableKilos),
      pricePerKg: Number(values.pricePerKg),
      conditions: values.conditions,
    };
  }

  /**
   * En edition, le poids deja reserve reste soustrait : on ne remet a plat le
   * total que si rien n'a encore ete vendu (meme regle que handleUpdateListing).
   */
  private updatePayload(values: ListingForm) {
    const sold = this.totalWeightAvailable() - this.remainingWeight();
    const newRemaining = Number(values.availableKilos);
    const newTotal = sold === 0 ? newRemaining : sold + newRemaining;

    return {
      departureAirport: values.departure,
      arrivalAirport: values.arrival,
      departureDate: new Date(values.departureDate).toISOString(),
      arrivalDate: new Date(values.arrivalDate).toISOString(),
      totalWeightAvailable: newTotal,
      remainingWeight: newRemaining,
      pricePerKg: Number(values.pricePerKg),
      conditions: values.conditions,
    };
  }

  protected async remove(): Promise<void> {
    const id = this.listingId();
    if (!id) return;

    const confirmed = await this.confirm.ask({
      title: this.i18n.t('confirm_delete_listing'),
      message: this.i18n.t('delete_warning'),
      confirmText: this.i18n.t('delete_listing_action'),
      cancelText: this.i18n.t('cancel_listing_action'),
      tone: 'error',
    });
    if (!confirmed) return;

    this.trips.remove(id).subscribe({
      next: () => this.done('listing_deleted_successfully'),
      error: () => this.fail('error_deleting_trip'),
    });
  }

  private done(messageKey: Parameters<I18nService['t']>[0]): void {
    this.saving.set(false);
    this.confirm.inform(this.i18n.t('success'), this.i18n.t(messageKey));
    void this.router.navigate(['/listings']);
  }

  private fail(messageKey: Parameters<I18nService['t']>[0]): void {
    this.saving.set(false);
    this.confirm.inform(this.i18n.t('error'), this.i18n.t(messageKey));
  }

  protected goBack(): void {
    history.length > 1 ? history.back() : void this.router.navigate(['/listings']);
  }
}
