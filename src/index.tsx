import {
  definePlugin,
  ServerAPI,
  staticClasses,
} from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { FaBible } from "react-icons/fa";

// Define the Content component
const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [verseOfTheDay, setVerseOfTheDay] = useState<{
    citation: string;
    passage: string;
    images: string[];  // Added images field
    version: string;   // Added version field
  } | null>(null);
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
      console.log("Fetching Verse of the Day...");

      // Fetch the Verse of the Day from the backend (main.py server)
      const response = await fetch("http://localhost:8777/api/verse-of-the-day");

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const fetchError = `Error: ${response.statusText}`;
        console.error(fetchError); // Log the fetch error
        setError(fetchError); // Show the error to the user
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Log the full response to understand its structure
      console.log("Full Verse of the Day Response:", JSON.stringify(data, null, 2));

      // Check if we received the expected response
      if (!data) {
        const noDataMsg = "No data received from the API.";
        console.error(noDataMsg); // Log the error
        setError(noDataMsg); // Show the error to the user
        setLoading(false);
        return;
      }

      // Destructure the response to get citation, passage, images, and version
      const { citation, passage, images, version } = data;

      // Log the checks
      console.log("Checking structure of the response...");
      console.log("Citation: ", citation);
      console.log("Passage: ", passage);
      console.log("Version: ", version);
      console.log("Images: ", images);

      if (citation && passage) {
        console.log("Verse of the Day: Valid structure");
        setVerseOfTheDay({
          citation: citation.toString(),
          passage: passage.toString(),
          images: images ?? [], // Ensure images is always an array
          version: version ?? "Unknown", // Default version if not found
        });
      } else {
        const invalidStructureMsg = `Invalid structure: Missing fields. Citation: ${citation}, Passage: ${passage}`;
        console.error(invalidStructureMsg); // Log the error
        setError(invalidStructureMsg); // Show the error to the user
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
    console.log("Component mounted. Calling logVerseOfTheDay...");
    logVerseOfTheDay();
  }, [serverAPI]); // Ensure the effect runs when serverAPI is available

  return (
    <div>
      <h1>Verse of the Day</h1>

      {loading && <p>Loading verse of the day...</p>} {/* Loading state */}
      
      {error && !loading && (  // Error display
        <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '10px' }}>
          <h2>Error:</h2>
          <p>{error}</p>
        </div>
      )}
      
      {verseOfTheDay && !loading && (
        <div>
          <h2>{verseOfTheDay.citation}</h2>
          <p>{verseOfTheDay.passage}</p>
          <p><em>Version: {verseOfTheDay.version}</em></p>
          
          {verseOfTheDay.images.length > 0 && (
            <div>
              <h3>Images:</h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {verseOfTheDay.images.map((image, index) => (
                  <img key={index} src={image} alt={`Image ${index + 1}`} style={{ maxWidth: '100%', marginBottom: '10px' }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default definePlugin((serverAPI: ServerAPI) => {
  console.log("Defining plugin...");

  return {
    title: <div className={staticClasses.Title}>YouVersion</div>,
    content: <Content serverAPI={serverAPI} />,
    icon: <FaBible />,
  };
});