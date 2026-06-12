import { ArrayCalendarAdapter } from "../adapter";
import type { GoogleEvent } from "@/types/google-calendar";

export class GoogleCalendarAdapter extends ArrayCalendarAdapter<GoogleEvent> {
  readonly source = "google";

  protected filterEvents(events: GoogleEvent[]): GoogleEvent[] {
    return events.filter((event) => event.status !== "cancelled");
  }

  protected getExternalId(event: GoogleEvent): string {
    return event.id;
  }

  protected getTitle(event: GoogleEvent): string {
    return event.summary || "";
  }

  protected getStartAt(event: GoogleEvent): Date {
    if (event.start.date) {
      return this.parseAllDay(event.start.date);
    }
    if (event.start.dateTime) {
      const date = new Date(event.start.dateTime);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    throw new Error(
      `Google calendar event start time is invalid or missing for event ID: ${event.id}`,
    );
  }

  protected getEndAt(event: GoogleEvent): Date {
    if (event.end.date) {
      return this.parseAllDay(event.end.date);
    }
    if (event.end.dateTime) {
      const date = new Date(event.end.dateTime);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    throw new Error(
      `Google calendar event end time is invalid or missing for event ID: ${event.id}`,
    );
  }

  protected getIsAllDay(event: GoogleEvent): boolean {
    return Boolean(event.start.date && event.end.date);
  }

  protected getLocation(event: GoogleEvent): string | undefined {
    return event.location;
  }

  protected getDescription(event: GoogleEvent): string | undefined {
    return event.description;
  }

  private parseAllDay(yyyymmdd: string): Date {
    const [y, m, d] = yyyymmdd.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
}

export const googleAdapter = new GoogleCalendarAdapter();
