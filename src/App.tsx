import { ChakraProvider } from "@chakra-ui/react";
import { ScheduleProvider } from "./app/context/ScheduleProvider.tsx";
import { ScheduleTables } from "./ScheduleTables.tsx";
import ScheduleDndProvider from "./app/context/ScheduleDndProvider.tsx";

function App() {
  return (
    <ChakraProvider>
      <ScheduleProvider>
        <ScheduleDndProvider>
          <ScheduleTables />
        </ScheduleDndProvider>
      </ScheduleProvider>
    </ChakraProvider>
  );
}

export default App;
