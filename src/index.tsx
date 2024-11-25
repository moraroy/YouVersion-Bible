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

  // Function to handle WebSocket connection and receive VOTD data
  const fetchVerseOfTheDay = (): void => {
    setLoading(true);
    console.log("Connecting to WebSocket for Verse of the Day...");

    // Connect to the WebSocket server
    const socket = new WebSocket("ws://localhost:8777/votd_ws");

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received Verse of the Day:", data);

      if (data.error) {
        setError(data.error);
      } else {
        // Set the verse data in state
        const { citation, passage, images, version } = data;
        setVerseOfTheDay({
          citation: citation.toString(),
          passage: passage.toString(),
          images: images ?? [],
          version: version ?? "Unknown",
        });
      }
      setLoading(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("WebSocket error occurred.");
      setLoading(false);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };
  };

  useEffect(() => {
    fetchVerseOfTheDay(); // Fetch VOTD via WebSocket when the component mounts
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
