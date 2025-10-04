import { google } from "googleapis";

// Check if Google Calendar integration is configured
const isConfigured = () => {
  return !!(
    process.env.GOOGLE_CALENDAR_CLIENT_ID &&
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET &&
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN
  );
};

// Get OAuth2 client
const getOAuth2Client = () => {
  if (!isConfigured()) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    "http://localhost"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  });

  return oauth2Client;
};

export type CalendarEvent = {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
};

export async function createGoogleMeetEvent(event: CalendarEvent): Promise<{ eventId: string; meetLink: string } | null> {
  const auth = getOAuth2Client();
  if (!auth) {
    console.warn("Google Calendar not configured, skipping event creation");
    return null;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: "America/Mexico_City",
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: "America/Mexico_City",
        },
        attendees: event.attendees?.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video"
    )?.uri;

    return {
      eventId: response.data.id || "",
      meetLink: meetLink || "",
    };
  } catch (error) {
    console.error("Error creating Google Meet event:", error);
    return null;
  }
}

export async function deleteGoogleMeetEvent(eventId: string): Promise<boolean> {
  const auth = getOAuth2Client();
  if (!auth) {
    return false;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error("Error deleting Google Meet event:", error);
    return false;
  }
}
