import { definePlugin, ServerAPI, staticClasses, Focusable } from "decky-frontend-lib";
import { useEffect, useState, VFC, useRef } from "react";
import { FaBible } from "react-icons/fa";
import booksData from './books.json'; 
import versesData from './verses.json';

// Define the Content component for displaying Verse of the Day and Book/Chapter selection
const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [books] = useState(booksData.books);  // Loaded from books.json
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [chapters, setChapters] = useState<number[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<string[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [verseText, setVerseText] = useState<string>("");

  const [verseOfTheDay, setVerseOfTheDay] = useState<{
    citation: string;
    passage: string;
    images: string[];
    version: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const scrollToTopRef = useRef<HTMLDivElement>(null);  // Scroll to top reference

  // Function to handle WebSocket connection and receive VOTD data
  const fetchVerseOfTheDay = (): void => {
    setLoading(true);
    console.log("Connecting to WebSocket for Verse of the Day...");

    // Replace with actual WebSocket endpoint
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
  };

  useEffect(() => {
    fetchVerseOfTheDay();  // Fetch VOTD via WebSocket when component mounts
  }, [serverAPI]);  // Re-run when serverAPI changes

  // Update available chapters for the selected book
  useEffect(() => {
    if (selectedBook) {
      const bookData = books.find(book => book.book === selectedBook);
      if (bookData) {
        setChapters(Array.from({ length: bookData.chapters }, (_, i) => i + 1));
      }
    }
  }, [selectedBook]);

  // Fetch all verses for the selected chapter
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      const chapterVerses = Object.keys(versesData)
        .filter(key => key.startsWith(`${selectedBook} ${selectedChapter}:`))
        .map(key => key.split(':')[1]); // Extract verse number

      setVerses(chapterVerses); // Set the verses for the selected chapter
    }
  }, [selectedBook, selectedChapter]);

  // Fetch individual verse content when selected
  useEffect(() => {
    if (selectedBook && selectedChapter && selectedVerse) {
      (async () => {
        try {
          let verse = await getVerse(selectedBook, selectedChapter.toString(), selectedVerse.toString());
          if (verse && 'passage' in verse && typeof verse.passage === 'string') {
            setVerseText(verse.passage);
          } else {
            const verseKey = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
            const offlineVerse = versesData[verseKey];
            if (offlineVerse) {
              setVerseText(offlineVerse);
            } else {
              setVerseText("Verse not found.");
            }
          }
        } catch (error) {
          const verseKey = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
          const offlineVerse = versesData[verseKey];
          if (offlineVerse) {
            setVerseText(offlineVerse);
          } else {
            setVerseText("Verse not found.");
          }
        }
      })();
    }
  }, [selectedBook, selectedChapter, selectedVerse]);

  // Construct the title for the selected chapter
  const selectedChapterTitle = selectedBook && selectedChapter
    ? `${selectedBook} Chapter ${selectedChapter}`
    : "Selected Chapter";

  // Format the reference for the selected verse
  const selectedVerseReference = selectedBook && selectedChapter && selectedVerse
    ? `${selectedBook} ${selectedChapter}:${selectedVerse}`
    : "";

  // Handle the "Next" button behavior to move to the next chapter
  const handleNextChapter = () => {
    if (selectedBook && selectedChapter !== null) {
      const bookData = books.find(book => book.book === selectedBook);
      if (bookData) {
        const nextChapter = selectedChapter + 1;
        if (nextChapter <= bookData.chapters) {
          setSelectedChapter(nextChapter);
          scrollToTopRef.current?.scrollIntoView({ behavior: 'smooth' }); // Scroll to top
        } else {
          // Optionally, move to next book if there's no next chapter
          const nextBookIndex = books.findIndex(book => book.book === selectedBook) + 1;
          if (nextBookIndex < books.length) {
            setSelectedBook(books[nextBookIndex].book);
            setSelectedChapter(1); // Move to first chapter of the next book
          }
        }
      }
    }
  };

  // Read aloud a given verse or passage
  const readVerseAloud = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  return (
    <div ref={scrollToTopRef} style={{ padding: '20px', backgroundColor: '#fff' }}>
      {verseOfTheDay && (
        <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '5px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <h2>Verse of the Day</h2>
          <p><strong>{verseOfTheDay.citation}</strong></p>
          <p>{verseOfTheDay.passage}</p>
          <button onClick={() => readVerseAloud(`${verseOfTheDay.citation}: ${verseOfTheDay.passage}`)} style={{ marginTop: '10px', padding: '10px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px' }}>Read Aloud</button>
        </div>
      )}

      {/* Verse Text Display for individual selected verse */}
      {verseText && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '5px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <h2>{selectedVerseReference}</h2>
          <p>{verseText}</p>
          <button onClick={() => readVerseAloud(verseText)} style={{ marginTop: '10px', padding: '10px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px' }}>Read Aloud</button>
        </div>
      )}

      {/* Full Chapter Display */}
      {verses.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '5px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <h2>{selectedChapterTitle}</h2>
          <div>
            {verses.map((verse) => (
              <button
                key={verse}
                onClick={() => setSelectedVerse(verse)}
                style={{
                  margin: '5px',
                  padding: '10px 15px',
                  background: selectedVerse === verse ? '#28a745' : '#6f42c1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Verse {verse}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Page Navigation */}
      <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Focusable onActivate={() => setSelectedChapter(selectedChapter! - 1)}>
          <button
            style={{
              padding: '10px',
              background: selectedChapter === 1 ? '#6c757d' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedChapter === 1 ? 'not-allowed' : 'pointer',
            }}
            disabled={selectedChapter === 1}
          >
            Previous
          </button>
        </Focusable>

        <Focusable onActivate={handleNextChapter}>
          <button
            style={{
              padding: '10px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Next
          </button>
        </Focusable>
      </div>
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
