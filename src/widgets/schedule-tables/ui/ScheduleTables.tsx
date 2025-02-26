import { Button, ButtonGroup, Flex, Heading, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { useScheduleActionsContext, useScheduleStateContext } from "../../../app/context";
import { ScheduleTable } from "../../../features/schedule-table/ui";
import { SearchDialog } from "../../../features/search-dialog/ui/SearchDialog";
import { usePreservedCallback } from "../../../shared/hooks";
import { ScheduleDndProvider } from "../context";

export const ScheduleTables = () => {
  const [searchInfo, setSearchInfo] = useState<{
    tableId: string;
    day?: string;
    time?: number;
  } | null>(null);

  const { schedulesMap } = useScheduleStateContext("ScheduleTables");
  const { setSchedules, setSchedulesMap } = useScheduleActionsContext("ScheduleTables");

  const disabledRemoveButton = Object.keys(schedulesMap).length === 1;

  const duplicate = (targetId: string) => {
    setSchedulesMap((prev) => ({
      ...prev,
      [`schedule-${Date.now()}`]: [...prev[targetId]],
    }));
  };

  const remove = (targetId: string) => {
    setSchedulesMap((prev) => {
      delete prev[targetId];
      return { ...prev };
    });
  };

  const handleScheduleTimeClick = usePreservedCallback(
    (tableId: string) => (timeInfo: { day: string; time: number }) => {
      setSearchInfo({ ...timeInfo, tableId });
    },
  );

  const handleDeleteButtonClick = usePreservedCallback(
    (tableId: string) =>
      ({ day, time }: { day: string; time: number }) => {
        setSchedules(tableId, (prev) =>
          prev.filter((schedule) => schedule.day !== day || !schedule.range.includes(time)),
        );
      },
  );

  return (
    <>
      <Flex w="full" gap={6} p={6} flexWrap="wrap">
        {Object.keys(schedulesMap).map((tableId, index) => (
          <Stack key={tableId} width="600px">
            <Flex justifyContent="space-between" alignItems="center">
              <Heading as="h3" fontSize="lg">
                시간표 {index + 1}
              </Heading>
              <ButtonGroup size="sm" isAttached>
                <Button colorScheme="green" onClick={() => setSearchInfo({ tableId })}>
                  시간표 추가
                </Button>
                <Button colorScheme="green" mx="1px" onClick={() => duplicate(tableId)}>
                  복제
                </Button>
                <Button
                  colorScheme="green"
                  isDisabled={disabledRemoveButton}
                  onClick={() => remove(tableId)}
                >
                  삭제
                </Button>
              </ButtonGroup>
            </Flex>

            <ScheduleDndProvider>
              <ScheduleTable
                key={`schedule-table-${index}`}
                tableId={tableId}
                onScheduleTimeClick={handleScheduleTimeClick(tableId)}
                onDeleteButtonClick={handleDeleteButtonClick(tableId)}
              />
            </ScheduleDndProvider>
          </Stack>
        ))}
      </Flex>

      <SearchDialog searchInfo={searchInfo} onClose={() => setSearchInfo(null)} />
    </>
  );
};
