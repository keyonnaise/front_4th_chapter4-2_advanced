import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Table,
  Tag,
  TagCloseButton,
  TagLabel,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import axios, { AxiosResponse } from "axios";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { DAY_LABELS } from "./app/config";
import { useScheduleActionsContext } from "./app/context";
import { usePreservedCallback } from "./shared/hooks";
import { Lecture } from "./types";
import { parseSchedule } from "./utils";

interface Props {
  searchInfo: {
    tableId: string;
    day?: string;
    time?: number;
  } | null;
  onClose: () => void;
}

interface SearchOptions {
  query?: string;
  grades: number[];
  days: string[];
  times: number[];
  majors: string[];
  credits?: number;
}

const TIME_SLOTS = [
  { id: 1, label: "09:00~09:30" },
  { id: 2, label: "09:30~10:00" },
  { id: 3, label: "10:00~10:30" },
  { id: 4, label: "10:30~11:00" },
  { id: 5, label: "11:00~11:30" },
  { id: 6, label: "11:30~12:00" },
  { id: 7, label: "12:00~12:30" },
  { id: 8, label: "12:30~13:00" },
  { id: 9, label: "13:00~13:30" },
  { id: 10, label: "13:30~14:00" },
  { id: 11, label: "14:00~14:30" },
  { id: 12, label: "14:30~15:00" },
  { id: 13, label: "15:00~15:30" },
  { id: 14, label: "15:30~16:00" },
  { id: 15, label: "16:00~16:30" },
  { id: 16, label: "16:30~17:00" },
  { id: 17, label: "17:00~17:30" },
  { id: 18, label: "17:30~18:00" },
  { id: 19, label: "18:00~18:50" },
  { id: 20, label: "18:55~19:45" },
  { id: 21, label: "19:50~20:40" },
  { id: 22, label: "20:45~21:35" },
  { id: 23, label: "21:40~22:30" },
  { id: 24, label: "22:35~23:25" },
];

const PAGE_SIZE = 100;

const fetchMajors = () => axios.get<Lecture[]>("/schedules-majors.json");
const fetchLiberalArts = () => axios.get<Lecture[]>("/schedules-liberal-arts.json");

// TODO: 이 코드를 개선해서 API 호출을 최소화 해보세요 + Promise.all이 현재 잘못 사용되고 있습니다. 같이 개선해주세요.
const fetchAllLectures = async () => {
  return await Promise.all([
    (console.log("API Call 1", performance.now()), fetchMajors()),
    (console.log("API Call 2", performance.now()), fetchLiberalArts()),
    (console.log("API Call 3", performance.now()), fetchMajors()),
    (console.log("API Call 4", performance.now()), fetchLiberalArts()),
    (console.log("API Call 5", performance.now()), fetchMajors()),
    (console.log("API Call 6", performance.now()), fetchLiberalArts()),
  ]);
};

// TODO: 이 컴포넌트에서 불필요한 연산이 발생하지 않도록 다양한 방식으로 시도해주세요.
export const SearchDialog = ({ searchInfo, onClose }: Props) => {
  const { setSchedulesMap } = useScheduleActionsContext("SearchDialog");

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [page, setPage] = useState(1);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: "",
    grades: [],
    days: [],
    times: [],
    majors: [],
  });

  const filteredLectures = useMemo(() => {
    const { query, grades, days, times, majors, credits } = searchOptions;

    return lectures.filter((lecture) => {
      const matchesQuery =
        lecture.title.toLowerCase().includes((query || "").toLowerCase()) ||
        lecture.id.toLowerCase().includes((query || "").toLowerCase());
      const matchesGrade = grades.length === 0 || grades.includes(lecture.grade);
      const matchesMajor = majors.length === 0 || majors.includes(lecture.major);
      const matchesCredit = !credits || lecture.credits.startsWith(String(credits));
      const scheduleMatches = lecture.schedule
        ? parseSchedule(lecture.schedule).some(
            (task) =>
              (days.length === 0 || days.includes(task.day)) &&
              (times.length === 0 || task.range.some((current) => times.includes(current))),
          )
        : true;

      return matchesQuery && matchesGrade && matchesMajor && matchesCredit && scheduleMatches;
    });
  }, [lectures, searchOptions]);

  const lastPage = Math.ceil(filteredLectures.length / PAGE_SIZE);
  const visibleLectures = filteredLectures.slice(0, page * PAGE_SIZE);

  const allMajors = useMemo(
    () => [...new Set(lectures.map((lecture) => lecture.major))],
    [lectures],
  );

  const changeSearchOption = usePreservedCallback(
    (field: keyof SearchOptions, value: SearchOptions[typeof field]) => {
      setPage(1);
      setSearchOptions({ ...searchOptions, [field]: value });
      // loaderWrapperRef.current?.scrollTo(0, 0);
    },
  );

  const addSchedule = usePreservedCallback((lecture: Lecture) => {
    if (!searchInfo) return;

    const { tableId } = searchInfo;
    const schedules = parseSchedule(lecture.schedule).map((schedule) => ({ ...schedule, lecture }));
    setSchedulesMap((prev) => ({ ...prev, [tableId]: [...prev[tableId], ...schedules] }));

    onClose();
  });

  useEffect(() => {
    const start = performance.now();
    console.log("API 호출 시작: ", start);
    fetchAllLectures().then((results) => {
      const end = performance.now();
      console.log("모든 API 호출 완료 ", end);
      console.log("API 호출에 걸린 시간(ms): ", end - start);
      setLectures(results.flatMap((result) => result.data));
    });
  }, [searchInfo]);

  useEffect(() => {
    setSearchOptions((prev) => ({
      ...prev,
      days: searchInfo?.day ? [searchInfo.day] : [],
      times: searchInfo?.time ? [searchInfo.time] : [],
    }));
    setPage(1);
  }, [searchInfo]);

  return (
    <Modal isOpen={Boolean(searchInfo)} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxW="90vw" w="1000px">
        <ModalHeader>수업 검색</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FilterPanel
              allMajors={allMajors}
              searchOptions={searchOptions}
              changeSearchOption={changeSearchOption}
            />
            <Text align="right">검색결과: {filteredLectures.length}개</Text>
            <LectureList
              lectures={visibleLectures}
              page={page}
              lastPage={lastPage}
              addSchedule={addSchedule}
              onLoad={() => setPage((prevPage) => prevPage + 1)}
            />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Sub components
interface FilterPanelProps {
  allMajors: string[];
  searchOptions: SearchOptions;
  changeSearchOption(field: keyof SearchOptions, value: SearchOptions[typeof field]): void;
}

const FilterPanel = memo(({ allMajors, searchOptions, changeSearchOption }: FilterPanelProps) => {
  return (
    <>
      <HStack spacing={4}>
        <SearchKeywordField
          value={searchOptions.query}
          onChange={(e) => changeSearchOption("query", e.target.value)}
        />
        <CreditField
          value={searchOptions.credits}
          onChange={(e) => changeSearchOption("credits", e.target.value)}
        />
      </HStack>

      <HStack spacing={4}>
        <GradeCheckbox
          value={searchOptions.grades}
          onChange={(value) => changeSearchOption("grades", value.map(Number))}
        />
        <DayCheckbox
          value={searchOptions.days}
          onChange={(value) => changeSearchOption("days", String(value))}
        />
      </HStack>

      <HStack spacing={4}>
        <TimeSelector
          times={searchOptions.times}
          value={searchOptions.times}
          onChange={(value) => changeSearchOption("times", value.map(Number))}
        />
        <MajorSelector
          allMajors={allMajors}
          majors={searchOptions.majors}
          value={searchOptions.majors}
          onChange={(value) => changeSearchOption("majors", value.map(String))}
        />
      </HStack>
    </>
  );
});

interface SearchKeywordFieldProps {
  value: string | undefined;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

const SearchKeywordField = memo(
  ({ value, onChange }: SearchKeywordFieldProps) => {
    return (
      <FormControl>
        <FormLabel>검색어</FormLabel>
        <Input placeholder="과목명 또는 과목코드" value={value} onChange={onChange} />
      </FormControl>
    );
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value,
);

interface CreditFieldProps {
  value: number | undefined;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
}

const CreditField = memo(
  ({ value, onChange }: CreditFieldProps) => {
    return (
      <FormControl>
        <FormLabel>학점</FormLabel>
        <Select value={value} onChange={onChange}>
          <option value="">전체</option>
          <option value="1">1학점</option>
          <option value="2">2학점</option>
          <option value="3">3학점</option>
        </Select>
      </FormControl>
    );
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value,
);

interface GradeCheckboxProps {
  value: (string | number)[];
  onChange(value: (string | number)[]): void;
}

const GradeCheckbox = memo(
  ({ value, onChange }: GradeCheckboxProps) => {
    return (
      <FormControl>
        <FormLabel>학년</FormLabel>
        <CheckboxGroup value={value} onChange={onChange}>
          <HStack spacing={4}>
            {[1, 2, 3, 4].map((grade) => (
              <Checkbox key={grade} value={grade}>
                {grade}학년
              </Checkbox>
            ))}
          </HStack>
        </CheckboxGroup>
      </FormControl>
    );
  },
  (prevProps, nextProps) => JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value),
);

interface DayCheckBoxProps {
  value: (string | number)[];
  onChange(value: (string | number)[]): void;
}

const DayCheckbox = memo(
  ({ value, onChange }: DayCheckBoxProps) => {
    return (
      <FormControl>
        <FormLabel>요일</FormLabel>
        <CheckboxGroup value={value} onChange={onChange}>
          <HStack spacing={4}>
            {DAY_LABELS.map((day) => (
              <Checkbox key={day} value={day}>
                {day}
              </Checkbox>
            ))}
          </HStack>
        </CheckboxGroup>
      </FormControl>
    );
  },
  (prevProps, nextProps) => JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value),
);

interface TimeSelectorProps {
  times: number[];
  value: (string | number)[];
  onChange(value: (string | number)[]): void;
}

const TimeSelector = memo(
  ({ times, value, onChange }: TimeSelectorProps) => {
    return (
      <FormControl>
        <FormLabel>시간</FormLabel>
        <CheckboxGroup colorScheme="green" value={value} onChange={onChange}>
          <Wrap spacing={1} mb={2}>
            {times
              .sort((a, b) => a - b)
              .map((time) => (
                <Tag key={time} size="sm" variant="outline" colorScheme="blue">
                  <TagLabel>{time}교시</TagLabel>
                  <TagCloseButton onClick={() => onChange(times.filter((v) => v !== time))} />
                </Tag>
              ))}
          </Wrap>
          <Stack
            spacing={2}
            overflowY="auto"
            h="100px"
            border="1px solid"
            borderColor="gray.200"
            borderRadius={5}
            p={2}
          >
            {TIME_SLOTS.map(({ id, label }) => (
              <Box key={id}>
                <Checkbox key={id} size="sm" value={id}>
                  {id}교시({label})
                </Checkbox>
              </Box>
            ))}
          </Stack>
        </CheckboxGroup>
      </FormControl>
    );
  },
  (prevProps, nextProps) => JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value),
);

interface MajorSelectorProps {
  allMajors: string[];
  majors: string[];
  value: (string | number)[];
  onChange(value: (string | number)[]): void;
}

const MajorSelector = memo(
  ({ majors, allMajors, value, onChange }: MajorSelectorProps) => {
    return (
      <FormControl>
        <FormLabel>전공</FormLabel>
        <CheckboxGroup colorScheme="green" value={value} onChange={onChange}>
          <Wrap spacing={1} mb={2}>
            {majors.map((major) => (
              <Tag key={major} size="sm" variant="outline" colorScheme="blue">
                <TagLabel>{major.split("<p>").pop()}</TagLabel>
                <TagCloseButton onClick={() => onChange(majors.filter((v) => v !== major))} />
              </Tag>
            ))}
          </Wrap>
          <Stack
            spacing={2}
            overflowY="auto"
            h="100px"
            border="1px solid"
            borderColor="gray.200"
            borderRadius={5}
            p={2}
          >
            {allMajors.map((major) => (
              <Box key={major}>
                <Checkbox key={major} size="sm" value={major}>
                  {major.replace(/<p>/gi, " ")}
                </Checkbox>
              </Box>
            ))}
          </Stack>
        </CheckboxGroup>
      </FormControl>
    );
  },
  (prevProps, nextProps) => JSON.stringify(prevProps.value) === JSON.stringify(nextProps.value),
);

interface LectureListProps {
  lectures: Lecture[];
  page: number;
  lastPage: number;
  addSchedule(lecture: Lecture): void;
  onLoad(): void;
}

const LectureList = memo(({ lectures, page, lastPage, addSchedule, onLoad }: LectureListProps) => {
  const loaderWrapperRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const $loader = loaderRef.current;
    const $loaderWrapper = loaderWrapperRef.current;

    if (!$loader || !$loaderWrapper) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < lastPage) onLoad();
      },
      { threshold: 0, root: $loaderWrapper },
    );

    observer.observe($loader);

    return () => observer.unobserve($loader);
  }, [lastPage, page, onLoad]);

  return (
    <Box>
      <Table>
        <Thead>
          <Tr>
            <Th width="100px">과목코드</Th>
            <Th width="50px">학년</Th>
            <Th width="200px">과목명</Th>
            <Th width="50px">학점</Th>
            <Th width="150px">전공</Th>
            <Th width="150px">시간</Th>
            <Th width="80px"></Th>
          </Tr>
        </Thead>
      </Table>

      <Box overflowY="auto" maxH="500px" ref={loaderWrapperRef}>
        <Table size="sm" variant="striped">
          <Tbody>
            {lectures.map((lecture, index) => (
              <Tr key={`${lecture.id}-${index}`}>
                <Td width="100px">{lecture.id}</Td>
                <Td width="50px">{lecture.grade}</Td>
                <Td width="200px">{lecture.title}</Td>
                <Td width="50px">{lecture.credits}</Td>
                <Td width="150px" dangerouslySetInnerHTML={{ __html: lecture.major }} />
                <Td width="150px" dangerouslySetInnerHTML={{ __html: lecture.schedule }} />
                <Td width="80px">
                  <Button size="sm" colorScheme="green" onClick={() => addSchedule(lecture)}>
                    추가
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Box ref={loaderRef} h="20px" />
      </Box>
    </Box>
  );
});
