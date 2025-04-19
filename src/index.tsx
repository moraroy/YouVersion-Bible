import { definePlugin, ButtonItem } from "decky-frontend-lib";
import { useState, useRef, useEffect } from "react";
import { FaBible } from "react-icons/fa";
import { useVOTD } from './getVOTD';  
import { useUpdateInfo } from './getUpdate';
import books from './books.json';    
import verses from './verses.json';  

import { Scrollable, ScrollArea, scrollableRef } from './Scrollable';

const Content = () => {
  const { verseOfTheDay } = useVOTD();
  const { updateInfo } = useUpdateInfo();
  const [page, setPage] = useState(0);  
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);

  const verseRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollRef = scrollableRef();

  const handleNextChapter = () => {
    if (selectedBook && selectedChapter) {
      setPage(2);  
    }
  };

  const scrollToVerse = (verseKey: string) => {
    if (verseRefs.current[verseKey]) {
      verseRefs.current[verseKey]?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (page === 3 && selectedVerseKey) {
      setTimeout(() => scrollToVerse(selectedVerseKey), 100);
    }
  }, [page, selectedVerseKey]);

  const updateAvailable = updateInfo?.status === "Update available";

  return (
    <div style={{ padding: '20px' }}>
      {page === 0 && verseOfTheDay && (
        <div 
          style={{
            marginBottom: '20px', 
            background: '#f9f9f9', 
            padding: '30px 10px 10px 10px',
            borderRadius: '5px',
            position: 'relative',
          }}
        >
          {updateAvailable && (
            <div 
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'red', 
                color: 'white', 
                padding: '10px 20px',
                borderRadius: '5px',
                fontSize: '14px', 
                fontWeight: 'bold',
                cursor: 'pointer',
                zIndex: 10,
              }}
              onClick={() => alert('Update Available!')}
            >
              New Update Available!
            </div>
          )}

          <h2>Verse of the Day</h2>
          <p><strong>{verseOfTheDay.citation}</strong></p>
          <p>{verseOfTheDay.passage}</p>
          <p><em>Version: {verseOfTheDay.version}</em></p>

          {verseOfTheDay.images && verseOfTheDay.images.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Images for Verse of the Day</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {verseOfTheDay.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Image for ${verseOfTheDay.citation}`}
                    style={{ width: '100px', height: 'auto', borderRadius: '5px' }}
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <ButtonItem 
              onClick={() => scrollToVerse(verseOfTheDay.citation)} 
            >
              Go To
            </ButtonItem>
          </div>
        </div>
      )}

      {page === 0 && (
        <>
          <h1>Select a Book</h1>
          <div
            style={{
              backgroundColor: '#007bff',
              borderRadius: '10px',
              padding: '20px',
              margin: '10px',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
              {books.books.map((book) => (
                <div key={book.book} style={{ backgroundColor: '#007bff', borderRadius: '8px', padding: '10px', margin: '5px' }}>
                  <ButtonItem onClick={() => { setSelectedBook(book.book); setPage(1); }}>
                    {book.book}
                  </ButtonItem>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {page === 1 && selectedBook && (
        <>
          <h1>Select a Chapter</h1>
          <div
            style={{
              backgroundColor: '#28a745',
              borderRadius: '10px',
              padding: '20px',
              margin: '10px',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
              {Array.from({ length: books.books.find(book => book.book === selectedBook)?.chapters || 0 }, (_, index) => (
                <div
                  key={index + 1}
                  style={{
                    backgroundColor: '#28a745',
                    borderRadius: '8px',
                    padding: '10px',
                    margin: '5px',
                  }}
                >
                  <ButtonItem 
                    onClick={() => { setSelectedChapter(index + 1); setPage(2); }}
                  >
                    Chapter {index + 1}
                  </ButtonItem>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {page === 2 && selectedBook && selectedChapter && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h2>Select a Verse</h2>
            <div
              style={{
                backgroundColor: '#6f42c1',
                borderRadius: '10px',
                padding: '20px',
                margin: '10px',
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                {Object.keys(verses)
                  .filter((verseKey) => verseKey.startsWith(`${selectedBook} ${selectedChapter}:`))
                  .map((verseKey) => (
                    <div 
                      key={verseKey}
                      style={{
                        backgroundColor: '#6f42c1',
                        borderRadius: '8px',
                        padding: '10px',
                        margin: '5px',
                        textAlign: 'center',
                      }}
                    >
                      <ButtonItem
                        onClick={() => {
                          setSelectedVerseKey(verseKey);
                          setPage(3);
                        }}
                      >
                        {verseKey.split(':')[1]}
                      </ButtonItem>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}

      {page === 3 && selectedBook && selectedChapter && (
        <>
          <h1>{selectedBook} Chapter {selectedChapter}</h1>
          <Scrollable ref={scrollRef}>
            <ScrollArea scrollable={scrollRef}>
              {Object.keys(verses)
                .filter((verseKey) => verseKey.startsWith(`${selectedBook} ${selectedChapter}:`))
                .map((verseKey) => (
                  <div key={verseKey} style={{ marginBottom: '10px' }} ref={(el) => verseRefs.current[verseKey] = el}>
                    <p>
                      <sup style={{ color: '#6f42c1', fontSize: '14px' }}>{verseKey.split(':')[1]}</sup> {verses[verseKey]}
                    </p>
                  </div>
                ))}
            </ScrollArea>
          </Scrollable>
        </>
      )}

      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <ButtonItem
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
        >
          Previous
        </ButtonItem>
        <ButtonItem
          onClick={handleNextChapter}
        >
          Next
        </ButtonItem>
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
