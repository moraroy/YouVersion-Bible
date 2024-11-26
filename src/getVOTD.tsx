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

  // WebSocket connection to fetch Verse of the Day data
  const fetchVerseOfTheDay = (): (() => void) => {
    setLoading(true);
    console.log("Connecting to WebSocket for Verse of the Day...");

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

  return { verseOfTheDay, error, loading };
};
