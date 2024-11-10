import { definePlugin, staticClasses, ButtonItem } from "decky-frontend-lib";
import { useEffect, useState, VFC, useRef } from "react";
import { FaBible } from "react-icons/fa";
import versesData from './verses.json';

interface BookData {
  book: string;
  chapters: number[];
}

const Content: VFC = () => {
  const [books, setBooks] = useState<BookData[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<string[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [verseText, setVerseText] = useState<string>("");
  const [page, setPage] = useState<number>(0);

  const scrollToTopRef = useRef<HTMLDivElement>(null);

  // Organize the books and chapters from versesData
  useEffect(() => {
    const bookMap: Record<string, Set<number>> = {};  // Store chapters by book name

    Object.keys(versesData).forEach((key) => {
      // Skip malformed or unwanted keys (like "#")
      if (key.startsWith("#")) return;

      const [book, chapterAndVerse] = key.split(" ");
      const chapter = parseInt(chapterAndVerse.split(":")[0]);

      // Fix for books with numbers like "1 Kings", "2 Kings"
      const correctedBookName = book.replace(/^(\d+)/, (match) => match.padStart(2, "0")); // Ensure book names like "1 Kings" are parsed correctly

      // Check if the chapter is a valid number
      if (isNaN(chapter)) return;

      if (!bookMap[correctedBookName]) {
        bookMap[correctedBookName] = new Set();
      }
      bookMap[correctedBookName].add(chapter);
    });

    // Convert the bookMap into an array of BookData (book and number of chapters)
    const bookList = Object.keys(bookMap).map((book) => ({
      book,
      chapters: Array.from(bookMap[book]).sort((a, b) => a - b), // Sorting chapters numerically
    }));

    setBooks(bookList);
  }, []);

  // Update verses when a chapter is selected
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      const chapterVerses = Object.keys(versesData)
        .filter(key => key.startsWith(`${selectedBook} ${selectedChapter}:`))
        .map(key => key.split(':')[1]);

      setVerses(chapterVerses);
    }
  }, [selectedBook, selectedChapter]);

  // Fetch verse text when a specific verse is selected
  useEffect(() => {
    if (selectedBook && selectedChapter && selectedVerse) {
      const verseKey = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
      const verseText = versesData[verseKey];

      if (verseText) {
        setVerseText(verseText);
      } else {
        setVerseText("Verse not found.");
      }
    }
  }, [selectedBook, selectedChapter, selectedVerse]);

  const handleNextChapter = () => {
    if (selectedBook && selectedChapter !== null) {
      const bookData = books.find(book => book.book === selectedBook);
      if (bookData) {
        const nextChapter = selectedChapter + 1;
        if (nextChapter <= bookData.chapters.length) {
          setSelectedChapter(nextChapter);
          scrollToTopRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
          const nextBookIndex = books.findIndex(book => book.book === selectedBook) + 1;
          if (nextBookIndex < books.length) {
            setSelectedBook(books[nextBookIndex].book);
            setSelectedChapter(1);
          }
        }
      }
    }
  };

  return (
    <div ref={scrollToTopRef} style={{ padding: '20px' }}>
      {verseText && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
          <h2>{selectedBook} {selectedChapter}:{selectedVerse}</h2>
          <p>{verseText}</p>
        </div>
      )}

      {/* Book and Chapter Selection */}
      {page === 0 && (
        <>
          <h1>Select a Book</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {books.map(book => (
              <ButtonItem key={book.book} layout="below" onClick={() => { setSelectedBook(book.book); setPage(1); }}>
                {book.book}
              </ButtonItem>
            ))}
          </div>
        </>
      )}

      {page === 1 && selectedBook && (
        <>
          <h1>Select a Chapter</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
            {books.find(book => book.book === selectedBook)?.chapters.map((chapter) => (
              <ButtonItem key={chapter} layout="below" onClick={() => { setSelectedChapter(chapter); setPage(2); }}>
                Chapter {chapter}
              </ButtonItem>
            ))}
          </div>
        </>
      )}

      {page === 2 && selectedChapter && selectedBook && (
        <>
          <h1>Chapter {selectedChapter} of {selectedBook}</h1>
          <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
            {verses.map((verse) => (
              <ButtonItem key={verse} layout="below" onClick={() => setSelectedVerse(verse)}>
                Verse {verse}
              </ButtonItem>
            ))}
          </div>
        </>
      )}

      {verseText && selectedVerse && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
          <h2>{selectedBook} {selectedChapter}:{selectedVerse}</h2>
          <p>{verseText}</p>
        </div>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <ButtonItem layout="below" disabled={page === 0} onClick={() => page > 0 && setPage(page - 1)}>
          Previous
        </ButtonItem>
        
        <ButtonItem layout="below" onClick={handleNextChapter}>
          Next
        </ButtonItem>
      </div>
    </div>
  );
};

export default definePlugin(() => {
  return {
    title: <div className={staticClasses.Title}>Bible Plugin</div>,
    content: <Content />,
    icon: <FaBible />,
  };
});
