export type Language = 'fr' | 'en';

interface Translations {
  nav: {
    home: string;
    createEvent: string;
    guides: string;
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
    comingSoon: string;
  };
  guides: {
    title: string;
    description: string;
    categories: {
      friends: string;
      family: string;
      birthdays: string;
      tips: string;
    };
    comingSoon: string;
  };
  event: {
    notFound: string;
    backHome: string;
  };
  common: {
    loading: string;
    error: string;
    back: string;
  };
  notFound: {
    title: string;
    description: string;
    backHome: string;
  };
}

export const translations: Record<Language, Translations> = {
  fr: {
    nav: {
      home: 'Accueil',
      createEvent: 'Créer un événement',
      guides: 'Guides',
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
      comingSoon: 'Formulaire de création bientôt disponible',
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
      comingSoon: 'Creation form coming soon',
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
