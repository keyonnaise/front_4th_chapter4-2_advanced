import { useMemo, useState } from "react";
import dummySchedulesMap from "../../__mock__/dummySchedulesMap";
import { usePreservedCallback } from "../../shared/hooks";
import { createSafeContext } from "../../shared/lib";
import { Schedule } from "../../types";

interface Props {
  children: React.ReactNode;
}

export const ScheduleProvider = ({ children }: Props) => {
  const [state, setState] = useState<ContextState>({
    schedulesMap: dummySchedulesMap,
  });

  const getSchedules = usePreservedCallback<ContextActions["getSchedules"]>(
    (tableId) => state.schedulesMap[tableId],
  );

  const setSchedules = usePreservedCallback<ContextActions["setSchedules"]>((tableId, updater) => {
    setSchedulesMap((prev) => ({
      ...prev,
      [tableId]: typeof updater === "function" ? updater(prev[tableId]) : updater,
    }));
  });

  const setSchedulesMap = usePreservedCallback<ContextActions["setSchedulesMap"]>((updater) => {
    setState((prev) => ({
      ...prev,
      schedulesMap: typeof updater === "function" ? updater(prev.schedulesMap) : updater,
    }));
  });

  const actions = useMemo<ContextActions>(
    () => ({
      getSchedules,
      setSchedules,
      setSchedulesMap,
    }),
    [getSchedules, setSchedules, setSchedulesMap],
  );

  return (
    <ScheduleStateProvider {...state}>
      <ScheduleActionsProvider {...actions}>{children}</ScheduleActionsProvider>
    </ScheduleStateProvider>
  );
};

interface ContextState {
  schedulesMap: Record<string, Schedule[]>;
}

interface ContextActions {
  getSchedules(tableId: string): Schedule[];
  setSchedules(tableId: string, updater: ((prev: Schedule[]) => Schedule[]) | Schedule[]): void;
  setSchedulesMap: React.Dispatch<React.SetStateAction<Record<string, Schedule[]>>>;
}

export const [ScheduleStateProvider, useScheduleStateContext] =
  createSafeContext<ContextState>("ScheduleStateProvider");
export const [ScheduleActionsProvider, useScheduleActionsContext] =
  createSafeContext<ContextActions>("ScheduleActionsProvider");
