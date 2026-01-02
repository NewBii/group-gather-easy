import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { useEventData } from '@/hooks/useEventData';
import { useParticipant } from '@/hooks/useParticipant';
import { EventHeader } from '@/components/event/EventHeader';
import { ParticipantJoinForm } from '@/components/event/ParticipantJoinForm';
import { DateVoting } from '@/components/event/DateVoting';
import { ActivitySection } from '@/components/event/ActivitySection';
import { LocationSection } from '@/components/event/LocationSection';
import { ParticipantsList } from '@/components/event/ParticipantsList';
import { VoteResults } from '@/components/event/VoteResults';

const Event = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();

  const {
    event,
    dateOptions,
    dateVotes,
    participants,
    activities,
    activityVotes,
    locationSuggestions,
    locationVotes,
    loading,
    error,
  } = useEventData(id);

  const {
    currentParticipant,
    loading: participantLoading,
    joinEvent,
    updateLocation,
  } = useParticipant(event?.id);

  // Loading state
  if (loading || participantLoading) {
    return (
      <div className="container py-16 md:py-24">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{t.eventPage.loading}</p>
        </div>
      </div>
    );
  }

  // Error state / Not found
  if (error || !event) {
    return (
      <div className="container py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {t.eventPage.notFound}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t.eventPage.notFoundDescription}
          </p>
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.event.backHome}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.event.backHome}
          </Link>
        </Button>

        {/* Event header */}
        <EventHeader event={event} />

        {/* Vote results summary */}
        <VoteResults
          dateOptions={dateOptions}
          dateVotes={dateVotes}
          activities={activities}
          activityVotes={activityVotes}
          locationSuggestions={locationSuggestions}
          locationVotes={locationVotes}
        />

        {/* Join form or welcome back */}
        <ParticipantJoinForm
          eventSlug={event.unique_slug}
          onJoin={joinEvent}
          currentParticipant={currentParticipant}
        />

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: Voting sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date voting */}
            {dateOptions.length > 0 && (
              <DateVoting
                dateOptions={dateOptions}
                dateVotes={dateVotes}
                participantId={currentParticipant?.id}
                participantsCount={participants.length}
              />
            )}

            {/* Activity section */}
            <ActivitySection
              eventId={event.id}
              activities={activities}
              activityVotes={activityVotes}
              participantId={currentParticipant?.id}
              participantsCount={participants.length}
            />

            {/* Location section */}
            {event.location_type && (
              <LocationSection
                event={event}
                locationSuggestions={locationSuggestions}
                locationVotes={locationVotes}
                participants={participants}
                participantId={currentParticipant?.id}
                onUpdateLocation={updateLocation}
              />
            )}
          </div>

          {/* Right column: Participants */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ParticipantsList
                participants={participants}
                currentParticipantId={currentParticipant?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Event;
