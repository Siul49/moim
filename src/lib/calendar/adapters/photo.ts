import { BaseCalendarAdapter } from "../adapter";
import type { CalendarEvent } from "@/types/calendar-event";

export interface PhotoExtractionResult {
  /** 모델이 사진에서 추출한 busy 슬롯 (절대 시각). */
  busy: { startAt: Date; endAt: Date; title?: string }[];
}

export class PhotoCalendarAdapter extends BaseCalendarAdapter<
  PhotoExtractionResult,
  PhotoExtractionResult["busy"][number]
> {
  readonly source = "photo";

  protected getExternalId(_item: {
    startAt: Date;
    endAt: Date;
    title?: string;
  }): string {
    throw new Error("photoAdapter is not implemented yet");
  }

  protected getTitle(item: {
    startAt: Date;
    endAt: Date;
    title?: string;
  }): string {
    return item.title || "";
  }

  protected getStartAt(item: {
    startAt: Date;
    endAt: Date;
    title?: string;
  }): Date {
    return item.startAt;
  }

  protected getEndAt(item: {
    startAt: Date;
    endAt: Date;
    title?: string;
  }): Date {
    return item.endAt;
  }

  protected getIsAllDay(_item: {
    startAt: Date;
    endAt: Date;
    title?: string;
  }): boolean {
    return false;
  }

  toCalendarEvents(_raw: PhotoExtractionResult): CalendarEvent[] {
    throw new Error(
      "photoAdapter.toCalendarEvents: 후속 이슈(AI 사진 추출)에서 구현 예정",
    );
  }
}

export const photoAdapter = new PhotoCalendarAdapter();
