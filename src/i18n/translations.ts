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
    },
    notFound: {
      title: 'Page non trouvée',
      description: 'La page que vous recherchez n\'existe pas.',
      backHome: 'Retour à l\'accueil',
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
    },
    notFound: {
      title: 'Page not found',
      description: 'The page you are looking for does not exist.',
      backHome: 'Back to home',
    },
  },
};

export type TranslationKeys = Translations;
