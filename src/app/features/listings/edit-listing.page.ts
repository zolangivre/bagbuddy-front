import { Component, computed, inject, signal } from '@angular/core';
import { FieldTree, FormField, form, min, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadErrorKey, loadErrorKey } from '../../core/api/load-error';
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
import { LoadError } from '../../shared/ui/load-error';
import { Loader } from '../../shared/ui/loader';
import { SubHeader } from '../../shared/ui/sub-header';
import { TextField } from '../../shared/ui/text-field';
import { T } from '../../shared/ui/t';

interface ListingForm {
  departure: string;
  arrival: string;
  departureDate: string;
  arrivalDate: string;
  /** Capacite totale : la capacite restante est decidee par le serveur. */
  totalKilos: number;
  pricePerKg: number;
  conditions: string;
}

/** Les poids sont des BigDecimal cote serveur : pas de 4.999999 kg a l'affichage. */
function roundKg(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Portage de app/edit-listing.js : creation et edition d'une annonce. */
@Component({
  selector: 'bb-edit-listing-page',
  imports: [
    T,
    SubHeader,
    IconButton,
    TextField,
    AirportInput,
    Button,
    Loader,
    LoadError,
    Icon,
    FormField,
  ],
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
    } @else if (loadError(); as error) {
      <div class="bb-page">
        <bb-load-error [messageKey]="error" (retry)="load()" />
      </div>
    } @else {
      <form class="bb-page content bb-with-rail bb-with-rail--aside" (submit)="save($event)">
        <div class="fields-column">
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

              <div class="row">
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
            </div>
          </section>

          <section class="bb-card">
            <h2 class="bb-card-title">
              <bb-icon name="weight" [size]="20" />
              {{ i18n.t('weight_and_pricing') }}
            </h2>

            <div class="row">
              <bb-text-field
                [formField]="listingForm.totalKilos"
                type="number"
                [label]="i18n.t('total_capacity_kilos')"
                placeholder="0"
                [hint]="capacityHint()"
                [error]="errorOf(listingForm.totalKilos)"
              />
              <bb-text-field
                [formField]="listingForm.pricePerKg"
                type="number"
                [label]="i18n.t('price_per_kg')"
                placeholder="0"
                [error]="errorOf(listingForm.pricePerKg)"
              />
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
        </div>

        <!--
          Recapitulatif collant : le total se met a jour pendant la saisie et
          reste visible avec le bouton d'envoi, au lieu d'etre en bas du
          formulaire comme sur mobile.
        -->
        <aside class="side bb-rail-sticky">
          <section class="summary">
            <h2 class="bb-card-title">{{ i18n.t('total_value') }}</h2>
            <strong class="bb-amount total">{{ currency.format(totals().total) }}</strong>
            <p class="bb-body-2 detail">
              {{ remaining() }} kg × {{ currency.format(model().pricePerKg) }}/kg
            </p>
            <p class="bb-body-3 detail">
              {{ i18n.t('fee') }} : {{ currency.format(totals().fee) }}
            </p>

            <bb-button type="submit" [disabled]="saving()">
              <bb-t
                [key]="listingId() ? 'update_listing' : 'create_listing'"
                [reserve]="['update_listing', 'create_listing']"
              />
            </bb-button>
          </section>

          <section class="tips">
            <h2 class="bb-card-title tips-title">
              <bb-icon name="luggage" [size]="20" />
              {{ i18n.t('listing_tips') }}
            </h2>
            <ul>
              <li><bb-icon name="clock" [size]="18" />{{ i18n.t('listing_tips_1') }}</li>
              <li><bb-icon name="users" [size]="18" />{{ i18n.t('listing_tips_2') }}</li>
              <li><bb-icon name="dollar-sign" [size]="18" />{{ i18n.t('listing_tips_3') }}</li>
            </ul>
          </section>
        </aside>
      </form>
    }
  `,
  styles: `
    .content {
      padding-top: 24px;
      padding-bottom: 48px;
    }

    .fields-column,
    .side {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px;
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
      flex-wrap: wrap;
      gap: 16px;
    }

    .summary {
      background: var(--bb-card);
      border-radius: var(--bb-radius);
      padding: 24px;
      box-shadow: var(--bb-shadow-card);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .summary h2 {
      margin: 0;
    }

    .total {
      color: var(--bb-primary);
    }

    .detail {
      margin: 0;
    }

    .summary bb-button {
      margin-top: 14px;
    }

    .tips {
      background: var(--bb-cyan-a10);
      border-radius: var(--bb-radius);
      padding: 24px;
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
      gap: 14px;
    }

    .tips li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: var(--bb-fs-body-2);
      color: var(--bb-text);
    }

    .tips li bb-icon {
      color: var(--bb-primary);
      flex: none;
      margin-top: 2px;
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
  protected readonly loadError = signal<LoadErrorKey | null>(null);
  protected readonly saving = signal(false);

  /** Capacites de l'annonce telle qu'enregistree ; null a la creation. */
  private readonly saved = signal<{ total: number; remaining: number } | null>(null);

  protected readonly model = signal<ListingForm>({
    departure: '',
    arrival: '',
    departureDate: '',
    arrivalDate: '',
    totalKilos: 0,
    pricePerKg: 0,
    conditions: '',
  });

  /** Poids deja accepte par le vendeur, que la capacite totale ne peut plus rendre. */
  private readonly reserved = computed(() => {
    const saved = this.saved();
    return saved ? roundKg(Math.max(saved.total - saved.remaining, 0)) : 0;
  });

  /**
   * Capacite restante telle que le serveur la calculera : la variation du total
   * reportee sur le restant, bornee entre 0 et le nouveau total. Le vendeur ne la
   * saisit plus — il pourrait sinon se recrediter le poids deja vendu.
   */
  protected readonly remaining = computed(() => {
    const total = Number(this.model().totalKilos) || 0;
    const saved = this.saved();
    if (!saved) return total;
    return roundKg(Math.min(Math.max(saved.remaining + total - saved.total, 0), total));
  });

  protected readonly capacityHint = computed(() =>
    this.reserved() > 0
      ? this.i18n.t('listing_capacity_hint', {
          reserved: this.reserved(),
          remaining: this.remaining(),
        })
      : null,
  );

  protected readonly listingForm = form(this.model, (path) => {
    required(path.departure, { message: this.i18n.t('error_departure_required') });
    required(path.arrival, { message: this.i18n.t('error_arrival_required') });
    required(path.departureDate, { message: this.i18n.t('error_departure_date_required') });
    required(path.arrivalDate, { message: this.i18n.t('error_arrival_date_required') });
    min(path.totalKilos, 0.1, { message: this.i18n.t('error_weight_required') });
    // Le serveur accepterait un total sous le reserve (le restant tomberait a 0),
    // mais l'annonce afficherait alors moins de capacite qu'elle n'en a vendu.
    validate(path.totalKilos, ({ value }) =>
      Number(value()) < this.reserved()
        ? {
            kind: 'below_reserved',
            message: this.i18n.t('error_capacity_below_reserved', { weight: this.reserved() }),
          }
        : null,
    );
    min(path.pricePerKg, 0.1, { message: this.i18n.t('error_price_required') });
  });

  /** Frais BagBuddy de 5 %, comme calculateTotal() du mobile, sur ce qui reste a vendre. */
  protected readonly totals = computed(() => {
    const { pricePerKg } = this.model();
    const subtotal = this.remaining() * (Number(pricePerKg) || 0);
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
    this.load();
  }

  /**
   * Sans etat d'erreur, un echec ici laissait le formulaire vide sous le titre
   * « Modifier l'annonce » — et l'enregistrer aurait ecrase l'annonce avec.
   */
  protected load(): void {
    const id = this.listingId();
    if (!id) return;
    this.loading.set(true);
    this.loadError.set(null);
    this.trips.byId(id).subscribe({
      next: (listing) => {
        this.saved.set({
          total: listing.totalWeightAvailable,
          remaining: listing.remainingWeight,
        });
        this.model.set({
          departure: listing.departureAirport,
          arrival: listing.arrivalAirport,
          departureDate: toDateTimeLocalValue(listing.departureDate),
          arrivalDate: toDateTimeLocalValue(listing.arrivalDate),
          totalKilos: listing.totalWeightAvailable,
          pricePerKg: listing.pricePerKg,
          conditions: listing.conditions ?? '',
        });
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(loadErrorKey(error));
        this.loading.set(false);
      },
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

  /**
   * L'identite du voyageur vient du jeton cote back : on ne transmet que les
   * champs libres du profil, que TripsService recopie dans `TripInput.profile`.
   */
  private createPayload(values: ListingForm) {
    const user = this.auth.userInfo();
    return {
      userInfo: user
        ? { sub: user.sub, bio: user.bio, location: user.location, phone: user.phone }
        : undefined,
      departureAirport: values.departure,
      arrivalAirport: values.arrival,
      departureDate: new Date(values.departureDate).toISOString(),
      arrivalDate: new Date(values.arrivalDate).toISOString(),
      totalWeightAvailable: Number(values.totalKilos),
      pricePerKg: Number(values.pricePerKg),
      conditions: values.conditions,
    };
  }

  /**
   * Seul le total part : le serveur y reporte lui-meme le poids deja reserve
   * (ce que faisait handleUpdateListing du mobile en envoyant les deux champs).
   */
  private updatePayload(values: ListingForm) {
    return {
      departureAirport: values.departure,
      arrivalAirport: values.arrival,
      departureDate: new Date(values.departureDate).toISOString(),
      arrivalDate: new Date(values.arrivalDate).toISOString(),
      totalWeightAvailable: Number(values.totalKilos),
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
