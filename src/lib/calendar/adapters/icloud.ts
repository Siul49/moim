import { ArrayCalendarAdapter } from "../adapter";
import type { ParsedEvent } from "@/types/icloud";

export class ICloudCalendarAdapter extends ArrayCalendarAdapter<ParsedEvent> {
  readonly source = "icloud";

  protected getExternalId(event: ParsedEvent): string {
    return event.uid;
  }

  protected getTitle(event: ParsedEvent): string {
    return event.title || "";
  }

  protected getStartAt(event: ParsedEvent): Date {
    return event.startAt;
  }

  protected getEndAt(event: ParsedEvent): Date {
    return event.endAt;
  }

  protected getIsAllDay(event: ParsedEvent): boolean {
    return event.isAllDay;
  }

  protected getLocation(event: ParsedEvent): string | undefined {
    return event.location;
  }

  protected getDescription(event: ParsedEvent): string | undefined {
    return event.description;
  }
}

export const icloudAdapter = new ICloudCalendarAdapter();
