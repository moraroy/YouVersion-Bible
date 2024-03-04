import { useEffect, useState, FC } from 'react';
import {
  definePlugin,
  staticClasses,
} from "decky-frontend-lib";
import { FaBible } from "react-icons/fa";
const YouVersion = require("@glowstudent/youversion");
import notify from './notify';

// Display the verse of the day as a toast notification when the plugin is loaded
(async () => {
  try {
    const verseOfTheDay = await YouVersion.getVerseOfTheDay();
    notify.toast('Verse of the Day', verseOfTheDay.passage);
  } catch (error) {
    console.error("Failed to fetch the verse of the day:", error);
  }
})();

const Content: FC = () => {
  const [books, setBooks] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [verses, setVerses] = useState([]);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [verseText, setVerseText] = useState("");

  useEffect(() => {
    // Fetch the list of books when the component is mounted
    setBooks(Object.keys(YouVersion.books));
  }, []);

  useEffect(() => {
    // When a book is selected, fetch the chapters in that book
    if (selectedBook) {
      YouVersion.getChapters(selectedBook).then(setChapters);
    }
  }, [selectedBook]);

  useEffect(() => {
    // When a chapter is selected, fetch the verses in that chapter
    if (selectedBook && selectedChapter) {
      YouVersion.getVerses(selectedBook, selectedChapter).then(setVerses);
    }
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    // When a verse is selected, fetch the text of that verse
    if (selectedBook && selectedChapter && selectedVerse) {
      YouVersion.getVerse(selectedBook, selectedChapter, selectedVerse).then(setVerseText);
    }
  }, [selectedBook, selectedChapter, selectedVerse]);

  return (
    <div>
      <h1>Select a Book</h1>
      <ul>
        {books.map(book => (
          <li key={book} onClick={() => setSelectedBook(book)}>
            {book}
          </li>
        ))}
      </ul>

      {selectedBook && (
        <>
          <h1>Select a Chapter</h1>
          <ul>
            {chapters.map(chapter => (
              <li key={chapter} onClick={() => setSelectedChapter(chapter)}>
                {chapter}
              </li>
            ))}
          </ul>
        </>
      )}

      {selectedChapter && (
        <>
          <h1>Select a Verse</h1>
          <ul>
            {verses.map(verse => (
              <li key={verse} onClick={() => setSelectedVerse(verse)}>
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