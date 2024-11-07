import { definePlugin, ServerAPI, staticClasses } from "decky-frontend-lib";
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
  const [verses, setVerses] = useState<string[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [verseText, setVerseText] = useState<string>("");

  const [page, setPage] = useState<number>(0);
  const [verseOfTheDay, setVerseOfTheDay] = useState<{ citation: string, passage: string } | null>(null);

  useEffect(() => {
    // Set the serverAPI in the notify class
    notify.setServer(serverAPI);

    // Display the verse of the day as a toast notification
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

  useEffect(() => {
    if (selectedBook) {
      const bookData = books.find(book => book.book === selectedBook);
      if (bookData) {
        setChapters(Array.from({ length: bookData.chapters }, (_, i) => i + 1));
      }
    }
  }, [selectedBook]);

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      getVerse(selectedBook, selectedChapter.toString(), "1-10")
        .then((response) => {
          if (response && 'verses' in response && Array.isArray(response.verses)) {
            setVerses(response.verses);
          } else {
            const chapterVerses = Object.keys(versesData)
              .filter(key => key.startsWith(`${selectedBook} ${selectedChapter}:`))
              .map(key => key.split(':')[1]);
            setVerses(chapterVerses);
          }
        });
    }
  }, [selectedBook, selectedChapter]);

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

  return (
    <div style={{ padding: '20px' }}>
      {verseOfTheDay && (
        <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
          <h2>Verse of the Day</h2>
          <p><strong>{verseOfTheDay.citation}</strong></p>
          <p>{verseOfTheDay.passage}</p>
        </div>
      )}

      {/* Page Navigation */}
      {page === 0 && (
        <>
          <h1>Select a Book</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {books.map(book => (
              <button
                key={book.book}
                onClick={() => { setSelectedBook(book.book); setPage(1); }}
                style={{ padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                {book.book}
              </button>
            ))}
          </div>
        </>
      )}

      {page === 1 && selectedBook && (
        <>
          <h1>Select a Chapter</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
            {chapters.map(chapter => (
              <button
                key={chapter}
                onClick={() => { setSelectedChapter(chapter); setPage(2); }}
                style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Chapter {chapter}
              </button>
            ))}
          </div>
        </>
      )}

      {page === 2 && selectedChapter && (
        <>
          <h1>Select a Verse</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
            {verses.map((verse, index) => (
              <button
                key={index}
                onClick={() => setSelectedVerse(verse)}
                style={{ padding: '10px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Verse {verse}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedVerse && (
        <>
          <h1>Verse Text</h1>
          <p>{verseText}</p>
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
