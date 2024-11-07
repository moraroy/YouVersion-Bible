import { definePlugin, ServerAPI, staticClasses } from "decky-frontend-lib";
import { useEffect, useState, VFC } from "react";
import { FaBible } from "react-icons/fa";
import { getVerseOfTheDay, getVerse } from "@glowstudent/youversion";
import notify from './notify';
import booksData from './books.json';
import versesData from './verses.json'; // Import verses.json

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
  
    // Display the verse of the day as a toast notification when the plugin is loaded
    (async () => {
      try {
        const verseOfTheDay = await getVerseOfTheDay();
        if (verseOfTheDay && 'citation' in verseOfTheDay && 'passage' in verseOfTheDay) {
          notify.toast(verseOfTheDay.citation.toString(), verseOfTheDay.passage.toString());
          // Also set the verse of the day in the state
          setVerseOfTheDay({ citation: verseOfTheDay.citation.toString(), passage: verseOfTheDay.passage.toString() });
        }
      } catch (error) {
        console.error("Failed to fetch the verse of the day:", error);
      }
    })();
  }, []);

  useEffect(() => {
    // When a book is selected, fetch the chapters in that book
    if (selectedBook) {
      const bookData = books.find(book => book.book === selectedBook);
      if (bookData) {
        setChapters(Array.from({ length: bookData.chapters }, (_, i) => i + 1));
      }
    }
    console.log('selectedBook:', selectedBook);
    console.log('chapters:', chapters);
  }, [selectedBook]);

  useEffect(() => {
    // When a book and a chapter are selected, fetch the verses in that chapter
    if (typeof selectedBook === 'string' && selectedChapter) {
      getVerse(selectedBook, selectedChapter.toString(), "1-10")
        .then((response) => {
          console.log('Response from getVerse (verses):', response);
          if (response && 'verses' in response && Array.isArray(response.verses)) {
            setVerses(response.verses);
          } else {
            // Fallback to local verses.json if API call fails or returns empty
            const chapterVerses = Object.keys(versesData)
              .filter(key => key.startsWith(`${selectedBook} ${selectedChapter}:`))
              .map(key => key.split(':')[1]);
            setVerses(chapterVerses);
          }
        });
    }
    console.log('selectedChapter:', selectedChapter);
    console.log('verses:', verses);
  }, [selectedBook, selectedChapter]);
  
  useEffect(() => {
    // When a book, a chapter, and a verse are selected, fetch the text of that verse
    if (typeof selectedBook === 'string' && selectedChapter && selectedVerse) {
      (async () => {
        try {
          let verse = await getVerse(selectedBook, selectedChapter.toString(), selectedVerse.toString());
          if (verse && 'passage' in verse && typeof verse.passage === 'string') {
            setVerseText(verse.passage);
          } else {
            // Fallback to local verses.json if API call fails or returns empty
            const verseKey = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
            const offlineVerse = versesData[verseKey];
            if (offlineVerse) {
              setVerseText(offlineVerse);
            } else {
              setVerseText("Verse not found.");
            }
          }
        } catch (error) {
          console.error("Failed to fetch the verse:", error);
          // Fallback to local verses.json if API call fails
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
    console.log('selectedVerse:', selectedVerse);
    console.log('verseText:', verseText);
  }, [selectedBook, selectedChapter, selectedVerse]);

  return (
    <div>
      {verseOfTheDay && (
        <div>
          <h2>Verse of the Day</h2>
          <p>{verseOfTheDay.citation}</p>
          <p>{verseOfTheDay.passage}</p>
        </div>
      )}
      {page === 0 && (
        <>
          <h1>Select a Book</h1>
          <ul>
            {books.map(book => (
              <li key={book.book} tabIndex={0} onKeyDown={(event) => {if (event.key === 'Enter') {setSelectedBook(book.book.toString()); setPage(1);}}} onClick={() => {setSelectedBook(book.book.toString()); setPage(1);}}>
                {book.book}
              </li>
            ))}
          </ul>
        </>
      )}
  
      {page === 1 && (
        <>
          <h1>Select a Chapter</h1>
          <ul>
            {chapters.map(chapter => (
              <li key={chapter} tabIndex={0} onKeyDown={(event) => {if (event.key === 'Enter') {setSelectedChapter(chapter); setPage(2);}}} onClick={() => {setSelectedChapter(chapter); setPage(2);}}>
                {chapter}
              </li>
            ))}
          </ul>
        </>
      )}
  
      {page === 2 && (
        <>
          <h1>Select a Verse</h1>
          <ul>
            {verses.map((verse, index) => (
              <li key={index} tabIndex={0} onKeyDown={(event) => {if (event.key === 'Enter') setSelectedVerse(verse);}} onClick={() => setSelectedVerse(verse)}>
                {verse}
              </li>
            ))}
          </ul>
        </>
      )}
  
      {selectedVerse && (
        <>
          <h1>Verse Text</h1>
          <p>{verseText}</p>
        </>
      )}
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
