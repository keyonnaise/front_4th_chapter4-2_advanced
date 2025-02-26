import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import { useDndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ComponentProps, Fragment, memo, useMemo } from "react";
import { CellSize, DAY_LABELS, 분 } from "../../../app/config";
import { useScheduleStateContext } from "../../../app/context";
import { fill2, parseHnM } from "../../../shared/lib/scheduleUtils";
import { Schedule } from "../../../types";

const TIMES = [
  ...Array(18)
    .fill(0)
    .map((v, k) => v + k * 30 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 30 * 분)}`),

  ...Array(6)
    .fill(18 * 30 * 분)
    .map((v, k) => v + k * 55 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 50 * 분)}`),
] as const;

interface TimeInfo {
  day: string;
  time: number;
}

interface Props {
  tableId: string;
  onScheduleTimeClick?: (timeInfo: TimeInfo) => void;
  onDeleteButtonClick?: (timeInfo: TimeInfo) => void;
}

export const ScheduleTable = memo(
  ({ tableId, onScheduleTimeClick, onDeleteButtonClick }: Props) => {
    const { schedulesMap } = useScheduleStateContext("ScheduleTable");
    const schedules = schedulesMap[tableId];

    const dndContext = useDndContext();
    const activeTableId = useMemo(() => {
      const activeId = dndContext.active?.id;
      return activeId ? String(activeId).split(":")[0] : null;
    }, [dndContext]);

    const getColor = (lectureId: string): string => {
      const lectures = [...new Set(schedules.map(({ lecture }) => lecture.id))];
      const colors = ["#fdd", "#ffd", "#dff", "#ddf", "#fdf", "#dfd"];
      return colors[lectures.indexOf(lectureId) % colors.length];
    };

    return (
      <Box
        position="relative"
        outline={tableId === activeTableId ? "5px dashed" : undefined}
        outlineColor="blue.300"
      >
        <Timetable onScheduleTimeClick={onScheduleTimeClick} />

        {schedules.map((schedule, index) => (
          <DraggableSchedule
            key={`${schedule.lecture.title}-${index}`}
            id={`${tableId}:${index}`}
            data={schedule}
            bg={getColor(schedule.lecture.id)}
            onDeleteButtonClick={() =>
              onDeleteButtonClick?.({
                day: schedule.day,
                time: schedule.range[0],
              })
            }
          />
        ))}
      </Box>
    );
  },
  (prevProps, nextProps) => prevProps.tableId === nextProps.tableId,
);

// Sub Components
interface TimetableProps {
  onScheduleTimeClick?: (timeInfo: TimeInfo) => void;
}

const Timetable = memo(({ onScheduleTimeClick }: TimetableProps) => {
  return (
    <Grid
      templateColumns={`120px repeat(${DAY_LABELS.length}, ${CellSize.WIDTH}px)`}
      templateRows={`40px repeat(${TIMES.length}, ${CellSize.HEIGHT}px)`}
      bg="white"
      fontSize="sm"
      textAlign="center"
      outline="1px solid"
      outlineColor="gray.300"
    >
      <GridItem key="교시" borderColor="gray.300" bg="gray.100">
        <Flex justifyContent="center" alignItems="center" h="full" w="full">
          <Text fontWeight="bold">교시</Text>
        </Flex>
      </GridItem>
      {DAY_LABELS.map((day) => (
        <GridItem key={day} borderLeft="1px" borderColor="gray.300" bg="gray.100">
          <Flex justifyContent="center" alignItems="center" h="full">
            <Text fontWeight="bold">{day}</Text>
          </Flex>
        </GridItem>
      ))}
      {TIMES.map((time, timeIndex) => (
        <Fragment key={`시간-${timeIndex + 1}`}>
          <GridItem
            borderTop="1px solid"
            borderColor="gray.300"
            bg={timeIndex > 17 ? "gray.200" : "gray.100"}
          >
            <Flex justifyContent="center" alignItems="center" h="full">
              <Text fontSize="xs">
                {fill2(timeIndex + 1)} ({time})
              </Text>
            </Flex>
          </GridItem>
          {DAY_LABELS.map((day) => (
            <GridItem
              key={`${day}-${timeIndex + 2}`}
              borderWidth="1px 0 0 1px"
              borderColor="gray.300"
              bg={timeIndex > 17 ? "gray.100" : "white"}
              cursor="pointer"
              _hover={{ bg: "yellow.100" }}
              onClick={() => onScheduleTimeClick?.({ day, time: timeIndex + 1 })}
            />
          ))}
        </Fragment>
      ))}
    </Grid>
  );
});

interface DraggableScheduleProps {
  id: string;
  data: Schedule;
  onDeleteButtonClick?(): void;
}

const DraggableSchedule = ({
  id,
  data,
  bg,
  onDeleteButtonClick,
}: DraggableScheduleProps & ComponentProps<typeof Box>) => {
  const { day, range, room, lecture } = data;
  const { attributes, setNodeRef, listeners, transform } = useDraggable({
    id,
  });
  const leftIndex = DAY_LABELS.indexOf(day as (typeof DAY_LABELS)[number]);
  const topIndex = range[0] - 1;
  const size = range.length;

  return (
    <Popover>
      <PopoverTrigger>
        <Box
          position="absolute"
          left={`${120 + CellSize.WIDTH * leftIndex + 1}px`}
          top={`${40 + (topIndex * CellSize.HEIGHT + 1)}px`}
          width={CellSize.WIDTH - 1 + "px"}
          height={CellSize.HEIGHT * size - 1 + "px"}
          bg={bg}
          p={1}
          boxSizing="border-box"
          cursor="pointer"
          ref={setNodeRef}
          transform={CSS.Translate.toString(transform)}
          {...listeners}
          {...attributes}
        >
          <Text fontSize="sm" fontWeight="bold">
            {lecture.title}
          </Text>
          <Text fontSize="xs">{room}</Text>
        </Box>
      </PopoverTrigger>
      <PopoverContent onClick={(event) => event.stopPropagation()}>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          <Text>강의를 삭제하시겠습니까?</Text>
          <Button colorScheme="red" size="xs" onClick={onDeleteButtonClick}>
            삭제
          </Button>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
