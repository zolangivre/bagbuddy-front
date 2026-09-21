import { en } from './en';

// Repris tel quel de l'app mobile BagBuddy (i18n/translations/fr.js).
// Les cles doivent rester identiques entre en et fr.

export const fr: Record<keyof typeof en, string> = {
  //Navigation
  home: 'Accueil',
  transactions: 'Transactions',
  profile: 'Profil',

  //Start screen
  start_subtitle: 'Transformez vos kilos en argent',
  start_description: 'Partagez votre bagage intelligemment',
  feature_one_title: 'Même vol',
  feature_one_description: 'Donnez vous rendez-vous',
  feature_two_title: 'Prix équitable',
  feature_two_description: 'Tarifs du marché',
  feature_three_title: 'Sécurisé',
  feature_three_description: 'Utilisateurs vérifiés',
  how_card_title: 'Comment ça marche',
  step_one_title: 'Parcourez ou publiez',
  step_one_description: 'Vérifiez votre poids ou votre espace libre',
  step_two_title: 'Connectez-vous et acceptez',
  step_two_description: 'Discutez et validez les détails',
  step_three_title: 'Rencontrer et échanger',
  step_three_description: 'Retrouvez-vous et concluez l’accord',
  start_button: 'Commencez votre voyage',

  //Home screen
  welcome_back: 'Bon retour, {{name}}!',
  find_luggage_space: 'Trouvez de la place ou gagnez avec votre poids en trop',
  active_routes: 'Trajets actifs',
  available: 'disponible',
  avg_price: 'Prix moyen',
  search_placeholder: 'Recherchez des kilos...',
  buy_weight: 'Acheter des kilos',
  sell_weight: 'Vendre des kilos',
  available_weight: 'Poids disponible',
  price_per_kg: 'Prix par kg',
  total_for: 'Total pour',
  departure: 'Départ',
  arrival: 'Arrivée',
  reserve_weight: 'Réserver des kilos',
  view_your_listings: 'Voir vos annonces',
  sell_weight_title: 'Transformez vos kilos en argent',
  sell_weight_description:
    "Avez-vous un excédent de poids sur votre vol à venir ? Listez-le ici et gagnez de l'argent en aidant d'autres voyageurs.",
  create_new_listing: 'Créer une nouvelle annonce',
  how_selling_works: 'Comment fonctionne la vente',
  list_your_flight: 'Listez votre vol',
  add_your_flight_details: 'Ajoutez les détails de votre vol et le poids disponible',
  get_requests: 'Recevoir des demandes',
  travelers_will_send_you: 'Les voyageurs vous enverront des demandes de réservation',
  meet_and_earn: 'Rencontrez et gagnez',
  meet_at_the_airport: "Rencontrez-vous à l'aéroport et soyez payé instantanément",
  listed_on: 'Publié le',
  created_on: 'Créé le',

  //Transactions screen
  transactions_title: 'Transactions',
  transactions_subtitle: 'Gérer vos échanges de poids',
  active: 'Actif',
  completed: 'Terminé',
  total_earned: 'Total gagné',
  total_spent: 'Total dépensé',
  rate: 'Taux',
  total: 'Total',
  buying: 'Achat',
  selling: 'Vente',
  no_active_transactions: 'Aucune transaction active trouvée.',
  no_completed_transactions: 'Aucune transaction terminée trouvée.',
  no_results_found: 'Aucun résultat trouvé.',

  //Profile
  overview: 'Aperçu',
  listings: 'Annonces',
  settings: 'Paramètre',
  manage_your_account: 'Gérer votre compte',
  recent_transactions: 'Transactions récentes',
  view_all: 'Voir tout',
  transactions_1: 'transactions',
  verified: 'Vérifié',
  not_verified: 'Non vérifié',
  active_listings: 'Annonces',
  new_listing: 'Nouvelle annonce',
  dark_mode: 'Mode sombre',
  toggle_dark_mode: 'Activer/désactiver le mode sombre',
  change_language: 'Changer de langue',
  change_currency: 'Changer de devise',
  log_out: 'Déconnexion',
  are_you_sure_you_want_to_log_out: 'Êtes-vous sûr de vouloir vous déconnecter ?',
  reviews: 'Avis',
  no_active_listings: 'Aucune annonce active trouvée.',

  //Edit Profile
  edit_profile: 'Modifier le profil',
  personal_information: 'Informations personnelles',
  first_name: 'Prénom',
  first_name_placeholder: 'Entrez votre prénom',
  last_name: 'Nom',
  last_name_placeholder: 'Entrez votre nom',
  email: 'Email',
  email_placeholder: 'Entrez votre email',
  phone_number: 'Numéro de téléphone',
  phone_number_placeholder: 'Entrez votre numéro de téléphone',
  location: 'Localisation',
  location_placeholder: 'Entrez votre localisation',
  bio: 'Bio',
  bio_placeholder: 'Entrez votre bio',
  save_changes: 'Enregistrer les modifications',

  //Create Edit Listing
  edit_listing: "Modifier l'annonce",
  flight_information: 'Informations sur le vol',
  flight_number: 'Numéro de vol',
  flight_number_placeholder: 'Entrez le numéro de vol',
  flight_date_placeholder_departure: 'Sélectionnez la date de vol de départ',
  flight_date_placeholder_arrival: "Sélectionnez la date de vol d'arrivée",
  flight_date_placeholder: 'Sélectionnez la date de vol',
  weight_and_pricing: 'Poids & tarification',
  available_kilos: 'Kilos disponibles',
  total_capacity_kilos: 'Capacité totale (kg)',
  listing_capacity_hint: '{{reserved}} kg déjà réservés · {{remaining}} kg encore disponibles',
  price_per_kilo: 'Prix par kilo',
  total_value: 'Valeur totale',
  fee: 'Frais',
  conditions_and_notes: 'Conditions & notes',
  special_conditions_optional: 'Conditions spéciales (facultatif)',
  special_conditions_optional_placeholder:
    "Rencontrer au comptoir d'enregistrement, pas d'objets fragiles, paiement en espèces préféré...",
  listing_tips: "Conseils pour l'annonce",
  listing_tips_1: 'Listez votre poids au moins 24 heures avant votre vol.',
  listing_tips_2: 'Soyez précis sur le lieu de rencontre et le mode de paiement.',
  listing_tips_3: 'Vérifiez les tarifs du marché actuels pour votre itinéraire.',
  update_listing: "Mettre à jour l'annonce",
  create_listing: "Créer l'annonce",
  close: 'Fermer',
  confirm: 'Confirmer',
  search_airport: 'Rechercher un aéroport...',
  flight_date_departure: 'Date de vol de départ',
  flight_date_arrival: "Date de vol d'arrivée",
  confirm_delete_listing: 'Êtes-vous sûr de vouloir supprimer cette annonce ?',
  delete_warning: 'Cette action est irréversible.',
  delete_listing_action: "Supprimer l'annonce",
  cancel_listing_action: 'Annuler',
  listing_deleted_successfully: 'Annonce supprimée avec succès.',
  error_deleting_trip: "Erreur lors de la suppression de l'annonce.",
  error_updating_trip: "Erreur lors de la mise à jour de l'annonce.",

  //Status
  browse_listings: 'Parcourir les annonces',
  waiting_for_response: 'En attente',
  request_rejected: 'Refusée',
  payment_required: 'Paiement requis',
  reservation_received: 'Réservation reçue',
  awaiting_payment: 'En attente de paiement',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  all_statuses: 'Tout les statuts',

  //Transaction Details
  flight: 'Vol',
  transaction_progress: 'Progression de la transaction',
  seller: 'Vendeur',
  buyer: 'Acheteur',
  cancel_transaction: 'Annuler la transaction',
  send_reservation_request: 'Envoyer une demande de réservation',
  send_new_request: 'Envoyer une nouvelle demande',

  //Transaction progress steps for seller
  step_one_title_seller: 'Réservation reçue',
  step_one_description_seller: 'Demande reçue. Vérifiez-la.',
  step_two_title_seller: 'En attente de paiement',
  step_two_description_seller: 'Approuvé. Paiement en attente.',
  step_three_title_seller: 'Terminée',
  step_three_description_seller: 'Transaction réussie.',

  //Transaction progress steps for buyer
  step_one_title_buyer: 'Parcourir les annonces',
  step_one_description_buyer: 'Trouvez le bon poids.',
  step_two_title_buyer: 'En attente du vendeur',
  step_two_description_buyer: 'Demande envoyée, réponse à venir.',
  step_three_title_buyer: 'Paiement',
  step_three_description_buyer: 'Approuvé. Effectuez votre paiement.',
  step_four_title_buyer: 'Terminée',
  step_four_description_buyer: 'Transaction réussie !',

  //Weight Selector Card
  select_weight_to_approve: 'Sélectionner le poids à approuver',
  select_weight_to_approve_description:
    'Choisissez combien de kilogrammes vous souhaitez approuver pour cette demande (max {{weight}} disponible).',

  //Status Card
  awaiting_payment_title: 'En attente de paiement',
  awaiting_payment_description:
    'Vous avez approuvé la demande. En attente du paiement de {{buyer}}.',
  approved_weight: 'Poids approuvé',
  expected_payment: 'Paiement attendu',
  browse_listings_title: 'Prêt à réserver du poids ?',
  browse_listings_description: 'Envoyez une demande pour réserver un espace de bagage.',
  kilograms: 'kilos',
  price: 'Prix',
  waiting_for_response_title: 'En attente du vendeur',
  waiting_for_response_description:
    'Votre demande a été envoyée à {{seller}}. Vous serez notifié dès sa réponse.',
  requested_weight: 'Poids demandé',
  request_rejected_title: 'Demande refusée',
  request_rejected_description: '{{seller}} a refusé votre demande pour {{weight}}.',
  reject_request: 'Poids refusé',
  try_a_different_amount: 'Essayer un autre poids',
  try_a_different_amount_description:
    'Peut-être que {{seller}} accepterait un poids différent. Essayez d’envoyer une nouvelle demande.',
  payment_required_title: 'Demande approuvée !',
  payment_required_description:
    '{{seller}} a approuvé {{weight}}. Payez pour continuer la transaction.',
  total_amount: 'Montant total',
  complete_payment: 'Effectuer le paiement',
  reservation_received_title: 'Nouvelle réservation reçue',
  reservation_received_description:
    '{{buyer}} souhaite réserver {{weight}}. Choisissez combien approuver.',
  accept_request: 'Accepter la demande',
  decline_request: 'Refuser la demande',
  confirmed_title_buyer: 'Poids réservé avec succès !',
  confirmed_title_seller: 'Paiement reçu !',
  confirmed_description_buyer:
    'Votre réservation de poids est confirmée. Voici les détails du rendez-vous.',
  confirmed_description_seller: 'Super ! Voici les détails du rendez-vous à l’aéroport.',
  total_paid: 'Total payé',
  amount_received: 'Montant reçu',
  meeting_details: 'Détails du rendez-vous',
  meeting_details_step_one: 'Comptoir d’enregistrement',
  meeting_details_step_two: '{{date}}',
  meeting_details_step_two_description: 'Arrivez avant {{time}}',
  meeting_details_step_three: '{{weight}} réservé',
  conditions: 'Conditions',
  mark_as_completed: 'Marquer comme terminé',
  completed_title: 'Transaction terminée !',
  completed_description:
    'Félicitations ! Votre réservation de poids a été effectuée avec succès. Merci d’utiliser BagBuddy.',
  transaction_total: 'Total de la transaction',
  cancelled_title: 'Transaction annulée',
  cancelled_description:
    "Cette transaction a été annulée. Ne vous inquiétez pas, il y a beaucoup d'autres opportunités !",
  weight_reserved: '{{weight}} réservé',
  arrive_by: 'Arrivez avant {{time}}',

  //Modal
  cancel_transaction_modal_title: 'Voulez-vous annuler cette transaction ?',
  cancel_transaction_modal_message: 'Cette action est irréversible.',
  cancel_transaction_modal_cancel: 'Annuler',
  cancel_transaction_modal_confirm: 'Confirmer',

  //Errors
  error: 'Erreur',
  success: 'Succès',
  error_fields_required: 'Veuillez remplir tous les champs obligatoires.',
  error_departure_required: 'Le champ départ est obligatoire.',
  error_arrival_required: 'Le champ arrivée est obligatoire.',
  error_departure_date_required: 'La date de départ est obligatoire.',
  error_arrival_date_required: "La date d'arrivée est obligatoire.",
  error_arrival_before_departure:
    "La date d'arrivée ne peut pas être antérieure à la date de départ.",
  error_weight_required: 'Le poids disponible est obligatoire.',
  error_capacity_below_reserved:
    '{{weight}} kg sont déjà réservés : la capacité ne peut pas descendre en dessous.',
  error_price_required: 'Le prix par kilo est obligatoire.',
  listing_updated_successfully: 'Annonce mise à jour avec succès.',
  listing_created_successfully: 'Annonce créée avec succès.',
  error_creating_trip: "Erreur lors de la création de l'annonce.",
  reservation_request_error_message:
    "Une erreur est survenue lors de l'envoi de votre demande de réservation. Veuillez réessayer plus tard.",
  of: 'sur',
  error_no_rating: 'Veuillez sélectionner une note.',
  error_no_comment: 'Le commentaire ne peut pas être vide.',

  //Filters
  filters: 'Filtres',
  apply_filters: 'Appliquer',
  clear: 'Effacer',
  price_range: 'Plage de prix',
  weight_range: 'Plage de poids',
  from: 'De',
  to: 'À',
  origin: 'Origine',
  destination: 'Destination',

  //Alert
  reservation_request_sent_title: 'Demande envoyée',
  reservation_request_sent_message: 'Votre demande de réservation a été envoyée avec succès.',
  request_accepted_title: 'Demande acceptée',
  request_accepted_message: 'Vous avez accepté la demande de réservation.',
  request_accepted_error_message:
    "Une erreur est survenue lors de l'acceptation de la demande de réservation. Veuillez réessayer plus tard.",
  request_declined_title: 'Demande refusée',
  request_declined_message: 'Vous avez refusé la demande de réservation.',
  request_declined_description:
    'Vous avez refusé la demande de {{buyer}} pour {{weight}}. Une nouvelle demande reste possible.',
  request_declined_error_message:
    'Une erreur est survenue lors du refus de la demande de réservation. Veuillez réessayer plus tard.',
  payment_completed_title: 'Paiement effectué',
  payment_completed_message: 'Le paiement a été effectué avec succès.',
  payment_completed_error_message:
    'Une erreur est survenue lors du paiement. Veuillez réessayer plus tard.',
  cancel_transaction_title: 'Transaction annulée',
  cancel_transaction_message: 'Cette transaction a été annulée avec succès.',
  cancel_transaction_error_message:
    "Une erreur est survenue lors de l'annulation de la transaction.",
  confirmed_completed_title: 'Transaction terminée',
  confirmed_completed_message: 'La transaction a été marquée comme terminée avec succès.',
  confirmed_completed_error_message:
    'Une erreur est survenue lors du marquage de la transaction comme terminée. Veuillez réessayer plus tard.',
  review_submitted_title: 'Avis soumis',
  review_submitted_message: 'Votre avis a été soumis avec succès.',
  review_submitted_error_message:
    'Une erreur est survenue lors de la soumission de votre avis. Veuillez réessayer plus tard.',
  review_updated_title: 'Avis mis à jour',
  review_updated_message: 'Votre avis a été mis à jour avec succès.',
  review_updated_error_message:
    'Une erreur est survenue lors de la mise à jour de votre avis. Veuillez réessayer plus tard.',

  cancel: 'Annuler',
  confirm_reservation_title: 'Confirmer la réservation',
  confirm_reservation_message: 'Êtes-vous sûr de vouloir envoyer cette demande de réservation ?',
  confirm_new_request_title: 'Confirmer la nouvelle demande',
  confirm_new_request_message:
    'Êtes-vous sûr de vouloir envoyer cette nouvelle demande de réservation ?',
  confirm_payment_title: 'Confirmer le paiement',
  confirm_payment_message: 'Êtes-vous sûr de vouloir procéder au paiement pour cette transaction ?',
  confirm_accept_request_title: 'Accepter la demande',
  confirm_accept_request_message:
    'Êtes-vous sûr de vouloir accepter cette demande de réservation ?',
  confirm_decline_request_title: 'Refuser la demande',
  confirm_decline_request_message:
    'Êtes-vous sûr de vouloir refuser cette demande de réservation ?',
  confirm_cancel_transaction_title: 'Annuler la transaction',
  confirm_cancel_transaction_message: 'Êtes-vous sûr de vouloir annuler cette transaction ?',
  confirm_mark_as_completed_title: 'Marquer comme terminé',
  confirm_mark_as_completed_message:
    'Êtes-vous sûr de vouloir marquer cette transaction comme terminée ?',

  sort: 'Trier',
  put_in_review: 'Mettre un avis',
  leave_a_review: 'Laisser un avis',
  write_your_review: 'Écrivez votre avis...',
  submit: 'Soumettre',
  no_reviews_yet: "Pas encore d'avis.",

  all_listings: 'Mes annonces',
  all_reviews: 'Mes avis',

  //STRIPE PAYMENT
  error_payment_declined_title: 'Paiement refusé',
  error_payment_declined_message:
    'Votre paiement a été refusé. Veuillez vérifier les informations de votre carte ou utiliser un autre mode de paiement.',
  error_payment_processing_message: 'Impossible de traiter le paiement. Veuillez réessayer.',

  secure_payment: 'Paiement sécurisé',
  amount_to_pay: 'Montant à payer',
  card_details: 'Détails de la carte',
  pay: 'Payer',
  invalid_amount: 'Montant invalide',
  please_fill_card_details: 'Veuillez remplir les détails de votre carte.',

  no_conditions: 'Aucune condition spéciale fournie.',

  // Ajouts propres au web (libelles codes en dur cote mobile, ou nouveaux
  // besoins d'accessibilite : chaque bouton icone a un nom accessible)
  back: 'Retour',
  loading: 'Chargement...',
  rating: 'Note',
  clear_filters: 'Effacer les filtres',
  sort_recent: 'Plus récents',
  sort_earliest_departure: 'Départs proches',
  sort_price_low: 'Prix le plus bas',
  sort_price_high: 'Prix le plus haut',
  sort_weight_high: 'Poids maximum',
  sort_weight_low: 'Poids minimum',
  decrease_weight: 'Diminuer le poids',
  increase_weight: 'Augmenter le poids',
  submit_review: "Envoyer l'avis",
  edit_review: "Modifier l'avis",
  payment_without_stripe_message:
    'Le service Stripe est désactivé en développement local. Confirmer marque la transaction comme payée, sans débit réel.',
  results_count_one: '{{count}} trajet disponible',
  results_count: '{{count}} trajets disponibles',
  weight: 'Poids',
  transactions_count_one: '{{count}} transaction',
  transactions_count: '{{count}} transactions',
  sample_conditions: "Pas de liquides, rendez-vous au comptoir d'enregistrement.",
  status: 'Statut',

  // Authentification maison : le web ne renvoie plus vers les pages de Keycloak
  sign_in: 'Se connecter',
  sign_in_title: 'Content de vous revoir',
  sign_in_lede: 'Connectez-vous pour réserver des kilos ou gérer vos annonces.',
  sign_up: 'Créer un compte',
  sign_up_title: 'Créez votre compte',
  sign_up_lede: 'Cinq champs, et vous pouvez acheter ou vendre des kilos.',
  password: 'Mot de passe',
  password_placeholder: 'Entrez votre mot de passe',
  password_hint: '8 caractères minimum',
  show_password: 'Afficher le mot de passe',
  hide_password: 'Masquer le mot de passe',
  signing_in: 'Connexion...',
  creating_account: 'Création du compte...',
  no_account_yet: 'Pas encore de compte ?',
  already_have_account: 'Déjà un compte ?',
  auth_promise_one: 'Réservez des kilos sur un vol qui part chez vous',
  auth_promise_two: 'Transformez vos kilos libres en revenu',
  auth_promise_three: 'Le paiement est retenu jusqu’à la remise du colis',
  error_email_required: 'L’email est obligatoire.',
  error_email_invalid: 'Entrez une adresse email valide.',
  error_password_required: 'Le mot de passe est obligatoire.',
  error_first_name_required: 'Le prénom est obligatoire.',
  error_last_name_required: 'Le nom est obligatoire.',
  error_password_too_short: 'Utilisez au moins 8 caractères.',
  error_password_mismatch: 'Les deux mots de passe ne correspondent pas.',
  error_invalid_credentials: 'Email ou mot de passe incorrect.',
  error_account_disabled: 'Ce compte est bloqué : trop de tentatives, ou il a été désactivé.',
  error_auth_unavailable:
    'La connexion est indisponible pour le moment. Réessayez dans un instant.',
  error_email_already_used: 'Un compte existe déjà avec cet email.',
  error_password_rejected: 'Ce mot de passe a été refusé. Choisissez-en un plus long.',
  error_invalid_current_password: 'Votre mot de passe actuel est incorrect.',

  // Écran de compte : ce que le mobile déléguait à la console Keycloak
  my_account: 'Mon compte',
  account_lede: 'Vos informations, votre profil public et votre mot de passe.',
  public_profile_card: 'Profil public',
  public_profile_lede: 'Visible par les membres avec qui vous voyagez.',
  change_password: 'Changer de mot de passe',
  current_password: 'Mot de passe actuel',
  new_password: 'Nouveau mot de passe',
  confirm_new_password: 'Confirmez le nouveau mot de passe',
  update_password: 'Mettre à jour le mot de passe',
  email_change_note: 'Changer votre email le rend non vérifié tant qu’il n’est pas confirmé.',
  email_change_password_hint:
    'Votre email sert aussi à vous connecter : confirmez ce changement avec votre mot de passe actuel.',
  what_others_see: 'Ce que voient les autres membres',
  identity_updated: 'Vos informations ont été mises à jour.',
  profile_updated: 'Votre profil a été mis à jour.',
  password_updated: 'Votre mot de passe a été mis à jour.',
  saving: 'Enregistrement...',

  // Chargement en échec : ce que l'écran affiche à la place d'une liste vide
  load_error: 'Le chargement a échoué.',
  load_error_offline: 'Impossible de joindre BagBuddy. Vérifiez votre connexion et réessayez.',
  load_error_unavailable: 'Ce service est momentanément indisponible. Réessayez dans un instant.',
  retry: 'Réessayer',

  // Inscription : confirmation du mot de passe, erreurs et compte créé sans connexion
  confirm_password: 'Confirmez le mot de passe',
  confirm_password_placeholder: 'Saisissez-le une seconde fois',
  error_confirm_password_required: 'Confirmez votre mot de passe.',
  error_name_too_long: 'Utilisez 60 caractères au maximum.',
  error_email_too_long: 'Cet email est trop long.',
  error_password_too_long: 'Utilisez 128 caractères au maximum.',
  error_sign_up_unavailable:
    "L'inscription est indisponible pour le moment. Réessayez dans un instant.",
  error_sign_up_rejected:
    'Certaines informations ont été refusées. Vérifiez le formulaire et réessayez.',
  error_sign_up_failed: "Votre compte n'a pas pu être créé. Réessayez dans un instant.",
  sign_in_with_this_email: 'Se connecter avec cet email',
  account_created_title: 'Votre compte est créé',
  account_created_sign_in:
    "La connexion automatique n'a pas abouti. Connectez-vous avec votre nouveau mot de passe pour continuer.",

  // Mot de passe oublié : lien envoyé par userservice, jamais par Keycloak
  forgot_password: 'Mot de passe oublié ?',
  forgot_password_title: 'Réinitialisez votre mot de passe',
  forgot_password_lede:
    'Indiquez l’email de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe.',
  send_reset_link: 'Envoyer le lien',
  sending_reset_link: 'Envoi...',
  reset_link_sent_title: 'Consultez votre boîte mail',
  reset_link_sent_message:
    'Si un compte utilise {{email}}, un lien valable 30 minutes vient d’y être envoyé. Pensez à regarder dans vos spams.',
  use_another_email: 'Utiliser un autre email',
  back_to_sign_in: 'Retour à la connexion',
  error_reset_request_failed: "Le lien n'a pas pu être envoyé. Réessayez dans un instant.",
  reset_password_title: 'Choisissez un nouveau mot de passe',
  reset_password_lede:
    'Vous serez déconnecté de tous vos appareils, puis vous pourrez vous connecter avec.',
  set_new_password: 'Enregistrer le mot de passe',
  reset_link_invalid_title: "Ce lien n'est plus valable",
  reset_link_invalid_message:
    "Il a expiré, a déjà servi, ou un lien plus récent l'a remplacé. Demandez-en un nouveau.",
  request_new_link: 'Demander un nouveau lien',
  error_reset_failed: "Votre mot de passe n'a pas pu être modifié. Réessayez dans un instant.",
  password_reset_done: 'Votre mot de passe a été modifié. Connectez-vous avec le nouveau.',

  // Vérification de l'email : lien envoyé par userservice
  email_not_verified_title: 'Votre email n’est pas encore vérifié',
  email_not_verified_message:
    'Confirmez {{email}} pour afficher le badge « Vérifié » que regardent les autres membres.',
  send_verification_link: 'Envoyer le lien',
  verification_link_sent: 'Lien envoyé à {{email}}. Il est valable 24 heures.',
  error_verification_throttled:
    'Un lien est parti il y a moins d’une minute. Regardez d’abord votre boîte mail.',
  error_verification_send_failed: "Le lien n'a pas pu être envoyé. Réessayez dans un instant.",
  identity_updated_verification_sent:
    'Vos informations ont été mises à jour. Un lien de vérification a été envoyé à {{email}}.',
  verify_email_title: 'Vérification de l’email',
  verify_email_lede: 'Une adresse vérifiée apparaît comme telle sur votre profil.',
  verifying_email: 'Confirmation de votre adresse...',
  email_verified_title: 'Votre email est vérifié',
  email_verified_message: 'Le badge « Vérifié » apparaît désormais sur votre profil.',
  verification_link_invalid_title: "Ce lien n'est plus valable",
  verification_link_invalid_message:
    "Il a expiré, a déjà servi, ou un lien plus récent l'a remplacé. Vous pouvez en demander un nouveau depuis votre compte.",
  error_verification_failed: "Votre adresse n'a pas pu être confirmée. Réessayez dans un instant.",
  go_to_my_account: 'Aller à mon compte',

  // Pastille de navigation : transactions qui attendent une action
  pending_actions_one: '1 transaction attend votre action',
  pending_actions_other: '{{count}} transactions attendent votre action',

  // Filtre de date flexible
  departure_date_filter: 'Date de départ',
  date: 'Date',
  date_flexibility: 'Flexibilité',
  date_exact: 'Date exacte',
  date_flex_one: '± 1 jour',
  date_flex_days: '± {{days}} jours',
  continue: 'Continuer',

  // Favoris et signalements
  favorite: 'Favori',
  my_favorites: 'Mes favoris',
  no_favorites:
    "Aucun favori pour l'instant. Touchez le cœur d'une annonce pour la mettre de côté.",
  favorites_unavailable: 'Plus disponibles',
  listing_unavailable: 'Cette annonce ne peut plus être réservée.',
  error_favorite_failed: "Ce favori n'a pas pu être enregistré. Réessayez dans un instant.",
  error_too_many_favorites: "Vous pouvez garder jusqu'à 200 favoris. Retirez-en d'abord.",
  report_member: 'Signaler ce membre',
  report_member_title: 'Signaler {{name}}',
  report_member_lede:
    "L'équipe de modération lit chaque signalement. Le membre ne sait pas qui l'a signalé.",
  report_reason: 'Motif',
  report_reason_prohibited_items: 'Objets interdits ou contenu non déclaré',
  report_reason_no_show: 'Absent au rendez-vous de remise',
  report_reason_fraud: 'Fraude ou arnaque',
  report_reason_harassment: 'Comportement abusif',
  report_reason_other: 'Autre chose',
  report_details: 'Détails (facultatif)',
  report_details_hint:
    "Ce qui s'est passé, quand, et tout ce qui nous aide à vérifier. 2 000 caractères maximum.",
  send_report: 'Envoyer le signalement',
  report_sent: "Merci. L'équipe de modération va examiner ce signalement.",
  error_report_reason_required: 'Choisissez un motif.',
  error_report_failed: "Le signalement n'a pas pu être envoyé. Réessayez dans un instant.",
  error_too_many_reports:
    "Vous avez envoyé beaucoup de signalements aujourd'hui. Réessayez demain.",

  // Déclaration du contenu, code de remise, messagerie
  content_declaration_title: 'Ce que vous envoyez',
  content_declaration_lede:
    'Le voyageur le lit avant d’accepter : il passe la sécurité et la douane avec votre colis.',
  content_description: 'Contenu du colis',
  content_description_placeholder: 'ex. Deux livres de poche et un pull en laine',
  content_description_hint: 'Soyez précis. 500 caractères maximum.',
  error_content_required: 'Décrivez ce que le voyageur va transporter.',
  prohibited_items_title: 'Interdit dans un colis',
  prohibited_flammable: 'Produits inflammables ou explosifs, briquets, feux d’artifice',
  prohibited_weapons: 'Armes, munitions et répliques',
  prohibited_drugs: 'Drogues, et médicaments sans ordonnance',
  prohibited_valuables: 'Espèces, bijoux et objets de valeur non déclarés',
  prohibited_perishables: 'Denrées périssables, plantes et animaux vivants',
  prohibited_counterfeit: 'Contrefaçons',
  prohibited_items_accept:
    'Mon colis ne contient aucun de ces objets et correspond à la description ci-dessus.',
  error_prohibited_not_accepted: 'Confirmez que votre colis ne contient aucun objet interdit.',
  declared_content_title: 'Contenu déclaré',
  prohibited_items_accepted_note:
    'L’acheteur a confirmé que le colis ne contient aucun objet interdit.',
  handover_title: 'Code de remise',
  handover_buyer_lede:
    'Donnez ce code à la personne qui reçoit le colis. Le voyageur le saisira à la livraison pour clore la transaction.',
  copy_code: 'Copier',
  copied: 'Copié',
  handover_locked_buyer:
    'Trop de codes faux ont été saisis. Confirmez vous-même la livraison une fois le colis arrivé.',
  handover_seller_lede:
    'À la livraison, demandez le code de remise au destinataire et saisissez-le ici : il prouve que le colis a été remis.',
  handover_locked_seller:
    'Trop de codes faux. C’est maintenant à l’acheteur de confirmer la livraison.',
  handover_code_label: 'Code de remise',
  confirm_handover: 'Valider la remise',
  error_handover_code_format: 'Le code comporte 6 chiffres.',
  error_handover_code_invalid: 'Ce n’est pas le bon code. Vérifiez-le avec le destinataire.',
  error_handover_failed: "La remise n'a pas pu être validée. Réessayez dans un instant.",
  handover_done_title: 'Remise validée',
  handover_done_message: 'La transaction est terminée. Vous pouvez maintenant laisser un avis.',
  chat_title: 'Messages',
  chat_you: 'Vous :',
  chat_them: 'L’autre membre :',
  chat_empty: 'Aucun message pour l’instant. Convenez du lieu et de l’heure de la remise.',
  chat_closed: 'Cette transaction a été annulée : la conversation est en lecture seule.',
  chat_placeholder: 'Écrire un message',
  chat_send: 'Envoyer',
  error_chat_too_fast: 'Vous envoyez des messages trop vite. Patientez un instant.',
  error_chat_send: "Le message n'a pas pu être envoyé. Réessayez.",

  // Versements et règlement
  payouts_title: 'Versements',
  payouts_lede:
    'Pour recevoir l’argent de vos trajets, Stripe a besoin de votre identité et de votre RIB. Ces données ne passent jamais par BagBuddy.',
  payouts_state_none: 'Les versements ne sont pas encore configurés.',
  payouts_state_incomplete: 'Vos informations Stripe sont incomplètes.',
  payouts_state_review: 'Stripe vérifie vos informations.',
  payouts_state_active: 'Les versements sont actifs : vos gains partent vers votre banque.',
  payouts_setup: 'Configurer mes versements',
  payouts_continue: 'Terminer la configuration',
  payouts_redirecting: 'Ouverture de Stripe...',
  payouts_unavailable: 'Les versements sont indisponibles pour le moment. Réessayez plus tard.',
  payouts_onboarding_failed: "Stripe n'a pas pu être ouvert. Réessayez dans un instant.",
  payouts_returned_done: 'De retour de Stripe. Votre statut est à jour ci-dessous.',
  payouts_returned_retry: 'Le lien Stripe a expiré. Rouvrez-le pour continuer.',
  settlement_payout_title: 'Votre versement',
  settlement_refund_title: 'Votre remboursement',
  settlement_fee: 'Après {{fee}} de frais BagBuddy.',
  settlement_payout_done: 'Envoyé sur votre compte bancaire.',
  settlement_refund_done: 'Remboursé sur votre moyen de paiement.',
  settlement_simulated: 'Simulé : aucun argent réel ne circule dans cet environnement.',
  settlement_awaiting_account:
    'En attente de votre compte de versement : configurez-le pour recevoir ce montant.',
  settlement_failed: 'Ce virement a échoué. Notre équipe s’en occupe.',
  settlement_pending: 'En cours.',

  // Alertes de trajet
  my_alerts: 'Mes alertes de trajet',
  alerts_lede:
    'Vous recevez un email chaque fois qu’une annonce correspondant à l’une de ces alertes est publiée. Créez-les depuis l’accueil, une fois un trajet choisi.',
  no_alerts:
    'Aucune alerte pour l’instant. Choisissez un départ et une arrivée sur l’accueil, puis touchez « M’alerter ».',
  alert_prompt: 'Recevez un email à chaque nouvelle annonce {{route}}.',
  alert_create: 'M’alerter',
  alert_created: 'Alerte créée pour {{route}}.',
  manage_alerts: 'Gérer mes alertes',
  alert_any_date: 'Toutes les dates',
  alert_date_exact: 'Le {{date}}',
  alert_date_flex: 'Autour du {{date}} (± {{days}} jours)',
  alert_max_price: '{{price}} / kg max',
  alert_min_weight: '{{weight}} kg min',
  delete_alert: 'Supprimer l’alerte {{route}}',
  delete_alert_message: 'Vous ne recevrez plus d’emails pour ce trajet.',
  error_alert_failed: "L'alerte n'a pas pu être créée. Réessayez dans un instant.",
  error_too_many_alerts: 'Vous pouvez garder jusqu’à 10 alertes. Supprimez-en une d’abord.',
  error_alert_needs_email: 'Votre compte doit avoir une adresse email pour recevoir des alertes.',
  error_alert_delete_failed: "L'alerte n'a pas pu être supprimée. Réessayez dans un instant.",

  // Paiement Stripe
  payment_amount: 'Montant à payer',
  payment_preparing: 'Préparation du paiement sécurisé...',
  payment_pay: 'Payer maintenant',
  payment_paying: 'Paiement...',
  payment_secure_note: 'Votre carte est saisie chez Stripe et ne passe jamais par BagBuddy.',
  payment_waiting_confirmation: 'Paiement accepté. En attente de la confirmation de Stripe...',
  payment_confirmation_late:
    'Votre paiement est passé, mais sa confirmation prend plus de temps que d’habitude. Vous ne serez pas débité une seconde fois.',
  payment_unavailable: "Le paiement n'a pas pu être préparé. Réessayez dans un instant.",
  payment_failed: 'Le paiement a échoué.',

  // Partage
  share: 'Partager cette annonce',
  link_copied: 'Lien copié',
};
