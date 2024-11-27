import { definePlugin, ButtonItem } from "decky-frontend-lib";  // Import ButtonItem from decky-frontend-lib
import { useState, useRef } from "react";
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
  const [focusedBookIndex, setFocusedBookIndex] = useState<number | null>(null); // To manage keyboard navigation

  // Create a ref object for each verse
  const verseRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  // Scroll to the selected verse when a purple button is clicked
  const scrollToVerse = (verseKey: string) => {
    if (verseRefs.current[verseKey]) {
      verseRefs.current[verseKey]?.scrollIntoView({ behavior: 'smooth' });
    }
    setSelectedVerse(verseKey); // Update the selected verse state
  };

  // Handle keyboard navigation for book selection
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (page === 0 && books.books.length > 0) {
      if (event.key === 'ArrowDown') {
        setFocusedBookIndex((prevIndex) => (prevIndex === null || prevIndex === books.books.length - 1 ? 0 : prevIndex + 1));
      } else if (event.key === 'ArrowUp') {
        setFocusedBookIndex((prevIndex) => (prevIndex === null || prevIndex === 0 ? books.books.length - 1 : prevIndex - 1));
      } else if (event.key === 'Enter' && focusedBookIndex !== null) {
        const book = books.books[focusedBookIndex];
        setSelectedBook(book.book);
        setPage(1);
      }
    }
  };

  return (
    <div style={{ padding: '20px' }} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Verse of the Day Section - Only on Page 0 */}
      {page === 0 && verseOfTheDay && (
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
            {books.books.map((book, index) => (
              <div key={book.book} style={{ position: 'relative' }}>
                {/* Book Button */}
                <button
                  onClick={() => { setSelectedBook(book.book); setPage(1); }}
                  onFocus={() => setFocusedBookIndex(index)} // Update the focused book index on focus
                  style={{
                    padding: '10px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease',
                    backgroundColor: selectedBook === book.book ? '#28a745' : '#007bff',
                    outline: focusedBookIndex === index ? '3px solid #ffeb3b' : 'none', // Highlight focused button
                  }}
                >
                  {book.book}
                </button>

                {/* ButtonItem component wrapped in a div for styling */}
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    padding: '10px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    opacity: 0, // Make it invisible but still clickable
                  }}
                >
                  <ButtonItem
                    onClick={() => { setSelectedBook(book.book); setPage(1); }}
                  >
                    Select {book.book}
                  </ButtonItem>
                </div>
              </div>
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
                  background: '#28a745', // Green color
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'background 0.3s ease',
                  backgroundColor: selectedChapter === index + 1 ? '#28a745' : '#28a745', // Keep the green color
                }}
              >
                Chapter {index + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Page 2 - Display Purple Verse Buttons */}
      {page === 2 && selectedBook && selectedChapter && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h2>Select a Verse</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
              {Object.keys(verses)
                .filter((verseKey) => verseKey.startsWith(`${selectedBook} ${selectedChapter}:`)) // Filter verses of the selected chapter
                .map((verseKey) => (
                  <button
                    key={verseKey}
                    onClick={() => scrollToVerse(verseKey)} // Scroll to the selected verse
                    style={{
                      padding: '10px',
                      background: '#6f42c1', // Purple color
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      transition: 'background 0.3s ease',
                      backgroundColor: selectedVerse === verseKey ? '#28a745' : '#6f42c1',
                    }}
                  >
                    {verseKey.split(':')[1]} {/* Display the verse number */}
                  </button>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Page 2 - Display Verses with Superscript Numbers */}
      {page === 2 && selectedBook && selectedChapter && (
        <>
          <h1>{selectedBook} Chapter {selectedChapter}</h1>
          <div>
            {Object.keys(verses)
              .filter((verseKey) => verseKey.startsWith(`${selectedBook} ${selectedChapter}:`))
              .map((verseKey) => (
                <div key={verseKey} style={{ marginBottom: '10px' }} ref={(el) => verseRefs.current[verseKey] = el}>
                  <p>
                    <sup style={{ color: '#6f42c1', fontSize: '14px' }}>{verseKey.split(':')[1]}</sup> {verses[verseKey]}
                  </p>
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
