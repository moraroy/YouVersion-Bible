import {
  definePlugin,
  ServerAPI,
  staticClasses,
} from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { FaBible } from "react-icons/fa";
import { getVerseOfTheDay } from "@glowstudent/youversion";

// Define the Content component
const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [verseOfTheDay, setVerseOfTheDay] = useState<{ citation: string; passage: string } | null>(null);
  const [error, setError] = useState<string | null>(null); // To capture and display errors
  const [loading, setLoading] = useState<boolean>(true); // To show a loading state

  // Function to log Verse of the Day to console and handle errors
  const logVerseOfTheDay = async (): Promise<void> => {
    if (!serverAPI) {
      const errMsg = "serverAPI is not defined";
      console.error(errMsg); // Log the error
      setError(errMsg); // Show the error to the user
      setLoading(false);
      return;
    }

    try {
      setLoading(true); // Start loading

      // Fetch the Verse of the Day
      const verseOfTheDay = await getVerseOfTheDay();

      // Log the full response to understand its structure
      console.log("Full Verse of the Day Response:", verseOfTheDay);

      // Check if we received the expected response
      if (verseOfTheDay && 'citation' in verseOfTheDay && 'passage' in verseOfTheDay) {
        console.log("Verse of the Day:", verseOfTheDay); // Log the verse of the day to console
        setVerseOfTheDay({
          citation: verseOfTheDay.citation.toString(),
          passage: verseOfTheDay.passage.toString(),
        });
      } else {
        // Handle case when structure is unexpected
        throw new Error("Invalid response structure from API.");
      }
    } catch (error) {
      console.error("Failed to fetch the verse of the day:", error); // Log the error
      setError(`Failed to fetch the verse of the day: ${error instanceof Error ? error.message : error}`); // Show the error to the user
    } finally {
      setLoading(false); // Stop loading after the request completes
    }
  };

  // Call logVerseOfTheDay when the component is mounted
  useEffect(() => {
    logVerseOfTheDay();
  }, [serverAPI]);

  return (
    <div>
      <h1>Logged Information from GlowStudent API</h1>

      {loading && <p>Loading verse of the day...</p>} {/* Loading state */}
      
      {error && !loading && (  // Error display
        <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '10px' }}>
          <h2>Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      {verseOfTheDay && !loading && (
        <div>
          <h2>Verse of the Day</h2>
          <p><strong>{verseOfTheDay.citation}</strong></p>
          <p>{verseOfTheDay.passage}</p>
        </div>
      )}
    </div>
  );
};

export default definePlugin((serverAPI: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>YouVersion</div>,
    content: <Content serverAPI={serverAPI} />,
    icon: <FaBible />,
  };
});
