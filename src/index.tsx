import { definePlugin, ServerAPI, staticClasses } from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { FaBible } from "react-icons/fa";

// Define the Content component for displaying Verse of the Day
const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [verseOfTheDay, setVerseOfTheDay] = useState<{
    citation: string;
    passage: string;
    images: string[];
    version: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Verse of the Day from the backend
  const fetchVerseOfTheDay = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log("Fetching Verse of the Day...");

      // Fetch the Verse of the Day from the backend (assuming it's served at http://localhost:8777/votd)
      const response = await fetch("http://localhost:8777/votd");

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();

      // Check if we received the expected response
      if (!data) {
        throw new Error("No data received from the API.");
      }

      // Destructure the response to get citation, passage, images, and version
      const { citation, passage, images, version } = data;

      if (citation && passage) {
        setVerseOfTheDay({
          citation: citation.toString(),
          passage: passage.toString(),
          images: images ?? [],
          version: version ?? "Unknown",
        });
      } else {
        throw new Error(`Invalid structure: Missing fields. Citation: ${citation}, Passage: ${passage}`);
      }
    } catch (error) {
      console.error("Failed to fetch the verse of the day:", error);
      setError(`Failed to fetch the verse of the day: ${error instanceof Error ? error.message : error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerseOfTheDay(); // Fetch VOTD when the component mounts
  }, [serverAPI]);

  return (
    <div>
      <h1>Verse of the Day</h1>

      {loading && <p>Loading verse of the day...</p>}

      {error && !loading && (
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

// Define the Decky plugin to render the content
export default definePlugin((serverAPI: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>YouVersion</div>,
    content: <Content serverAPI={serverAPI} />,
    icon: <FaBible />,
  };
});
