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
  }, [serverAPI]);

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
        .map(key => key.split(':')[1]);  // Extract verse number

      setVerses(chapterVerses);  // Set verses for the selected chapter
    }
  }, [selectedBook, selectedChapter]);

  // Fetch individual verse content when selected
  useEffect(() => {
    if (selectedBook && selectedChapter && selectedVerse) {
      const verseKey = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
      const verseContent = versesData[verseKey];

      setVerseText(verseContent || "Verse not found.");
    }
  }, [selectedBook, selectedChapter, selectedVerse]);

  return (
    <div ref={scrollToTopRef} style={{ padding: '20px' }}>
      {/* Verse of the Day Section */}
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

      {/* Book Selection */}
      <div>
        <h1>Select a Book</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
          {books.map(book => (
            <Focusable key={book.book} onActivate={() => { setSelectedBook(book.book); setChapters([]); }}>
              <button style={{ padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px' }}>
                {book.book}
              </button>
            </Focusable>
          ))}
        </div>
      </div>

      {/* Chapter Selection */}
      {selectedBook && (
        <div>
          <h2>Select a Chapter for {selectedBook}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
            {chapters.map(chapter => (
              <Focusable key={chapter} onActivate={() => { setSelectedChapter(chapter); setVerses([]); }}>
                <button style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px' }}>
                  Chapter {chapter}
                </button>
              </Focusable>
            ))}
          </div>
        </div>
      )}

      {/* Verse Selection */}
      {selectedBook && selectedChapter && verses.length > 0 && (
        <div>
          <h2>Verses for {selectedBook} Chapter {selectedChapter}</h2>
          <div>
            {verses.map((verse, index) => (
              <div key={index}>
                <Focusable onActivate={() => { setSelectedVerse(verse); }}>
                  <button style={{ padding: '10px', background: '#6f42c1', color: '#fff', border: 'none', borderRadius: '5px' }}>
                    Verse {verse}
                  </button>
                </Focusable>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Verse Content */}
      {selectedVerse && (
        <div>
          <h3>{`${selectedBook} ${selectedChapter}:${selectedVerse}`}</h3>
          <p>{verseText}</p>
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
