import { definePlugin, ServerAPI, staticClasses, Focusable } from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
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

  return (
    <div style={{ padding: '20px' }}>
      {verseOfTheDay && (
        <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
          <h2>Verse of the Day</h2>
          <p><strong>{verseOfTheDay.citation}</strong></p>
          <p>{verseOfTheDay.passage}</p>
        </div>
      )}

      {/* Verse Text Display for individual selected verse */}
      {verseText && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
          <h2>Selected Verse</h2>
          <p>{verseText}</p>
        </div>
      )}

      {/* Full Chapter Display */}
      {verses.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
          <h2>{selectedChapterTitle}</h2>
          <div>
            {verses.map((verse, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <Focusable onActivate={() => setSelectedVerse(verse)}>
                  <button style={{
                    padding: '5px 10px',  // Reduced padding for smaller button
                    fontSize: '14px',  // Smaller font size
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}>
                    Verse {verse}
                  </button>
                </Focusable>
                <p>{`Verse ${verse}`}: {versesData[`${selectedBook} ${selectedChapter}:${verse}`]}</p> {/* Show verse content */}
              </div>
            ))}
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
                <button style={{ padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
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
                <button style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  Chapter {chapter}
                </button>
              </Focusable>
            ))}
          </div>
        </>
      )}

      {/* Pagination Controls */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => setPage(page === 0 ? 0 : page - 1)}
          disabled={page === 0}
          style={{ padding: '10px 20px', marginRight: '10px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Previous
        </button>
        <button
          onClick={() => setPage(page === 2 ? 2 : page + 1)}
          disabled={page === 2}
          style={{ padding: '10px 20px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Next
        </button>
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
