import { ChakraProvider } from "@chakra-ui/react";
import { ScheduleTables } from "../../widgets/schedule-tables/ui";
import { ScheduleProvider } from "../context";

export const App = () => {
  return (
    <ChakraProvider>
      <ScheduleProvider>
        <ScheduleTables />
      </ScheduleProvider>
    </ChakraProvider>
  );
};
