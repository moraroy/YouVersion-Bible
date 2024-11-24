import {
  definePlugin,
  ServerAPI,
  staticClasses,
} from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { FaBible } from "react-icons/fa";
import { getVerseOfTheDay } from "@glowstudent/youversion";
import notify from './notify';

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [verseOfTheDay, setVerseOfTheDay] = useState<{ citation: string, passage: string } | null>(null);

  useEffect(() => {
    // Set the serverAPI in the notify class
    notify.setServer(serverAPI);

    // Display the verse of the day as a toast notification when the plugin is loaded
    (async () => {
      try {
        const verseOfTheDay = await getVerseOfTheDay(); // Removed serverAPI argument
        if (verseOfTheDay && 'citation' in verseOfTheDay && 'passage' in verseOfTheDay) {
          notify.toast(verseOfTheDay.citation.toString(), verseOfTheDay.passage.toString());
          // Also set the verse of the day in the state
          setVerseOfTheDay({
            citation: verseOfTheDay.citation.toString(),
            passage: verseOfTheDay.passage.toString(),
          });
        }
      } catch (error) {
        console.error("Failed to fetch the verse of the day:", error);
      }
    })();
  }, [serverAPI]);

  return (
    <div>
      {verseOfTheDay && (
        <div>
          <h2>Verse of the Day</h2>
          <p>{verseOfTheDay.citation}</p>
          <p>{verseOfTheDay.passage}</p>
        </div>
      )}
    </div>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>YouVersion</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaBible />,
  };
});