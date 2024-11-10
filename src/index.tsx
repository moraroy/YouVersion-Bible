import { definePlugin, ServerAPI, staticClasses, Focusable, ButtonItem } from "decky-frontend-lib";
import { useEffect, useState, VFC, useRef } from "react";
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

  const scrollToTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notify.setServer(serverAPI);

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
      const chapterVerses = Object.keys(versesData)
        .filter(key => key.startsWith(`${selectedBook} ${selectedChapter}:`))
        .map(key => key.split(':')[1]);

      setVerses(chapterVerses);
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

  const selectedChapterTitle = selectedBook && selectedChapter
    ? `${selectedBook} Chapter ${selectedChapter}`
    : "Selected Chapter";

  const selectedVerseReference = selectedBook && selectedChapter && selectedVerse
    ? `${selectedBook} ${selectedChapter}:${selectedVerse}`
    : "";

  const handleNextChapter = () => {
    if (selectedBook && selectedChapter !== null) {
      const bookData = books.find(book => book.book === selectedBook);
      if (bookData) {
        const nextChapter = selectedChapter + 1;
        if (nextChapter <= bookData.chapters) {
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

  const readVerseAloud = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
  };

  return (
    <div ref={scrollToTopRef} style={{ padding: '20px' }}>
      {verseOfTheDay && (
        <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
          <h2>Verse of the Day</h2>
          <p><strong>{verseOfTheDay.citation}</strong></p>
          <p>{verseOfTheDay.passage}</p>
          <ButtonItem layout="below" onClick={() => readVerseAloud(`${verseOfTheDay.citation}: ${verseOfTheDay.passage}`)}>
            Read Aloud
          </ButtonItem>
        </div>
      )}

      {verseText && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
          <h2>{selectedVerseReference}</h2>
          <p>{verseText}</p>
          <ButtonItem layout="below" onClick={() => readVerseAloud(verseText)}>
            Read Aloud
          </ButtonItem>
        </div>
      )}

      {verses.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
          <h2>{selectedChapterTitle}</h2>
          <div>
            {verses.map((verse, index) => {
              const verseKey = `${selectedBook} ${selectedChapter}:${verse}`;
              return (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <Focusable onActivate={() => { 
                    setSelectedVerse(verse); 
                    scrollToTopRef.current?.scrollIntoView({ behavior: 'smooth' });  
                  }}>
                    <ButtonItem layout="below">
                      Verse {verse}
                    </ButtonItem>
                  </Focusable>
                  <p>{versesData[verseKey]}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {page === 0 && (
        <>
          <h1>Select a Book</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {books.map(book => (
              <Focusable key={book.book} onActivate={() => { setSelectedBook(book.book); setPage(1); }}>
                <ButtonItem layout="below">
                  {book.book}
                </ButtonItem>
              </Focusable>
            ))}
          </div>
        </>
      )}

      {page === 1 && selectedBook && (
        <>
          <h1>Select a Chapter</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
            {chapters.map(chapter => (
              <Focusable key={chapter} onActivate={() => { setSelectedChapter(chapter); setPage(2); }}>
                <ButtonItem layout="below">
                  Chapter {chapter}
                </ButtonItem>
              </Focusable>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Focusable onActivate={() => page > 0 && setPage(page - 1)}>
          <ButtonItem layout="below" disabled={page === 0}>
            Previous
          </ButtonItem>
        </Focusable>
        
        <Focusable onActivate={handleNextChapter}>
          <ButtonItem layout="below">
            Next
          </ButtonItem>
        </Focusable>
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
