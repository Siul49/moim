import { BaseCalendarAdapter } from "../adapter";
import type { TimeSlot, DayCode } from "@/types/schedule";
import type { CalendarEvent } from "@/types/calendar-event";

const DAY_OFFSET: Record<DayCode, number> = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
  SAT: 5,
  SUN: 6,
};

export interface ManualAdapterInput {
  slots: TimeSlot[];
  weekStart?: Date;
}

export class ManualCalendarAdapter extends BaseCalendarAdapter<
  ManualAdapterInput,
  { slot: TimeSlot; index: number; weekStart: Date }
> {
  readonly source = "manual";

  protected getExternalId(item: { slot: TimeSlot; index: number }): string {
    return `${item.index}:${item.slot.day}-${item.slot.startHour}-${item.slot.endHour}`;
  }

  protected getTitle(_item: unknown): string {
    return "가용";
  }

  protected getStartAt(item: { slot: TimeSlot; weekStart: Date }): Date {
    return this.addHours(
      item.weekStart,
      DAY_OFFSET[item.slot.day] * 24 + item.slot.startHour,
    );
  }

  protected getEndAt(item: { slot: TimeSlot; weekStart: Date }): Date {
    return this.addHours(
      item.weekStart,
      DAY_OFFSET[item.slot.day] * 24 + item.slot.endHour,
    );
  }

  protected getIsAllDay(_item: unknown): boolean {
    return false;
  }

  toCalendarEvents(raw: ManualAdapterInput): CalendarEvent[] {
    const weekStart = raw.weekStart ?? this.getThisMonday();
    return raw.slots.map((slot, index) =>
      this.mapToCalendarEvent({ slot, index, weekStart }),
    );
  }

  private addHours(base: Date, hours: number): Date {
    const next = new Date(base);
    next.setHours(next.getHours() + hours);
    return next;
  }

  private getThisMonday(): Date {
    const now = new Date();
    const day = now.getDay(); // 0=Sun ... 6=Sat
    const diffFromMonday = (day + 6) % 7;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - diffFromMonday);
    return monday;
  }
}

export const manualAdapter = new ManualCalendarAdapter();

export interface ManualToFreeOptions {
  /** 기준 주의 월요일 0시 (호출자 timezone). 없으면 이번 주 월요일 사용. */
  weekStart?: Date;
}

export function manualSlotsToFreeEvents(
  slots: TimeSlot[],
  options: ManualToFreeOptions = {},
): CalendarEvent[] {
  return manualAdapter.toCalendarEvents({
    slots,
    weekStart: options.weekStart,
  });
}
