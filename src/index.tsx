import { definePlugin, ButtonItem } from "decky-frontend-lib";
import { useState, useRef } from "react";
import { FaBible } from "react-icons/fa";
import { useVOTD } from './getVOTD';  
import { useUpdateInfo } from './getUpdate'; // Import the custom useUpdateInfo hook
import books from './books.json';    
import verses from './verses.json';  

// Content component displaying Verse of the Day
const Content = () => {
  const { verseOfTheDay } = useVOTD();
  const { updateInfo } = useUpdateInfo();  // Use the custom hook for update info
  const [page, setPage] = useState(0);  
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  // Create a ref object for each verse
  const verseRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Speech Synthesis handler
  //const readVerseAloud = (text: string) => {
    //const speech = new SpeechSynthesisUtterance(text);
    //window.speechSynthesis.speak(speech);
  //};

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

  // Check if an update is available based on the status
  const updateAvailable = updateInfo?.status === "Update available";

  return (
    <div style={{ padding: '20px' }}>
      {/* Verse of the Day Section - Only on Page 0 */}
      {page === 0 && verseOfTheDay && (
        <div 
          style={{
            marginBottom: '20px', 
            background: '#f9f9f9', 
            padding: '30px 10px 10px 10px', // Add padding on top to make space for the notification
            borderRadius: '5px',
            position: 'relative', // Position relative to allow absolute positioning of the notification
          }}
        >
          {/* New Update Indicator - Now inside the Verse of the Day card */}
          {updateAvailable && (
            <div 
              style={{
                position: 'absolute',
                top: '10px', // Adjust the distance from the top of the card
                right: '10px', // Adjust the distance from the right of the card
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
          <p><em>Version: {verseOfTheDay.version}</em></p> {/* Display Version */}

          {/* Display Images if available */}
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
          {/* Go To and Read Aloud buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Go To button */}
            <ButtonItem 
              onClick={() => scrollToVerse(verseOfTheDay.citation)} 
            >
              Go To
            </ButtonItem>
            {/* Read Aloud button */}
            {/* <ButtonItem 
              onClick={() => readVerseAloud(`${verseOfTheDay.citation}: ${verseOfTheDay.passage}`)} 
            >
              Read Aloud
            </ButtonItem> */}
          </div>
        </div>
      )}

      {/* Page 0 - Select Book */}
      {page === 0 && (
        <>
          <h1>Select a Book</h1>
          {/* Wrap all books in one card container */}
          <div
            style={{
              backgroundColor: '#007bff', // Light background for the card
              borderRadius: '10px', // Rounded corners for the card
              padding: '20px', // Add some padding inside the card
              margin: '10px', // Margin around the card
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Optional shadow for the card
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

      {/* Page 1 - Select Chapter */}
      {page === 1 && selectedBook && (
        <>
          <h1>Select a Chapter</h1>
          {/* Wrap all chapters in one card container */}
          <div
            style={{
              backgroundColor: '#28a745',  // Green background for the card container
              borderRadius: '10px',        // Rounded corners for the card
              padding: '20px',             // Padding inside the card
              margin: '10px',              // Margin around the card
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Optional shadow for the card
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
              {Array.from({ length: books.books.find(book => book.book === selectedBook)?.chapters || 0 }, (_, index) => (
                <div
                  key={index + 1}
                  style={{
                    backgroundColor: '#28a745',  // Green background for chapter cards
                    borderRadius: '8px',        // Rounded corners for chapter cards
                    padding: '10px',            // Padding around the button
                    margin: '5px',              // Margin between the buttons
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

      {/* Page 2 - Display Verse Buttons under One Card */}
      {page === 2 && selectedBook && selectedChapter && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h2>Select a Verse</h2>
            {/* Wrap all verse buttons inside one card container */}
            <div
              style={{
                backgroundColor: '#6f42c1',  // Purple background for the verse card container
                borderRadius: '10px',        // Rounded corners for the card
                padding: '20px',             // Padding inside the card
                margin: '10px',              // Margin around the card
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Optional shadow for the card
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                {Object.keys(verses)
                  .filter((verseKey) => verseKey.startsWith(`${selectedBook} ${selectedChapter}:`)) // Filter verses of the selected chapter
                  .map((verseKey) => (
                    <div 
                      key={verseKey}
                      style={{
                        backgroundColor: '#6f42c1',  // Purple background for verse cards
                        borderRadius: '8px',         // Rounded corners
                        padding: '10px',             // Padding inside the card
                        margin: '5px',               // Margin between the cards
                        textAlign: 'center',         // Center the text inside
                      }}
                    >
                      <ButtonItem
                        onClick={() => scrollToVerse(verseKey)} // Scroll to the selected verse
                      >
                        {verseKey.split(':')[1]} {/* Display the verse number */}
                      </ButtonItem>
                    </div>
                  ))}
              </div>
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
        {/* Previous Button */}
        <ButtonItem
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
        >
          Previous
        </ButtonItem>
        {/* Next Button */}
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