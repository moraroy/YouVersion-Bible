import { definePlugin, ServerAPI, staticClasses, Focusable } from "decky-frontend-lib";
import { useEffect, useState, VFC, useRef } from "react";
import { FaBible } from "react-icons/fa";
import { getVerseOfTheDay, getVerse } from "@glowstudent/youversion";
import notify from './notify';
import booksData from './books.json';
import versesData from './verses.json';

interface BookData {
  book: string;
  chapters: number;
}

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const [books] = useState<BookData[]>(booksData.books);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [chapters, setChapters] = useState<number[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<string[]>([]);  // Store all verses for selected chapter
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [verseText, setVerseText] = useState<string>("");

  const [page, setPage] = useState<number>(0);
  const [verseOfTheDay, setVerseOfTheDay] = useState<{ citation: string, passage: string } | null>(null);

  const scrollToTopRef = useRef<HTMLDivElement>(null); // Reference for snapping back to top

  // Set server API for notifications
  useEffect(() => {
    notify.setServer(serverAPI);

    (async () => {
      try {
        const verseOfTheDay = await getVerseOfTheDay();
        if (verseOfTheDay && 'citation' in verseOfTheDay && 'passage' in verseOfTheDay) {
          notify.toast(verseOfTheDay.citation.toString(), verseOfTheDay.passage.toString());
          setVerseOfTheDay({ citation: verseOfTheDay.citation.toString(), passage: verseOfTheDay.passage.toString() });
        }
      } catch (error) {
        console.error("Failed to fetch the verse of the day:", error);
      }
    })();
  }, []);

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
    <div ref={scrollToTopRef} style={{ padding: '20px' }}>
      {verseOfTheDay && (
        <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
          <h2>Verse of the Day</h2>
          <p><strong>{verseOfTheDay.citation}</strong></p>
          <p>{verseOfTheDay.passage}</p>
          <button onClick={() => readVerseAloud(`${verseOfTheDay.citation}: ${verseOfTheDay.passage}`)} style={{ marginTop: '10px' }}>Read Aloud</button>
        </div>
      )}

      {/* Verse Text Display for individual selected verse */}
      {verseText && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
          <h2>{selectedVerseReference}</h2>
          <p>{verseText}</p>
          <button onClick={() => readVerseAloud(verseText)} style={{ marginTop: '10px' }}>Read Aloud</button>
        </div>
      )}

      {/* Full Chapter Display */}
      {verses.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
          <h2>{selectedChapterTitle}</h2>
          <div>
            {verses.map((verse, index) => {
              const verseKey = `${selectedBook} ${selectedChapter}:${verse}`;
              return (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <Focusable onActivate={() => { 
                    setSelectedVerse(verse); 
                    scrollToTopRef.current?.scrollIntoView({ behavior: 'smooth' });  // Scroll to top
                  }}>
                    <button
                      style={{
                        padding: '10px',
                        background: '#6f42c1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        outline: selectedVerse === verse ? '3px solid #28a745' : 'none', // Highlight selected button
                        transition: 'outline 0.3s ease, background 0.3s ease', // Smooth transition for background and outline
                        backgroundColor: selectedVerse === verse ? '#28a745' : '#6f42c1', // Change background when selected
                      }}
                    >
                      Verse {verse}
                    </button>
                  </Focusable>
                  {/* Show the verse content */}
                  <p>{versesData[verseKey]}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Page Navigation */}
      {page === 0 && (
        <>
          <h1>Select a Book</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {books.map(book => (
              <Focusable key={book.book} onActivate={() => { setSelectedBook(book.book); setPage(1); }}>
                <button
                  style={{
                    padding: '10px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    outline: selectedBook === book.book ? '3px solid #28a745' : 'none', // Highlight selected button
                    transition: 'outline 0.3s ease, background 0.3s ease', // Smooth transition for background and outline
                    backgroundColor: selectedBook === book.book ? '#28a745' : '#007bff', // Change background when selected
                  }}
                >
                  {book.book}
                </button>
              </Focusable>
            ))}
          </div>
        </>
      )}

      {page === 1 && selectedBook && (
        <>
          <h1>Select a Chapter</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
            {chapters.map(chapter => (
              <Focusable key={chapter} onActivate={() => { setSelectedChapter(chapter); setPage(2); }}>
                <button
                  style={{
                    padding: '10px',
                    background: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    outline: selectedChapter === chapter ? '3px solid #28a745' : 'none', // Highlight selected button
                    transition: 'outline 0.3s ease, background 0.3s ease', // Smooth transition for background and outline
                    backgroundColor: selectedChapter === chapter ? '#28a745' : '#28a745', // Highlight chapter
                  }}
                >
                  Chapter {chapter}
                </button>
              </Focusable>
            ))}
          </div>
        </>
      )}

      {/* Pagination Controls */}
      <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Focusable onActivate={() => page > 0 && setPage(page - 1)}>
          <button
            style={{
              padding: '10px',
              background: page === 0 ? '#6c757d' : '#007bff', // Disabled button if page is 0
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              outline: page === 0 ? 'none' : '3px solid #28a745', // Highlight on focus
              transition: 'outline 0.3s ease', // Smooth highlight transition
            }}
            disabled={page === 0}
          >
            Previous
          </button>
        </Focusable>
        
        <Focusable onActivate={handleNextChapter}>
          <button
            style={{
              padding: '10px',
              background: '#007bff', // Default background
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              outline: 'none', // Remove default outline, we handle focus separately
              transition: 'outline 0.3s ease', // Smooth highlight transition
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
