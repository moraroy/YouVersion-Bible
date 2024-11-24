import {
  definePlugin,
  ServerAPI,
  staticClasses,
} from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { FaBible } from "react-icons/fa";
import { getVerseOfTheDay } from "@glowstudent/youversion";

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [verseOfTheDay, setVerseOfTheDay] = useState<{ citation: string, passage: string } | null>(null);

  // This will hold the serverAPI for later use (if needed)
  const [serverAPIInstance, setServerAPIInstance] = useState<ServerAPI | null>(null);

  // Set the serverAPI instance when the component is mounted
  useEffect(() => {
    if (serverAPI) {
      setServerAPIInstance(serverAPI);
    }
  }, [serverAPI]);

  // Fetch the Verse of the Day when the component mounts
  useEffect(() => {
    // Fetch Verse of the Day from API and set it in the state
    const fetchVerseOfTheDay = async () => {
      try {
        const verse = await getVerseOfTheDay(); // Fetch without passing serverAPI

        // Ensure that verse is in the expected format
        if (verse && 'citation' in verse && 'passage' in verse) {
          setVerseOfTheDay({
            citation: verse.citation.toString(),
            passage: verse.passage.toString(),
          });

          // Notify the user (you can customize this part as needed)
          if (serverAPIInstance && serverAPIInstance.toaster) {
            serverAPIInstance.toaster.toast({
              title: verse.citation.toString(),
              body: verse.passage.toString(),
              duration: 8000,
            });
          }
        } else {
          console.error("Verse of the day is not in the expected format:", verse);
        }
      } catch (error) {
        console.error("Failed to fetch the verse of the day:", error);
      }
    };

    fetchVerseOfTheDay();
  }, [serverAPIInstance]); // Dependency array to refetch if serverAPIInstance changes

  return (
    <div>
      {verseOfTheDay ? (
        <div>
          <h2>Verse of the Day</h2>
          <p><strong>{verseOfTheDay.citation}</strong></p>
          <p>{verseOfTheDay.passage}</p>
        </div>
      ) : (
        <p>Loading Verse of the Day...</p>
      )}
    </div>
  );
};

// Define the plugin
export default definePlugin((serverApi: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>YouVersion</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaBible />,
  };
});
