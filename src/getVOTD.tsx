import { useState, useEffect } from 'react';

interface VerseOfTheDay {
  citation: string;
  passage: string;
  images: string[];
  version: string;
}

export const useVOTD = () => {
  const [verseOfTheDay, setVerseOfTheDay] = useState<VerseOfTheDay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // New state to track if an update is available
  const [updateAvailable, setUpdateAvailable] = useState<boolean | null>(null);

  // WebSocket connection to fetch Verse of the Day data and update check
  const fetchVerseOfTheDay = (): (() => void) => {
    setLoading(true);
    console.log("Connecting to WebSocket for Verse of the Day...");

    const socket = new WebSocket("ws://localhost:8777/votd_ws");

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    // Handle Verse of the Day message
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received WebSocket message:", data);

      // Check if the message contains verse of the day data
      if (data.error) {
        setError(data.error);
      } else if (data.citation) {
        const { citation, passage, images, version } = data;
        setVerseOfTheDay({
          citation: citation.toString(),
          passage: passage.toString(),
          images: images ?? [],
          version: version ?? "Unknown",
        });
      }

      // Check for update availability
      if (data.status === "Up-to-date") {
        setUpdateAvailable(false);
      } else if (data.status === "Update Available") {
        setUpdateAvailable(true);
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

    return () => {
      socket.close();
    };
  };

  useEffect(() => {
    const socketCleanup = fetchVerseOfTheDay();
    return () => {
      socketCleanup();  // Cleanup WebSocket connection on unmount
    };
  }, []);

  return { verseOfTheDay, error, loading, updateAvailable };
};
