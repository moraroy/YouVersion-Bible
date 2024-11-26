import { definePlugin } from "decky-frontend-lib";
import { useState } from "react";
import { FaBible } from "react-icons/fa";
import { useVOTD } from './getVOTD';  // Import the custom hook
import books from './books.json';    // Import books data
import verses from './verses.json';  // Import verses data

// Content component displaying Verse of the Day
const Content = () => {
  const { verseOfTheDay } = useVOTD();
  const [page, setPage] = useState(0);  // Page state for navigation
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);

  // Speech Synthesis handler
  const readVerseAloud = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  // Handle Next Chapter button click
  const handleNextChapter = () => {
    if (selectedBook && selectedChapter) {
      const chapterKey = `${selectedBook} ${selectedChapter}:1`;  // Start at chapter 1
      setSelectedVerse(chapterKey);
      setPage(2);  // Move to verses page
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Verse of the Day Section */}
      {verseOfTheDay && (
        <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
          <h2>Verse of the Day</h2>
          <p><strong>{verseOfTheDay.citation}</strong></p>
          <p>{verseOfTheDay.passage}</p>
          <button onClick={() => readVerseAloud(`${verseOfTheDay.citation}: ${verseOfTheDay.passage}`)} style={{ marginTop: '10px', background: '#28a745', color: '#fff', padding: '10px 15px', borderRadius: '5px', border: 'none' }}>
            Read Aloud
          </button>
        </div>
      )}

      {/* Page 0 - Select Book */}
      {page === 0 && (
        <>
          <h1>Select a Book</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {books.books.map((book) => (
              <button
                key={book.book}
                onClick={() => { setSelectedBook(book.book); setPage(1); }}
                style={{
                  padding: '10px',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease',
                  backgroundColor: selectedBook === book.book ? '#28a745' : '#007bff',
                }}
              >
                {book.book}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Page 1 - Select Chapter */}
      {page === 1 && selectedBook && (
        <>
          <h1>Select a Chapter</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
            {Array.from({ length: books.books.find(book => book.book === selectedBook)?.chapters || 0 }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => { setSelectedChapter(index + 1); setPage(2); }}
                style={{
                  padding: '10px',
                  background: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease',
                  backgroundColor: selectedChapter === index + 1 ? '#28a745' : '#6c757d',
                }}
              >
                Chapter {index + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Page 2 - Display Verses */}
      {page === 2 && selectedBook && selectedChapter && (
        <>
          <h1>{selectedBook} Chapter {selectedChapter}</h1>
          <div>
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index + 1} style={{ marginBottom: '10px' }}>
                <button
                  onClick={() => setSelectedVerse(`${selectedBook} ${selectedChapter}:${index + 1}`)}
                  style={{
                    padding: '10px',
                    background: '#6f42c1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease',
                    backgroundColor: selectedVerse === `${selectedBook} ${selectedChapter}:${index + 1}` ? '#28a745' : '#6f42c1',
                  }}
                >
                  Verse {index + 1}
                </button>
                <p>{verses[`${selectedBook} ${selectedChapter}:${index + 1}`]}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination Controls */}
      <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          style={{
            padding: '10px',
            background: page === 0 ? '#6c757d' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: page === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>
        <button
          onClick={handleNextChapter}
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
      </div>
    </div>
  );
};

export default definePlugin(() => {
  return {
    title: <div>Verse of the Day</div>,
    content: <Content />,
    icon: <FaBible />,
  };
});
