import type {
  CalendarEvent,
  CalendarEventSource,
} from "@/types/calendar-event";

export abstract class BaseCalendarAdapter<TRaw, TItem = TRaw> {
  abstract readonly source: CalendarEventSource;

  protected abstract getExternalId(item: TItem): string;
  protected abstract getTitle(item: TItem): string;
  protected abstract getStartAt(item: TItem): Date;
  protected abstract getEndAt(item: TItem): Date;
  protected abstract getIsAllDay(item: TItem): boolean;

  protected getLocation(_item: TItem): string | undefined {
    return undefined;
  }

  protected getDescription(_item: TItem): string | undefined {
    return undefined;
  }

  /**
   * Template Method to map a single item to a standard CalendarEvent.
   * Standardizes fallback title, ID formatting, source name, and spacing.
   */
  protected mapToCalendarEvent(item: TItem): CalendarEvent {
    const externalId = this.getExternalId(item);
    return {
      id: `${this.source}:${externalId}`,
      externalId,
      title: this.getTitle(item).trim() || "(제목 없음)",
      startAt: this.getStartAt(item),
      endAt: this.getEndAt(item),
      isAllDay: this.getIsAllDay(item),
      source: this.source,
      location: this.getLocation(item),
      description: this.getDescription(item),
    };
  }

  abstract toCalendarEvents(raw: TRaw): CalendarEvent[];
}

export abstract class ArrayCalendarAdapter<TItem> extends BaseCalendarAdapter<
  TItem[],
  TItem
> {
  toCalendarEvents(events: TItem[]): CalendarEvent[] {
    return this.filterEvents(events).map((item) =>
      this.mapToCalendarEvent(item),
    );
  }

  /**
   * Optional hook to filter raw events before mapping.
   */
  protected filterEvents(events: TItem[]): TItem[] {
    return events;
  }
}
