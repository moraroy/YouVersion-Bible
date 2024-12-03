import { definePlugin, ButtonItem } from "decky-frontend-lib";
import { useState, useRef } from "react";
import { FaBible } from "react-icons/fa";
import { useVOTD } from './getVOTD';  
import books from './books.json';    
import verses from './verses.json';  

// Content component displaying Verse of the Day
const Content = () => {
  const { verseOfTheDay } = useVOTD();
  const [page, setPage] = useState(0);  
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  // State to track new update availability
  const [updateAvailable, setUpdateAvailable] = useState(false);

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
      setPage(2);  
    }
  };

  // Scroll to the selected verse when a purple button is clicked
  const scrollToVerse = (verseKey: string) => {
    if (verseRefs.current[verseKey]) {
      verseRefs.current[verseKey]?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Simulate an update check
  const checkForUpdates = () => {
    // Simulate an update being available (for testing)
    setUpdateAvailable(true);
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* New Update Indicator */}
      {updateAvailable && (
        <div style={{
          position: 'absolute', 
          top: '20px', 
          right: '20px', 
          backgroundColor: 'red', 
          color: 'white', 
          padding: '10px 15px', 
          borderRadius: '50%', 
          fontSize: '14px', 
          fontWeight: 'bold',
          cursor: 'pointer',
        }} onClick={() => setUpdateAvailable(false)}>
          New
        </div>
      )}

      {/* Simulate an update check button */}
      <button 
        onClick={checkForUpdates} 
        style={{ position: 'absolute', top: '50px', right: '20px' }}>
        Check for Updates
      </button>

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
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {books.books.map((book) => (
              <div key={book.book}>
                <ButtonItem onClick={() => { setSelectedBook(book.book); setPage(1); }}>
                  {book.book}
                </ButtonItem>
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
              <div key={index + 1}>
                <ButtonItem onClick={() => { setSelectedChapter(index + 1); setPage(2); }}>
                  Chapter {index + 1}
                </ButtonItem>
              </div>
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
                  <div key={verseKey}>
                    <ButtonItem
                      onClick={() => scrollToVerse(verseKey)} // Scroll to the selected verse
                    >
                      {verseKey.split(':')[1]} {/* Display the verse number */}
                    </ButtonItem>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Page 2 - Display Verses with Superscript Numbers */}
      {page === 2 && selectedBook && selectedChapter && (
        <>
          <h1>{selectedBook} Chapter {selectedChapter}</h1>
          <div
            style={{
              maxHeight: '500px',  // Adjust this height as needed
              overflowY: 'auto',  // Enable vertical scrolling only for verses
            }}
          >
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
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
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
