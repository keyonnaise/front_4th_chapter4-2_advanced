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
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { DAY_LABELS } from "../../../app/config";
import { useScheduleActionsContext } from "../../../app/context";
import { usePreservedCallback } from "../../../shared/hooks";
import { parseSchedule } from "../../../shared/lib";
import { Lecture } from "../../../types";
import { PAGE_SIZE, TIME_SLOTS } from "../constants";

interface SearchInfo {
  tableId: string;
  day?: string;
  time?: number;
}

interface SearchOptions {
  query?: string;
  grades: number[];
  days: string[];
  times: number[];
  majors: string[];
  credits?: number;
}

interface Props {
  searchInfo: SearchInfo | null;
  onClose(): void;
}

export const SearchDialog = memo(({ searchInfo, onClose }: Props) => {
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
    const { query = "", grades, days, times, majors, credits } = searchOptions;
    return lectures.filter((lecture) => {
      const matchesQuery =
        lecture.title.toLowerCase().includes(query.toLowerCase()) ||
        lecture.id.toLowerCase().includes(query.toLowerCase());
      const matchesDay =
        days.length !== 0
          ? (lecture.schedule ? parseSchedule(lecture.schedule) : []).some((s) =>
              days.includes(s.day),
            )
          : true;
      const matchesTime =
        times.length !== 0
          ? (lecture.schedule ? parseSchedule(lecture.schedule) : []).some((s) =>
              s.range.some((time) => times.includes(time)),
            )
          : true;
      const matchesGrade = grades.length === 0 || grades.includes(lecture.grade);
      const matchesMajor = majors.length === 0 || majors.includes(lecture.major);
      const matchesCredit = !credits || lecture.credits.startsWith(String(credits));

      return (
        matchesQuery && matchesDay && matchesTime && matchesGrade && matchesMajor && matchesCredit
      );
    });
  }, [lectures, searchOptions]);

  const lastPage = Math.ceil(filteredLectures.length / PAGE_SIZE);
  const visibleLectures = filteredLectures.slice(0, page * PAGE_SIZE);
  const allMajors = [...new Set(lectures.map((lecture) => lecture.major))];

  const changeSearchOption = usePreservedCallback(
    (field: keyof SearchOptions, value: SearchOptions[typeof field]) => {
      setPage(1);
      setSearchOptions({ ...searchOptions, [field]: value });
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
              majors={allMajors}
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
});

// Sub component
interface FilterPanelProps {
  majors: string[];
  searchOptions: SearchOptions;
  changeSearchOption(field: keyof SearchOptions, value: SearchOptions[typeof field]): void;
}

const FilterPanel = memo(({ majors, searchOptions, changeSearchOption }: FilterPanelProps) => {
  return (
    <>
      <HStack spacing={4}>
        <FormControl>
          <FormLabel>검색어</FormLabel>
          <Input
            placeholder="과목명 또는 과목코드"
            value={searchOptions.query}
            onChange={(e) => changeSearchOption("query", e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel>학점</FormLabel>
          <Select
            value={searchOptions.credits}
            onChange={(e) => changeSearchOption("credits", e.target.value)}
          >
            <option value="">전체</option>
            <option value="1">1학점</option>
            <option value="2">2학점</option>
            <option value="3">3학점</option>
          </Select>
        </FormControl>
      </HStack>
      <HStack spacing={4}>
        <CheckboxField
          label="학년"
          options={[
            { label: "1학년", value: 1 },
            { label: "2학년", value: 2 },
            { label: "3학년", value: 3 },
            { label: "4학년", value: 4 },
          ]}
          value={searchOptions.grades}
          onChangeValue={(value) => changeSearchOption("grades", value.map(Number))}
        />
        <CheckboxField
          label="요일"
          options={DAY_LABELS.reduce(
            (options, label) => [...options, { label, value: label }],
            [] as Option[],
          )}
          value={searchOptions.days}
          onChangeValue={(value) => changeSearchOption("days", value.map(String))}
        />
      </HStack>
      <HStack spacing={4}>
        <SelectorField
          label="시간"
          options={TIME_SLOTS.map(({ id, label }) => ({ label, value: id }))}
          value={searchOptions.times}
          onChangeValue={(value) => changeSearchOption("times", value.map(Number))}
        />
        <SelectorField
          label="전공"
          options={majors.map((major) => ({ label: major.replace(/<p>/gi, " "), value: major }))}
          value={searchOptions.majors}
          onChangeValue={(value) => changeSearchOption("majors", value.map(String))}
        />
      </HStack>
    </>
  );
});

interface Option {
  label: string;
  value: string | number | undefined;
}

/* -------------------------------------------------------------------------------------------------
 * CheckboxField
 * -----------------------------------------------------------------------------------------------*/

interface CheckboxFieldProps {
  label: string;
  options: Option[];
  value: (string | number)[] | undefined;
  onChangeValue(value: (string | number)[]): void;
}

const CheckboxField = ({ label, options, value, onChangeValue }: CheckboxFieldProps) => {
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <CheckboxGroup value={value} onChange={onChangeValue}>
        <HStack spacing={4}>
          {options.map(({ label, value }, i) => (
            <Checkbox key={i} value={value}>
              {label}
            </Checkbox>
          ))}
        </HStack>
      </CheckboxGroup>
    </FormControl>
  );
};

/* -------------------------------------------------------------------------------------------------
 * SelectorField
 * -----------------------------------------------------------------------------------------------*/

interface SelectorFieldProps {
  label: string;
  options: Option[];
  value: (string | number)[] | undefined;
  onChangeValue(value: (string | number)[]): void;
}

const SelectorField = ({ label, options, value, onChangeValue }: SelectorFieldProps) => {
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <CheckboxGroup colorScheme="green" value={value} onChange={onChangeValue}>
        <Wrap spacing={1} mb={2}>
          {value?.map((current, i) => (
            <Tag key={i} size="sm" variant="outline" colorScheme="blue">
              <TagLabel>{options.find((option) => option.value === current)?.label}</TagLabel>
              <TagCloseButton
                onClick={() => onChangeValue(value?.filter((v) => v !== current) || [])}
              />
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
          {options.map(({ label, value }, i) => (
            <Checkbox key={i} size="sm" value={value}>
              {label}
            </Checkbox>
          ))}
        </Stack>
      </CheckboxGroup>
    </FormControl>
  );
};

/* -------------------------------------------------------------------------------------------------
 * LectureList
 * -----------------------------------------------------------------------------------------------*/

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
    loaderWrapperRef.current?.scrollTo(0, 0);
  }, [lectures]);

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

// Utils
const fetchMajors = () => axios.get<Lecture[]>("/schedules-majors.json");
const fetchLiberalArts = () => axios.get<Lecture[]>("/schedules-liberal-arts.json");

// TODO: 이 코드를 개선해서 API 호출을 최소화 해보세요 + Promise.all이 현재 잘못 사용되고 있습니다. 같이 개선해주세요.
const fetchAllLectures = (() => {
  let temp: AxiosResponse<Lecture[]>[];

  return async () => {
    if (temp === undefined) {
      temp = await Promise.all([
        (console.log("API Call 1", performance.now()), fetchMajors()),
        (console.log("API Call 2", performance.now()), fetchLiberalArts()),
        (console.log("API Call 3", performance.now()), fetchMajors()),
        (console.log("API Call 4", performance.now()), fetchLiberalArts()),
        (console.log("API Call 5", performance.now()), fetchMajors()),
        (console.log("API Call 6", performance.now()), fetchLiberalArts()),
      ]);
    }
    return temp;
  };
})();
