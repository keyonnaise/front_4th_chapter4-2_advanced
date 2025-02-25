import { useMemo, useState } from "react";
import { createSafeContext } from "../../shared/lib/createSafeContext";
import { Schedule } from "../../types";
import dummyScheduleMap from "../../dummyScheduleMap";
import { usePreservedCallback } from "../../shared/hooks/usePreservedCallback";

interface Props {
  children: React.ReactNode;
}

function ScheduleProvider({ children }: Props) {
  const [state, setState] = useState<ContextState>({
    schedulesMap: dummyScheduleMap,
  });

  const setSchedulesMap = usePreservedCallback<
    ContextActions["setSchedulesMap"]
  >((updater) => {
    setState((prev) => ({
      ...prev,
      schedulesMap:
        typeof updater === "function" ? updater(prev.schedulesMap) : updater,
    }));
  });

  const actions = useMemo<ContextActions>(
    () => ({
      setSchedulesMap,
    }),
    [setSchedulesMap]
  );

  return (
    <ScheduleStateProvider {...state}>
      <ScheduleActionsProvider {...actions}>{children}</ScheduleActionsProvider>
    </ScheduleStateProvider>
  );
}

interface ContextState {
  schedulesMap: Record<string, Schedule[]>;
}

interface ContextActions {
  setSchedulesMap: React.Dispatch<
    React.SetStateAction<Record<string, Schedule[]>>
  >;
}

export const [ScheduleStateProvider, useScheduleStateContext] =
  createSafeContext<ContextState>("ScheduleStateProvider");
export const [ScheduleActionsProvider, useScheduleActionsContext] =
  createSafeContext<ContextActions>("ScheduleActionsProvider");

export default ScheduleProvider;
