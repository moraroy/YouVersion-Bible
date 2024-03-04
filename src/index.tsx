import { useEffect, useState, FC } from 'react';
import {
  definePlugin,
  staticClasses,
} from "decky-frontend-lib";
import { FaBible } from "react-icons/fa";
import { getVerseOfTheDay, getVerse } from "@glowstudent/youversion";
import notify from './notify';
import booksData from './books.json';

// Display the verse of the day as a toast notification when the plugin is loaded
(async () => {
  try {
    const verseOfTheDay = await getVerseOfTheDay();
    if (verseOfTheDay && 'citation' in verseOfTheDay && 'passage' in verseOfTheDay) {
      notify.toast(verseOfTheDay.citation.toString(), verseOfTheDay.passage.toString());
    }
  } catch (error) {
    console.error("Failed to fetch the verse of the day:", error);
  }
})();

const Content: FC = () => {
  const [books] = useState(booksData.books);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [chapters, setChapters] = useState<number[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<string[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [verseText, setVerseText] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    // When a book is selected, fetch the chapters in that book
    if (selectedBook) {
      const bookData = books.find(book => book.book === selectedBook);
      if (bookData) {
        setChapters(Array.from({length: bookData.chapters}, (_, i) => i + 1));
      }
    }
    console.log('selectedBook:', selectedBook);
    console.log('chapters:', chapters);
  }, [selectedBook, chapters]);
  
  useEffect(() => {
    // When a book and a chapter are selected, fetch the verses in that chapter
    if (selectedBook && selectedChapter) {
      getVerse(selectedBook, selectedChapter.toString(), "1-10")
        .then(response => {
          console.log('Response from getVerse (verses):', response);
          if (response && 'verses' in response && Array.isArray(response.verses)) {
            setVerses(response.verses);
          }
        });
    }
    console.log('selectedChapter:', selectedChapter);
    console.log('verses:', verses);
  }, [selectedBook, selectedChapter, verses]);
  
  useEffect(() => {
    // When a book, a chapter, and a verse are selected, fetch the text of that verse
    if (selectedBook && selectedChapter && selectedVerse) {
      getVerse(selectedBook, selectedChapter.toString(), selectedVerse)
        .then(response => {
          console.log('Response from getVerse (verse text):', response);
          if (response && 'passage' in response && typeof response.passage === 'string') {
            setVerseText(response.passage);
          }
        });
    }
    console.log('selectedVerse:', selectedVerse);
    console.log('verseText:', verseText);
  }, [selectedBook, selectedChapter, selectedVerse, verseText]);

  return (
    <div>
      {page === 0 && (
        <>
          <h1>Select a Book</h1>
          <ul>
            {books.map(book => (
              <li key={book.book} tabIndex={0} onKeyDown={(event) => {if (event.key === 'Enter') {setSelectedBook(book.book); setPage(1);}}} onClick={() => {setSelectedBook(book.book); setPage(1);}}>
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

export default definePlugin(() => {
  return {
    title: <div className={staticClasses.Title}>YouVersion</div>,
    content: <Content />,
    icon: <FaBible />,
  };
});