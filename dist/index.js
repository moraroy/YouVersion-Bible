(function (React, deckyFrontendLib) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

  var DefaultContext = {
    color: undefined,
    size: undefined,
    className: undefined,
    style: undefined,
    attr: undefined
  };
  var IconContext = React__default["default"].createContext && React__default["default"].createContext(DefaultContext);

  var __assign = window && window.__assign || function () {
    __assign = Object.assign || function (t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };
  var __rest = window && window.__rest || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
    }
    return t;
  };
  function Tree2Element(tree) {
    return tree && tree.map(function (node, i) {
      return React__default["default"].createElement(node.tag, __assign({
        key: i
      }, node.attr), Tree2Element(node.child));
    });
  }
  function GenIcon(data) {
    // eslint-disable-next-line react/display-name
    return function (props) {
      return React__default["default"].createElement(IconBase, __assign({
        attr: __assign({}, data.attr)
      }, props), Tree2Element(data.child));
    };
  }
  function IconBase(props) {
    var elem = function (conf) {
      var attr = props.attr,
        size = props.size,
        title = props.title,
        svgProps = __rest(props, ["attr", "size", "title"]);
      var computedSize = size || conf.size || "1em";
      var className;
      if (conf.className) className = conf.className;
      if (props.className) className = (className ? className + " " : "") + props.className;
      return React__default["default"].createElement("svg", __assign({
        stroke: "currentColor",
        fill: "currentColor",
        strokeWidth: "0"
      }, conf.attr, attr, svgProps, {
        className: className,
        style: __assign(__assign({
          color: props.color || conf.color
        }, conf.style), props.style),
        height: computedSize,
        width: computedSize,
        xmlns: "http://www.w3.org/2000/svg"
      }), title && React__default["default"].createElement("title", null, title), props.children);
    };
    return IconContext !== undefined ? React__default["default"].createElement(IconContext.Consumer, null, function (conf) {
      return elem(conf);
    }) : elem(DefaultContext);
  }

  // THIS FILE IS AUTO GENERATED
  function FaBible (props) {
    return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M448 358.4V25.6c0-16-9.6-25.6-25.6-25.6H96C41.6 0 0 41.6 0 96v320c0 54.4 41.6 96 96 96h326.4c12.8 0 25.6-9.6 25.6-25.6v-16c0-6.4-3.2-12.8-9.6-19.2-3.2-16-3.2-60.8 0-73.6 6.4-3.2 9.6-9.6 9.6-19.2zM144 144c0-8.84 7.16-16 16-16h48V80c0-8.84 7.16-16 16-16h32c8.84 0 16 7.16 16 16v48h48c8.84 0 16 7.16 16 16v32c0 8.84-7.16 16-16 16h-48v112c0 8.84-7.16 16-16 16h-32c-8.84 0-16-7.16-16-16V192h-48c-8.84 0-16-7.16-16-16v-32zm236.8 304H96c-19.2 0-32-12.8-32-32s16-32 32-32h284.8v64z"}}]})(props);
  }

  const YouVersion$1 = require("@glowstudent/youversion");
  class notify {
      /**
       * Sets the interop's severAPI.
       * @param serv The ServerAPI for the interop to use.
       */
      static setServer(serv) {
          this.serverAPI = serv;
      }
      static toast(title, message) {
          return (() => {
              try {
                  return this.serverAPI.toaster.toast({
                      title: title,
                      body: message,
                      duration: 8000,
                  });
              }
              catch (e) {
                  console.log("Toaster Error", e);
              }
          })();
      }
      static async toastVerseOfTheDay() {
          try {
              const verseOfTheDay = await YouVersion$1.getVerseOfTheDay();
              this.toast(verseOfTheDay.citation, verseOfTheDay.passage);
          }
          catch (error) {
              console.error("Failed to fetch the verse of the day:", error);
          }
      }
  }

  const YouVersion = require("@glowstudent/youversion");
  // Display the verse of the day as a toast notification when the plugin is loaded
  (async () => {
      try {
          const verseOfTheDay = await YouVersion.getVerseOfTheDay();
          notify.toast('Verse of the Day', verseOfTheDay.passage);
      }
      catch (error) {
          console.error("Failed to fetch the verse of the day:", error);
      }
  })();
  const Content = () => {
      const [books, setBooks] = React.useState([]);
      const [selectedBook, setSelectedBook] = React.useState(null);
      const [chapters, setChapters] = React.useState([]);
      const [selectedChapter, setSelectedChapter] = React.useState(null);
      const [verses, setVerses] = React.useState([]);
      const [selectedVerse, setSelectedVerse] = React.useState(null);
      const [verseText, setVerseText] = React.useState("");
      React.useEffect(() => {
          // Fetch the list of books when the component is mounted
          setBooks(Object.keys(YouVersion.books));
      }, []);
      React.useEffect(() => {
          // When a book is selected, fetch the chapters in that book
          if (selectedBook) {
              YouVersion.getChapters(selectedBook).then(setChapters);
          }
      }, [selectedBook]);
      React.useEffect(() => {
          // When a chapter is selected, fetch the verses in that chapter
          if (selectedBook && selectedChapter) {
              YouVersion.getVerses(selectedBook, selectedChapter).then(setVerses);
          }
      }, [selectedBook, selectedChapter]);
      React.useEffect(() => {
          // When a verse is selected, fetch the text of that verse
          if (selectedBook && selectedChapter && selectedVerse) {
              YouVersion.getVerse(selectedBook, selectedChapter, selectedVerse).then(setVerseText);
          }
      }, [selectedBook, selectedChapter, selectedVerse]);
      return (window.SP_REACT.createElement("div", null,
          window.SP_REACT.createElement("h1", null, "Select a Book"),
          window.SP_REACT.createElement("ul", null, books.map(book => (window.SP_REACT.createElement("li", { key: book, onClick: () => setSelectedBook(book) }, book)))),
          selectedBook && (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
              window.SP_REACT.createElement("h1", null, "Select a Chapter"),
              window.SP_REACT.createElement("ul", null, chapters.map(chapter => (window.SP_REACT.createElement("li", { key: chapter, onClick: () => setSelectedChapter(chapter) }, chapter)))))),
          selectedChapter && (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
              window.SP_REACT.createElement("h1", null, "Select a Verse"),
              window.SP_REACT.createElement("ul", null, verses.map(verse => (window.SP_REACT.createElement("li", { key: verse, onClick: () => setSelectedVerse(verse) }, verse)))))),
          selectedVerse && (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
              window.SP_REACT.createElement("h1", null, "Verse Text"),
              window.SP_REACT.createElement("p", null, verseText)))));
  };
  var index = deckyFrontendLib.definePlugin(() => {
      return {
          title: window.SP_REACT.createElement("div", { className: deckyFrontendLib.staticClasses.Title }, "YouVersion"),
          content: window.SP_REACT.createElement(Content, null),
          icon: window.SP_REACT.createElement(FaBible, null),
      };
  });

  return index;

})(SP_REACT, DFL);
