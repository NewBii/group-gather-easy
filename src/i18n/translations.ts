export type Language = 'fr' | 'en';

interface Translations {
  nav: {
    home: string;
    createEvent: string;
    guides: string;
    myEvents: string;
  };
  home: {
    headline: string;
    subheadline: string;
    cta: string;
    features: {
      noAccount: string;
      collaborative: string;
      simple: string;
    };
  };
  createEvent: {
    title: string;
    description: string;
    success: string;
    error: string;
    form: {
      title: string;
      titlePlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      descriptionHint: string;
      eventType: string;
      selectEventType: string;
      dayEvent: string;
      trip: string;
      startDate: string;
      endDate: string;
      pickDate: string;
      locationType: string;
      submit: string;
      selectDatesForVoting: string;
      selectedDates: string;
      datePeriods: string;
      period: string;
      addDatePeriod: string;
      remove: string;
      validation: {
        minOneDateRequired: string;
        minOnePeriodRequired: string;
      };
    };
    locationOptions: {
      setVenues: { label: string; description: string; };
      suggestions: { label: string; description: string; };
      fairSpot: { label: string; description: string; };
    };
  };
  guides: {
    title: string;
    description: string;
    categories: { friends: string; family: string; birthdays: string; tips: string; };
    comingSoon: string;
  };
  event: { notFound: string; backHome: string; };
  auth: {
    login: string;
    logout: string;
    signup: string;
    email: string;
    password: string;
    confirmPassword: string;
    submitLogin: string;
    submitSignup: string;
    switchToSignup: string;
    switchToLogin: string;
    errors: { invalidEmail: string; passwordTooShort: string; passwordMismatch: string; emailInUse: string; invalidCredentials: string; };
    continueWithGoogle: string;
    orContinueWith: string;
  };
  eventCreated: {
    title: string;
    subtitle: string;
    linkCopied: string;
    createAccountTitle: string;
    createAccountDescription: string;
    createAccountButton: string;
    continueAsGuest: string;
    accountLinked: string;
    shareTitle: string;
    shareDescription: string;
    copyLink: string;
    shareByEmail: string;
    addToCalendar: string;
  };
  myEvents: { title: string; createNew: string; noEvents: string; createFirst: string; noDescription: string; };
  common: { loading: string; error: string; back: string; cancel: string; };
  notFound: { title: string; description: string; backHome: string; };
  footer: {
    allRightsReserved: string;
    privacyPolicy: string;
  };
  privacy: {
    title: string;
    lastUpdated: string;
    intro: string;
    dataController: { title: string; content: string; };
    dataCollected: { title: string; intro: string; items: string[]; };
    legalBasis: { title: string; intro: string; items: string[]; };
    purposes: { title: string; items: string[]; };
    retention: { title: string; content: string; };
    sharing: { title: string; intro: string; items: string[]; };
    rights: { title: string; intro: string; items: string[]; howToExercise: string; };
    cookies: { title: string; content: string; };
    security: { title: string; content: string; };
    children: { title: string; content: string; };
    updates: { title: string; content: string; };
    contact: { title: string; content: string; };
  };
  eventPage: {
    loading: string;
    notFound: string;
    notFoundDescription: string;
    status: { active: string; finalized: string; cancelled: string; };
    locationType: { setVenues: string; suggestions: string; fairSpot: string; };
    share: { button: string; copied: string; };
    join: {
      title: string;
      description: string;
      yourName: string;
      namePlaceholder: string;
      yourEmail: string;
      emailPlaceholder: string;
      joinButton: string;
      success: string;
      error: string;
      welcomeBack: string;
      orLogin: string;
      orCreateAccount: string;
      or: string;
    };
    dateVoting: {
      title: string;
      yes: string;
      no: string;
      maybe: string;
      votes: string;
      bestDate: string;
      noDates: string;
      joinFirst: string;
      voteError: string;
      confirmAvailability: string;
      unsavedChanges: string;
      reset: string;
      saving: string;
      saved: string;
      pendingChange: string;
    };
    activities: {
      title: string;
      addNew: string;
      namePlaceholder: string;
      descriptionPlaceholder: string;
      add: string;
      noActivities: string;
      joinFirst: string;
      addSuccess: string;
      addError: string;
      voteError: string;
      confirmVotes: string;
      unsavedChanges: string;
      reset: string;
      saving: string;
      saved: string;
      pendingChange: string;
    };
    location: {
      title: string;
      addSuggestion: string;
      namePlaceholder: string;
      addressPlaceholder: string;
      add: string;
      noLocations: string;
      joinFirst: string;
      addSuccess: string;
      addError: string;
      voteError: string;
      fairSpotExplanation: string;
      yourLocation: string;
      locationPlaceholder: string;
      transportMode: string;
      transportModes: { car: string; publicTransport: string; bike: string; walk: string; };
      saveLocation: string;
      locationSaved: string;
      locationError: string;
      participantsWithLocation: string;
      enterAddress: string;
      noResults: string;
      confirmLocation: string;
      updateLocation: string;
      fairMeetingPoint: string;
      calculatingMeetingPoint: string;
      everyoneLocated: string;
      waitingForLocations: string;
      participantsOnMap: string;
      searchByAddress: string;
      selectOnMap: string;
      useMyLocation: string;
      clickToSelect: string;
      mapLoadError: string;
      change: string;
      locationPending: string;
    };
    participants: {
      title: string;
      noParticipants: string;
      you: string;
      organizer: string;
    };
    results: {
      title: string;
      topDate: string;
      topActivity: string;
      topLocation: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  fr: {
    nav: {
      home: 'Accueil',
      createEvent: 'Créer un événement',
      guides: 'Guides',
      myEvents: 'Mes événements',
    },
    home: {
      headline: 'Organisez vos moments ensemble, simplement',
      subheadline: 'Un seul espace partagé pour transformer une idée en événement réel, sans friction.',
      cta: 'Créer un événement',
      features: {
        noAccount: 'Sans compte obligatoire',
        collaborative: 'Décisions collaboratives',
        simple: 'Simple et efficace',
      },
    },
    createEvent: {
      title: 'Créer un événement',
      description: 'Commencez à organiser votre prochain moment ensemble.',
      success: 'Événement créé avec succès !',
      error: 'Erreur lors de la création de l\'événement',
      form: {
        title: 'Titre de l\'événement',
        titlePlaceholder: 'Ex: Anniversaire de Marie, Weekend à la montagne...',
        description: 'Description',
        descriptionPlaceholder: 'Ajoutez des détails sur votre événement...',
        descriptionHint: 'Optionnel - Maximum 500 caractères',
        eventType: 'Type d\'événement',
        selectEventType: 'Sélectionnez un type',
        dayEvent: 'Événement d\'une journée',
        trip: 'Voyage / Séjour',
        startDate: 'Date de début',
        endDate: 'Date de fin',
        pickDate: 'Choisir une date',
        locationType: 'Comment choisir le lieu ?',
        submit: 'Créer l\'événement',
        selectDatesForVoting: 'Sélectionnez les dates pour le vote',
        selectedDates: 'Dates sélectionnées',
        datePeriods: 'Périodes proposées',
        period: 'Période',
        addDatePeriod: 'Ajouter une période',
        remove: 'Supprimer',
        validation: {
          minOneDateRequired: 'Veuillez sélectionner au moins une date',
          minOnePeriodRequired: 'Veuillez définir au moins une période complète',
        },
      },
      locationOptions: {
        setVenues: {
          label: 'Lieux définis',
          description: 'Vous proposez un ou plusieurs lieux précis, les participants votent.',
        },
        suggestions: {
          label: 'Suggestions ouvertes',
          description: 'Chacun peut proposer des idées de lieux, puis on vote ensemble.',
        },
        fairSpot: {
          label: 'Point central équitable',
          description: 'Trouvez automatiquement un lieu équidistant pour tous les participants.',
        },
      },
    },
    guides: {
      title: 'Guides',
      description: 'Conseils et astuces pour organiser vos événements.',
      categories: {
        friends: 'Entre amis',
        family: 'En famille',
        birthdays: 'Anniversaires',
        tips: 'Astuces',
      },
      comingSoon: 'Contenu bientôt disponible',
    },
    event: {
      notFound: 'Événement non trouvé',
      backHome: 'Retour à l\'accueil',
    },
    auth: {
      login: 'Connexion',
      logout: 'Déconnexion',
      signup: 'Créer un compte',
      email: 'Email',
      password: 'Mot de passe',
      confirmPassword: 'Confirmer le mot de passe',
      submitLogin: 'Se connecter',
      submitSignup: 'S\'inscrire',
      switchToSignup: 'Pas encore de compte ? S\'inscrire',
      switchToLogin: 'Déjà un compte ? Se connecter',
      errors: {
        invalidEmail: 'Email invalide',
        passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
        passwordMismatch: 'Les mots de passe ne correspondent pas',
        emailInUse: 'Cet email est déjà utilisé',
        invalidCredentials: 'Email ou mot de passe incorrect',
      },
      continueWithGoogle: 'Continuer avec Google',
      orContinueWith: 'ou',
    },
    eventCreated: {
      title: 'Événement créé !',
      subtitle: 'Partagez ce lien avec vos participants',
      linkCopied: 'Lien copié !',
      createAccountTitle: 'Gérer votre événement',
      createAccountDescription: 'Créez un compte pour modifier, suivre les réponses et recevoir des notifications.',
      createAccountButton: 'Créer un compte',
      continueAsGuest: 'Continuer sans compte',
      accountLinked: 'Événement lié à votre compte !',
      shareTitle: 'Partager cet événement',
      shareDescription: 'Toute personne avec ce lien peut voir et participer. Vous pouvez toujours revenir à cet événement avec le même lien.',
      copyLink: 'Copier',
      shareByEmail: 'Email',
      addToCalendar: 'Calendrier',
    },
    myEvents: {
      title: 'Mes événements',
      createNew: 'Nouvel événement',
      noEvents: 'Vous n\'avez pas encore créé d\'événement.',
      createFirst: 'Créer mon premier événement',
      noDescription: 'Aucune description',
    },
    common: {
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      back: 'Retour',
      cancel: 'Annuler',
    },
    notFound: {
      title: 'Page non trouvée',
      description: 'La page que vous recherchez n\'existe pas.',
      backHome: 'Retour à l\'accueil',
    },
    footer: {
      allRightsReserved: 'Tous droits réservés.',
      privacyPolicy: 'Politique de confidentialité',
    },
    privacy: {
      title: 'Politique de confidentialité',
      lastUpdated: 'Dernière mise à jour',
      intro: 'Chez Ensemble, nous nous engageons à protéger votre vie privée et vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et aux autres lois européennes applicables.',
      dataController: {
        title: 'Responsable du traitement',
        content: 'Ensemble est responsable du traitement de vos données personnelles. Pour toute question concernant la protection de vos données, vous pouvez nous contacter via les coordonnées indiquées dans la section Contact.',
      },
      dataCollected: {
        title: 'Données collectées',
        intro: 'Nous collectons uniquement les données nécessaires au fonctionnement du service :',
        items: [
          'Nom ou pseudonyme (pour vous identifier dans les événements)',
          'Adresse email (optionnelle, pour les notifications)',
          'Localisation (optionnelle, uniquement pour la fonctionnalité "point de rendez-vous équitable")',
          'Données de participation aux événements (votes, suggestions)',
        ],
      },
      legalBasis: {
        title: 'Base légale du traitement',
        intro: 'Nous traitons vos données sur les bases suivantes (Article 6 du RGPD) :',
        items: [
          'Consentement : vous acceptez de participer aux événements',
          'Exécution du contrat : pour fournir le service d\'organisation d\'événements',
          'Intérêt légitime : pour améliorer nos services',
        ],
      },
      purposes: {
        title: 'Finalités du traitement',
        items: [
          'Permettre la création et la gestion d\'événements collaboratifs',
          'Faciliter le vote sur les dates, lieux et activités',
          'Calculer le point de rendez-vous équitable (si vous partagez votre localisation)',
          'Envoyer des notifications par email (si vous avez fourni votre email)',
        ],
      },
      retention: {
        title: 'Conservation des données',
        content: 'Vos données sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées. Les données des événements sont supprimées 12 mois après la date de l\'événement. Vous pouvez demander la suppression de vos données à tout moment.',
      },
      sharing: {
        title: 'Partage des données',
        intro: 'Vos données peuvent être partagées avec :',
        items: [
          'Les autres participants de vos événements (nom uniquement)',
          'Nos fournisseurs techniques pour l\'hébergement et le stockage sécurisé',
          'Les services de cartographie pour la fonctionnalité de point équitable',
        ],
      },
      rights: {
        title: 'Vos droits',
        intro: 'Conformément au RGPD (Articles 15-22), vous disposez des droits suivants :',
        items: [
          'Droit d\'accès : obtenir une copie de vos données personnelles',
          'Droit de rectification : corriger vos données inexactes',
          'Droit à l\'effacement ("droit à l\'oubli") : supprimer vos données',
          'Droit à la limitation du traitement',
          'Droit à la portabilité : recevoir vos données dans un format structuré',
          'Droit d\'opposition : vous opposer au traitement de vos données',
          'Droit de retirer votre consentement à tout moment',
        ],
        howToExercise: 'Pour exercer ces droits, contactez-nous via les coordonnées indiquées ci-dessous. Vous avez également le droit de déposer une plainte auprès de la CNIL ou de toute autre autorité de protection des données compétente.',
      },
      cookies: {
        title: 'Cookies',
        content: 'Nous utilisons uniquement des cookies essentiels au fonctionnement du site (authentification, préférences de langue). Nous n\'utilisons pas de cookies de suivi ou publicitaires.',
      },
      security: {
        title: 'Sécurité',
        content: 'Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement en transit et au repos, contrôles d\'accès stricts, audits de sécurité réguliers.',
      },
      children: {
        title: 'Protection des mineurs',
        content: 'Notre service n\'est pas destiné aux enfants de moins de 16 ans. Nous ne collectons pas sciemment de données personnelles de mineurs sans le consentement parental.',
      },
      updates: {
        title: 'Modifications de cette politique',
        content: 'Nous pouvons mettre à jour cette politique de confidentialité. Toute modification significative sera communiquée via le site ou par email si vous êtes inscrit.',
      },
      contact: {
        title: 'Contact',
        content: 'Pour toute question concernant cette politique ou pour exercer vos droits, contactez-nous à : privacy@ensemble.app',
      },
    },
    eventPage: {
      loading: 'Chargement de l\'événement...',
      notFound: 'Événement non trouvé',
      notFoundDescription: 'L\'événement que vous recherchez n\'existe pas ou a été supprimé.',
      status: { active: 'Actif', finalized: 'Finalisé', cancelled: 'Annulé' },
      locationType: { setVenues: 'Lieux définis', suggestions: 'Suggestions ouvertes', fairSpot: 'Point central équitable' },
      share: { button: 'Partager', copied: 'Lien copié !' },
      join: {
        title: 'Participer à cet événement',
        description: 'Entrez votre nom pour rejoindre et voter.',
        yourName: 'Votre nom',
        namePlaceholder: 'Comment voulez-vous être appelé ?',
        yourEmail: 'Email (optionnel)',
        emailPlaceholder: 'Pour recevoir des notifications',
        joinButton: 'Participer',
        success: 'Vous avez rejoint l\'événement !',
        error: 'Erreur lors de l\'inscription',
        welcomeBack: 'Content de vous revoir, {name} !',
        orLogin: 'Se connecter',
        orCreateAccount: 'Créer un compte',
        or: 'ou',
      },
      dateVoting: {
        title: 'Choisissez vos disponibilités',
        yes: 'Oui',
        no: 'Non',
        maybe: 'Peut-être',
        votes: 'votes',
        bestDate: 'Meilleure date',
        noDates: 'Aucune date proposée',
        joinFirst: 'Rejoignez l\'événement pour voter',
        voteError: 'Erreur lors du vote',
        confirmAvailability: 'Confirmer mes disponibilités',
        unsavedChanges: '{count} modification(s) non enregistrée(s)',
        reset: 'Annuler',
        saving: 'Enregistrement...',
        saved: 'Disponibilités enregistrées !',
        pendingChange: 'En attente',
      },
      activities: {
        title: 'Activités',
        addNew: 'Proposer une activité',
        namePlaceholder: 'Nom de l\'activité',
        descriptionPlaceholder: 'Description (optionnel)',
        add: 'Ajouter',
        noActivities: 'Aucune activité proposée',
        joinFirst: 'Rejoignez l\'événement pour proposer',
        addSuccess: 'Activité ajoutée !',
        addError: 'Erreur lors de l\'ajout',
        voteError: 'Erreur lors du vote',
        confirmVotes: 'Confirmer mes votes',
        unsavedChanges: '{count} modification(s) non enregistrée(s)',
        reset: 'Annuler',
        saving: 'Enregistrement...',
        saved: 'Votes enregistrés !',
        pendingChange: 'En attente',
      },
      location: {
        title: 'Lieu',
        addSuggestion: 'Proposer un lieu',
        namePlaceholder: 'Nom du lieu',
        addressPlaceholder: 'Adresse (optionnel)',
        add: 'Ajouter',
        noLocations: 'Aucun lieu proposé',
        joinFirst: 'Rejoignez l\'événement pour proposer',
        addSuccess: 'Lieu ajouté !',
        addError: 'Erreur lors de l\'ajout',
        voteError: 'Erreur lors du vote',
        fairSpotExplanation: 'Le point de rendez-vous sera calculé pour être équitable pour tous.',
        yourLocation: 'Votre localisation',
        locationPlaceholder: 'Ville ou adresse',
        transportMode: 'Mode de transport',
        transportModes: { car: 'Voiture', publicTransport: 'Transports en commun', bike: 'Vélo', walk: 'À pied' },
        saveLocation: 'Enregistrer',
        locationSaved: 'Localisation enregistrée !',
        locationError: 'Erreur lors de l\'enregistrement',
        participantsWithLocation: '{count} participant(s) ont partagé leur localisation',
        enterAddress: 'Entrez votre adresse...',
        noResults: 'Aucune adresse trouvée',
        confirmLocation: 'Confirmer cette adresse',
        updateLocation: 'Modifier ma localisation',
        fairMeetingPoint: 'Point de rendez-vous équitable',
        calculatingMeetingPoint: 'Calcul du point de rencontre...',
        everyoneLocated: 'Tous les participants ont partagé leur localisation !',
        waitingForLocations: '{count} participant(s) n\'ont pas encore partagé leur localisation',
        participantsOnMap: 'Participants sur la carte',
        searchByAddress: 'Rechercher',
        selectOnMap: 'Carte',
        useMyLocation: 'Ma position',
        clickToSelect: 'Cliquez sur la carte pour sélectionner votre position',
        mapLoadError: 'Impossible de charger la carte',
        change: 'Modifier',
        locationPending: 'En attente',
      },
      participants: {
        title: 'Participants',
        noParticipants: 'Aucun participant pour le moment',
        you: 'vous',
        organizer: 'Organisateur',
      },
      results: {
        title: 'Résultats actuels',
        topDate: 'Date préférée',
        topActivity: 'Activité préférée',
        topLocation: 'Lieu préféré',
      },
    },
  },
  en: {
    nav: {
      home: 'Home',
      createEvent: 'Create Event',
      guides: 'Guides',
      myEvents: 'My Events',
    },
    home: {
      headline: 'Organize your moments together, simply',
      subheadline: 'One shared space to turn an idea into a real event, without friction.',
      cta: 'Create an event',
      features: {
        noAccount: 'No account required',
        collaborative: 'Collaborative decisions',
        simple: 'Simple and effective',
      },
    },
    createEvent: {
      title: 'Create an Event',
      description: 'Start organizing your next moment together.',
      success: 'Event created successfully!',
      error: 'Error creating event',
      form: {
        title: 'Event title',
        titlePlaceholder: 'E.g., Marie\'s birthday, Mountain weekend...',
        description: 'Description',
        descriptionPlaceholder: 'Add details about your event...',
        descriptionHint: 'Optional - Maximum 500 characters',
        eventType: 'Event type',
        selectEventType: 'Select a type',
        dayEvent: 'Day event',
        trip: 'Trip / Getaway',
        startDate: 'Start date',
        endDate: 'End date',
        pickDate: 'Pick a date',
        locationType: 'How to choose the location?',
        submit: 'Create event',
        selectDatesForVoting: 'Select dates for voting',
        selectedDates: 'Selected dates',
        datePeriods: 'Date periods',
        period: 'Period',
        addDatePeriod: 'Add a period',
        remove: 'Remove',
        validation: {
          minOneDateRequired: 'Please select at least one date',
          minOnePeriodRequired: 'Please define at least one complete period',
        },
      },
      locationOptions: {
        setVenues: {
          label: 'Set venues',
          description: 'You propose one or more specific places, participants vote.',
        },
        suggestions: {
          label: 'Open suggestions',
          description: 'Everyone can suggest place ideas, then we vote together.',
        },
        fairSpot: {
          label: 'Fair spot',
          description: 'Automatically find a location equidistant for all participants.',
        },
      },
    },
    guides: {
      title: 'Guides',
      description: 'Tips and tricks for organizing your events.',
      categories: {
        friends: 'With Friends',
        family: 'With Family',
        birthdays: 'Birthdays',
        tips: 'Tips',
      },
      comingSoon: 'Content coming soon',
    },
    event: {
      notFound: 'Event not found',
      backHome: 'Back to home',
    },
    auth: {
      login: 'Log in',
      logout: 'Log out',
      signup: 'Sign up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      submitLogin: 'Log in',
      submitSignup: 'Sign up',
      switchToSignup: 'No account yet? Sign up',
      switchToLogin: 'Already have an account? Log in',
      errors: {
        invalidEmail: 'Invalid email',
        passwordTooShort: 'Password must be at least 6 characters',
        passwordMismatch: 'Passwords do not match',
        emailInUse: 'This email is already in use',
        invalidCredentials: 'Invalid email or password',
      },
      continueWithGoogle: 'Continue with Google',
      orContinueWith: 'or',
    },
    eventCreated: {
      title: 'Event created!',
      subtitle: 'Share this link with your participants',
      linkCopied: 'Link copied!',
      createAccountTitle: 'Manage your event',
      createAccountDescription: 'Create an account to edit, track responses, and receive notifications.',
      createAccountButton: 'Create an account',
      continueAsGuest: 'Continue without account',
      accountLinked: 'Event linked to your account!',
      shareTitle: 'Share this event',
      shareDescription: 'Anyone with this link can view and participate. You can always return to this event with the same link.',
      copyLink: 'Copy',
      shareByEmail: 'Email',
      addToCalendar: 'Calendar',
    },
    myEvents: {
      title: 'My Events',
      createNew: 'New event',
      noEvents: 'You haven\'t created any events yet.',
      createFirst: 'Create my first event',
      noDescription: 'No description',
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      back: 'Back',
      cancel: 'Cancel',
    },
    notFound: {
      title: 'Page not found',
      description: 'The page you are looking for does not exist.',
      backHome: 'Back to home',
    },
    footer: {
      allRightsReserved: 'All rights reserved.',
      privacyPolicy: 'Privacy Policy',
    },
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated',
      intro: 'At Ensemble, we are committed to protecting your privacy and personal data in accordance with the General Data Protection Regulation (GDPR) and other applicable European laws.',
      dataController: {
        title: 'Data Controller',
        content: 'Ensemble is the data controller for your personal data. For any questions regarding data protection, you can contact us using the details provided in the Contact section.',
      },
      dataCollected: {
        title: 'Data We Collect',
        intro: 'We only collect data necessary for the service to function:',
        items: [
          'Name or nickname (to identify you in events)',
          'Email address (optional, for notifications)',
          'Location (optional, only for the "fair meeting point" feature)',
          'Event participation data (votes, suggestions)',
        ],
      },
      legalBasis: {
        title: 'Legal Basis for Processing',
        intro: 'We process your data on the following bases (Article 6 GDPR):',
        items: [
          'Consent: you agree to participate in events',
          'Contract performance: to provide the event organization service',
          'Legitimate interest: to improve our services',
        ],
      },
      purposes: {
        title: 'Purposes of Processing',
        items: [
          'Enable creation and management of collaborative events',
          'Facilitate voting on dates, locations, and activities',
          'Calculate the fair meeting point (if you share your location)',
          'Send email notifications (if you provided your email)',
        ],
      },
      retention: {
        title: 'Data Retention',
        content: 'Your data is retained for as long as necessary for the purposes for which it was collected. Event data is deleted 12 months after the event date. You can request deletion of your data at any time.',
      },
      sharing: {
        title: 'Data Sharing',
        intro: 'Your data may be shared with:',
        items: [
          'Other participants in your events (name only)',
          'Our technical providers for secure hosting and storage',
          'Mapping services for the fair meeting point feature',
        ],
      },
      rights: {
        title: 'Your Rights',
        intro: 'Under GDPR (Articles 15-22), you have the following rights:',
        items: [
          'Right of access: obtain a copy of your personal data',
          'Right to rectification: correct inaccurate data',
          'Right to erasure ("right to be forgotten"): delete your data',
          'Right to restriction of processing',
          'Right to data portability: receive your data in a structured format',
          'Right to object: object to the processing of your data',
          'Right to withdraw consent at any time',
        ],
        howToExercise: 'To exercise these rights, contact us using the details below. You also have the right to lodge a complaint with your national data protection authority.',
      },
      cookies: {
        title: 'Cookies',
        content: 'We only use essential cookies for the site to function (authentication, language preferences). We do not use tracking or advertising cookies.',
      },
      security: {
        title: 'Security',
        content: 'We implement appropriate technical and organizational measures to protect your data: encryption in transit and at rest, strict access controls, regular security audits.',
      },
      children: {
        title: 'Children\'s Privacy',
        content: 'Our service is not intended for children under 16. We do not knowingly collect personal data from minors without parental consent.',
      },
      updates: {
        title: 'Policy Updates',
        content: 'We may update this privacy policy. Any significant changes will be communicated via the site or by email if you are registered.',
      },
      contact: {
        title: 'Contact Us',
        content: 'For any questions about this policy or to exercise your rights, contact us at: privacy@ensemble.app',
      },
    },
    eventPage: {
      loading: 'Loading event...',
      notFound: 'Event not found',
      notFoundDescription: 'The event you are looking for does not exist or has been deleted.',
      status: { active: 'Active', finalized: 'Finalized', cancelled: 'Cancelled' },
      locationType: { setVenues: 'Set venues', suggestions: 'Open suggestions', fairSpot: 'Fair spot' },
      share: { button: 'Share', copied: 'Link copied!' },
      join: {
        title: 'Join this event',
        description: 'Enter your name to join and vote.',
        yourName: 'Your name',
        namePlaceholder: 'What should we call you?',
        yourEmail: 'Email (optional)',
        emailPlaceholder: 'To receive notifications',
        joinButton: 'Join',
        success: 'You have joined the event!',
        error: 'Error joining event',
        welcomeBack: 'Welcome back, {name}!',
        orLogin: 'Log in',
        orCreateAccount: 'Create account',
        or: 'or',
      },
      dateVoting: {
        title: 'Choose your availability',
        yes: 'Yes',
        no: 'No',
        maybe: 'Maybe',
        votes: 'votes',
        bestDate: 'Best date',
        noDates: 'No dates proposed',
        joinFirst: 'Join the event to vote',
        voteError: 'Error voting',
        confirmAvailability: 'Confirm availability',
        unsavedChanges: '{count} unsaved change(s)',
        reset: 'Reset',
        saving: 'Saving...',
        saved: 'Availability saved!',
        pendingChange: 'Pending',
      },
      activities: {
        title: 'Activities',
        addNew: 'Suggest an activity',
        namePlaceholder: 'Activity name',
        descriptionPlaceholder: 'Description (optional)',
        add: 'Add',
        noActivities: 'No activities suggested yet',
        joinFirst: 'Join the event to suggest',
        addSuccess: 'Activity added!',
        addError: 'Error adding activity',
        voteError: 'Error voting',
        confirmVotes: 'Confirm votes',
        unsavedChanges: '{count} unsaved change(s)',
        reset: 'Reset',
        saving: 'Saving...',
        saved: 'Votes saved!',
        pendingChange: 'Pending',
      },
      location: {
        title: 'Location',
        addSuggestion: 'Suggest a location',
        namePlaceholder: 'Location name',
        addressPlaceholder: 'Address (optional)',
        add: 'Add',
        noLocations: 'No locations suggested',
        joinFirst: 'Join the event to suggest',
        addSuccess: 'Location added!',
        addError: 'Error adding location',
        voteError: 'Error voting',
        fairSpotExplanation: 'The meeting point will be calculated to be fair for everyone.',
        yourLocation: 'Your location',
        locationPlaceholder: 'City or address',
        transportMode: 'Transport mode',
        transportModes: { car: 'Car', publicTransport: 'Public transport', bike: 'Bike', walk: 'Walk' },
        saveLocation: 'Save',
        locationSaved: 'Location saved!',
        locationError: 'Error saving location',
        participantsWithLocation: '{count} participant(s) shared their location',
        enterAddress: 'Enter your address...',
        noResults: 'No address found',
        confirmLocation: 'Confirm this location',
        updateLocation: 'Update my location',
        fairMeetingPoint: 'Fair meeting point',
        calculatingMeetingPoint: 'Calculating meeting point...',
        everyoneLocated: 'All participants have shared their location!',
        waitingForLocations: '{count} participant(s) haven\'t shared their location yet',
        participantsOnMap: 'Participants on map',
        searchByAddress: 'Search',
        selectOnMap: 'Map',
        useMyLocation: 'My location',
        clickToSelect: 'Click on the map to select your location',
        mapLoadError: 'Unable to load map',
        change: 'Change',
        locationPending: 'Pending',
      },
      participants: {
        title: 'Participants',
        noParticipants: 'No participants yet',
        you: 'you',
        organizer: 'Organizer',
      },
      results: {
        title: 'Current Results',
        topDate: 'Top date',
        topActivity: 'Top activity',
        topLocation: 'Top location',
      },
    },
  },
};

export type TranslationKeys = Translations;
